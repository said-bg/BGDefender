/**
 * Auth Store (Zustand)
 * Global state management for authentication
 * 
 * Handles:
 * - Current user state
 * - JWT token management
 * - Authentication actions (login, register, logout)
 * - Loading states
 * - Authentication status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '@/types/api';
import * as authService from '@/services/auth';
import { getToken } from '@/services/utils/tokenStorage';
import { getApiErrorMessage } from '@/utils/apiError';

/**
 * Auth Store State and Actions
 */
export interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;

  // Setters
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateProfile: (
    profile: Partial<Pick<User, 'firstName' | 'lastName' | 'occupation'>>
  ) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

/**
 * Create Zustand store with devtools (no persistence - using tokenStorage instead)
 */
export const useAuthStore = create<AuthState>()(
  devtools((set, get) => ({
        // Initial state
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isInitialized: false,
        error: null,

        // ==================== SETTERS ====================

        setUser: (user) => {
          set({ user });
        },

        setToken: (token) => {
          set({
            token,
            isAuthenticated: !!token,
          });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setError: (error) => {
          set({ error });
        },

        // ==================== AUTH ACTIONS ====================

        /**
         * Login user
         * - Call login API
         * - Save user and token to state
         * - Token already saved to localStorage by authService
         */
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await authService.login({ email, password });

            set({
              user: response.user,
              token: response.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (err) {
            const errorMessage = getApiErrorMessage(err, 'Login failed');

            set({
              error: errorMessage,
              isLoading: false,
            });

            throw err;
          }
        },

        /**
         * Register new user
         * - Call register API
         * - Does NOT auto-login (user must login after)
         */
        register: async (email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            await authService.register({ email, password });

            set({
              isLoading: false,
              error: null,
            });
          } catch (err) {
            const errorMessage = getApiErrorMessage(err, 'Registration failed');

            set({
              error: errorMessage,
              isLoading: false,
            });

            throw err;
          }
        },

        /**
         * Update editable profile fields and keep the current user in sync.
         */
        updateProfile: async (profile) => {
          set({ isLoading: true, error: null });

          try {
            const updatedUser = await authService.updateProfile(profile);

            set({
              user: updatedUser,
              isLoading: false,
              error: null,
            });
          } catch (err) {
            const errorMessage = getApiErrorMessage(err, 'Failed to update profile');

            set({
              error: errorMessage,
              isLoading: false,
            });

            throw err;
          }
        },

        /**
         * Change the authenticated user's password from the account page.
         */
        changePassword: async (currentPassword: string, newPassword: string) => {
          set({ isLoading: true, error: null });

          try {
            const response = await authService.changePassword({
              currentPassword,
              newPassword,
            });

            set({
              isLoading: false,
              error: null,
            });

            return response.message;
          } catch (err) {
            const errorMessage = getApiErrorMessage(err, 'Failed to change password');

            set({
              error: errorMessage,
              isLoading: false,
            });

            throw err;
          }
        },

        /**
         * Logout user
         * - Clear user and token from state
         * - Remove token from localStorage
         * - Mark as not authenticated
         */
        logout: () => {
          authService.logout(); // Removes token from localStorage

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        },

        /**
         * Fetch current user from API
         * - Used to revalidate user after page refresh
         * - Called on app initialization
         */
        fetchCurrentUser: async () => {
          set({ isLoading: true });

          try {
            const user = await authService.getMe();

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (err) {
            // If 401, interceptor will handle logout
            // We just clear the state here
            const errorMessage = getApiErrorMessage(err, 'Failed to fetch user');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });

            throw err;
          }
        },

        /**
         * Initialize auth on app startup
         * - Check if token exists in localStorage
         * - If yes, put token in state AND fetch current user
         * - If no, user is not authenticated (don't call API)
         * - Set isInitialized: true at the end
         */
        initializeAuth: async () => {
          set({ isLoading: true });

          try {
            // Check if token exists in localStorage FIRST
            const token = getToken();
            
            if (!token) {
              // No token = not authenticated, don't call API
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
              });
              return;
            }

            // Token exists - set it in state IMMEDIATELY
            set({ token, isAuthenticated: true });
            
            // Then validate token with backend
            await get().fetchCurrentUser();
            
            // Mark as initialized after successful init
            set({ isInitialized: true });
          } catch {
            // If error, user is not authenticated but still initialized
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          }
        },
      }),
      {
        name: 'Auth Store',
      }
    )
);

export default useAuthStore;
