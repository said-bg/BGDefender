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
  firstName: string | null;
  lastName: string | null;
  occupation: string | null;
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

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  occupation?: string | null;
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Auth Endpoints Responses
 */
export interface RegisterResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  occupation: string | null;
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

export interface ChangePasswordResponse {
  message: string;
}

export interface MeResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  occupation: string | null;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  data: User[];
  count: number;
}

export interface UpdateAdminUserRequest {
  plan?: UserPlan;
  role?: UserRole;
  isActive?: boolean;
}

export enum ResourceType {
  FILE = 'FILE',
  LINK = 'LINK',
}

export enum ResourceSource {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum CertificateStatus {
  PENDING_PROFILE = 'pending_profile',
  ISSUED = 'issued',
}

export enum NotificationType {
  COURSE_PUBLISHED = 'course_published',
  RESOURCE_SHARED = 'resource_shared',
  CERTIFICATE_AVAILABLE = 'certificate_available',
  COMPLETE_PROFILE_FOR_CERTIFICATE = 'complete_profile_for_certificate',
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  fileUrl: string | null;
  filename: string | null;
  mimeType: string | null;
  linkUrl: string | null;
  source: ResourceSource;
  assignedUserId: number;
  assignedUser: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminResourcesResponse {
  data: Resource[];
  count: number;
}

export interface UploadResourceResponse {
  url: string;
  filename: string;
  mimeType: string;
}

export interface CreateAdminResourceRequest {
  title: string;
  description?: string | null;
  type: ResourceType;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  linkUrl?: string;
  assignedUserId: number;
}

export interface CreateMyResourceRequest {
  title: string;
  description?: string | null;
  type: ResourceType;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  linkUrl?: string;
}

export interface CertificateRecord {
  id: string;
  courseId: string;
  certificateCode: string;
  status: CertificateStatus;
  firstName: string | null;
  lastName: string | null;
  courseTitleEn: string;
  courseTitleFi: string;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  courseId: string | null;
  courseTitleEn: string | null;
  courseTitleFi: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFeedResponse {
  data: NotificationRecord[];
  unreadCount: number;
}

/**
 * Error Response (from backend)
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
