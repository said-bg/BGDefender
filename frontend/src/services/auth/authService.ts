/**
 * Auth Service
 * Handles all authentication API calls
 */

import apiClient from '../api/apiClient';
import { setToken, removeToken } from '../utils/tokenStorage';
import i18n from '@/config/i18n';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  MeResponse,
} from '@/types/api';

const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
};

/**
 * Register a new user
 * Sends Accept-Language header for localized error messages
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>(
    AUTH_ENDPOINTS.REGISTER,
    data,
    {
      headers: {
        'Accept-Language': i18n.language,
      },
    }
  );
  return response.data;
};

/**
 * Login user and get JWT token
 * Automatically saves token to localStorage
 * Sends Accept-Language header for localized error messages
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    data,
    {
      headers: {
        'Accept-Language': i18n.language,
      },
    }
  );

  // Save token to localStorage
  if (response.data.accessToken) {
    setToken(response.data.accessToken);
  }

  return response.data;
};

/**
 * Get current authenticated user
 */
export const getMe = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>(AUTH_ENDPOINTS.ME);
  return response.data;
};

/**
 * Request password reset email
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    data,
    {
      headers: {
        'Accept-Language': i18n.language,
      },
    }
  );
  return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>(
    AUTH_ENDPOINTS.RESET_PASSWORD,
    data,
    {
      headers: {
        'Accept-Language': i18n.language,
      },
    }
  );
  return response.data;
};

/**
 * Logout user
 * Removes token from localStorage
 */
export const logout = (): void => {
  removeToken();
};

const authServiceExports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
};

export default authServiceExports;
