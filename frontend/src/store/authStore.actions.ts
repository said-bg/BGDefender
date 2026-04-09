import { StateCreator } from 'zustand';
import * as authService from '@/services/auth';
import { getToken } from '@/services/utils/tokenStorage';
import { getApiErrorMessage } from '@/utils/apiError';
import { AuthState } from './authStore.types';

export const createAuthStore: StateCreator<AuthState> = (set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
  error: null,

  setUser: (user) => {
    set({ user });
  },

  setToken: (token) => {
    set({
      token,
      isAuthenticated: Boolean(token),
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  login: async (email, password) => {
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
      set({
        error: getApiErrorMessage(err, 'Login failed'),
        isLoading: false,
      });

      throw err;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      await authService.register({ email, password });
      set({ isLoading: false, error: null });
    } catch (err) {
      set({
        error: getApiErrorMessage(err, 'Registration failed'),
        isLoading: false,
      });

      throw err;
    }
  },

  updateProfile: async (profile) => {
    set({ isLoading: true, error: null });

    try {
      const updatedUser = await authService.updateProfile(profile);
      set({ user: updatedUser, isLoading: false, error: null });
    } catch (err) {
      set({
        error: getApiErrorMessage(err, 'Failed to update profile'),
        isLoading: false,
      });

      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });

    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      set({ isLoading: false, error: null });
      return response.message;
    } catch (err) {
      set({
        error: getApiErrorMessage(err, 'Failed to change password'),
        isLoading: false,
      });

      throw err;
    }
  },

  logout: () => {
    authService.logout();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

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
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: getApiErrorMessage(err, 'Failed to fetch user'),
      });

      throw err;
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const token = getToken();

      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }

      set({ token, isAuthenticated: true });
      await get().fetchCurrentUser();
      set({ isInitialized: true });
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },
});
