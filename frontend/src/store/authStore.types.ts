import { User } from '@/types/api';

export interface AuthState {
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;

  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
  fetchCurrentUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  updateProfile: (
    profile: Partial<Pick<User, 'firstName' | 'lastName' | 'occupation'>>
  ) => Promise<void>;
}
