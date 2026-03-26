/**
 * useAuth Hook
 * Convenient way to access auth store
 * 
 * Usage:
 * const { user, login, logout } = useAuth();
 */

import { useAuthStore } from '../store/authStore';
import { useShallow } from 'zustand/react/shallow';

export const useAuth = () => {
  return useAuthStore(
    useShallow((state) => ({
      // State
      user: state.user,
      token: state.token,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      error: state.error,

      // Actions
      login: state.login,
      register: state.register,
      logout: state.logout,
      fetchCurrentUser: state.fetchCurrentUser,
      setUser: state.setUser,
      setError: state.setError,
    }))
  );
};

export default useAuth;
