import { useAuthStore } from '../authStore';
import * as authService from '@/services/auth';
import * as tokenStorage from '@/services/utils/tokenStorage';
import { User, UserRole, UserPlan } from '@/types';

// Mock the services
jest.mock('@/services/auth');
jest.mock('@/services/utils/tokenStorage');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

/**
 * Factory to create a mock user with proper types
 */
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  role: UserRole.USER,
  plan: UserPlan.FREE,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,
      error: null,
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('setters', () => {
    it('should set user', () => {
      const mockUser = createMockUser();
      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should set token and update isAuthenticated', () => {
      useAuthStore.getState().setToken('test-token');

      expect(useAuthStore.getState().token).toBe('test-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should clear token and update isAuthenticated', () => {
      useAuthStore.getState().setToken('test-token');
      useAuthStore.getState().setToken(null);

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should set loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error', () => {
      const error = 'Test error';
      useAuthStore.getState().setError(error);

      expect(useAuthStore.getState().error).toBe(error);
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        accessToken: 'test-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      await useAuthStore.getState().login('test@example.com', 'Password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('test-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().login('test@example.com', 'WrongPassword')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });


  });

  describe('register', () => {
    it('should successfully register user', async () => {
      mockAuthService.register.mockResolvedValue(undefined);

      await useAuthStore.getState().register('test@example.com', 'Password123');

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false); // Register doesn't auto-login
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    it('should handle register error', async () => {
      const mockError = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().register('test@example.com', 'Password123')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear auth state', () => {
      // Set initial state
      const mockUser = createMockUser();
      useAuthStore.setState({
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
      });

      mockAuthService.logout.mockReturnValue(undefined);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('initializeAuth', () => {
    it('should initialize with no token', async () => {
      mockTokenStorage.getToken.mockReturnValue(null);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(mockAuthService.getMe).not.toHaveBeenCalled();
    });

    it('should initialize with valid token', async () => {
      const mockUser = createMockUser();
      mockTokenStorage.getToken.mockReturnValue('valid-token');
      mockAuthService.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBe('valid-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle token validation failure', async () => {
      mockTokenStorage.getToken.mockReturnValue('invalid-token');
      mockAuthService.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should always set isInitialized even on error', async () => {
      mockTokenStorage.getToken.mockReturnValue('token');
      mockAuthService.getMe.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().isInitialized).toBe(true);
    });
  });
});
