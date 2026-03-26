/**
 * API Types and Interfaces
 * Centralized type definitions for API responses and requests
 */

// User Role and Plan enums (matches backend)
export enum UserRole {
  USER = 'USER',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

/**
 * User entity (no password exposed)
 */
export interface User {
  id: number;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth Endpoints Requests
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Auth Endpoints Responses
 */
export interface RegisterResponse {
  id: number;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface MeResponse {
  id: number;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Error Response (from backend)
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
