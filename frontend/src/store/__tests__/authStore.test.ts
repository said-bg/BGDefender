import { useAuthStore } from '../authStore';
import * as authService from '@/services/auth';
import { User, UserRole, UserPlan } from '@/types';

jest.mock('@/services/auth');

const mockAuthService = authService as jest.Mocked<typeof authService>;

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  firstName: null,
  lastName: null,
  occupation: null,
  role: UserRole.USER,
  plan: UserPlan.FREE,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,
      postLogoutRedirectPath: null,
      error: null,
    });

    jest.clearAllMocks();
  });

  describe('setters', () => {
    it('should set user', () => {
      const mockUser = createMockUser();
      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
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
      mockAuthService.login.mockResolvedValue({ user: mockUser });

      await useAuthStore.getState().login('test@example.com', 'Password123');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().login('test@example.com', 'WrongPassword'),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
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
      expect(state.isAuthenticated).toBe(false);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    it('should handle register error', async () => {
      const mockError = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(mockError);

      await expect(
        useAuthStore.getState().register('test@example.com', 'Password123'),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear auth state', () => {
      const mockUser = createMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      mockAuthService.logout.mockReturnValue(undefined);

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update the current user profile fields', async () => {
      const updatedUser = createMockUser({
        firstName: 'Said',
        lastName: 'Ait',
        occupation: 'Security Analyst',
      });

      useAuthStore.setState({
        user: createMockUser(),
        isAuthenticated: true,
      });

      mockAuthService.updateProfile.mockResolvedValue(updatedUser);

      await useAuthStore.getState().updateProfile({
        firstName: 'Said',
        lastName: 'Ait',
        occupation: 'Security Analyst',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should return the success message from the API', async () => {
      mockAuthService.changePassword.mockResolvedValue({
        message: 'Password updated successfully',
      });

      const result = await useAuthStore
        .getState()
        .changePassword('Password123', 'NewPassword123');

      expect(result).toBe('Password updated successfully');
      expect(mockAuthService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'Password123',
        newPassword: 'NewPassword123',
      });
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('initializeAuth', () => {
    it('should initialize with a valid authenticated session', async () => {
      const mockUser = createMockUser();
      mockAuthService.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should initialize to signed-out state when session fetch fails', async () => {
      mockAuthService.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should always set isInitialized even on network error', async () => {
      mockAuthService.getMe.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().isInitialized).toBe(true);
    });
  });
});
