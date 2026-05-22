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

export type ContactRequestType = 'general' | 'support' | 'creator' | 'premium';

export interface ContactRequest {
  requestType: ContactRequestType;
  name: string;
  email: string;
  message: string;
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
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ContactResponse {
  message: string;
}

export type CertificateSignerRole = 'director' | 'program_director';

export interface CertificateSignerAssignedCourse {
  id: string;
  titleEn: string;
  titleFi: string;
  status: 'draft' | 'published';
  level: 'free' | 'premium';
}

export interface CertificateSignerAssignableCourse
  extends CertificateSignerAssignedCourse {
  programDirectorId: string | null;
}

export interface CertificateSignerRecord {
  id: string;
  fullName: string;
  role: CertificateSignerRole;
  title: string;
  signatureData: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedCourses: CertificateSignerAssignedCourse[];
}

export interface CertificateSignerOptionsResponse {
  director: CertificateSignerRecord | null;
  programDirectors: CertificateSignerRecord[];
}

export interface CertificateSignerDisplayRecord {
  role: CertificateSignerRole;
  fullName: string | null;
  title: string | null;
  signatureData: string | null;
}

export interface CertificateSignerCourseAssignmentsResponse {
  signerId: string;
  courseIds: string[];
  courses: CertificateSignerAssignableCourse[];
}

export interface UpsertCertificateSignerRequest {
  fullName: string;
  role: CertificateSignerRole;
  title: string;
  signatureData: string;
  isActive?: boolean;
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
  assignedUserId: number | null;
  assignedUser: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
  assignedGroupId: string | null;
  assignedGroup: {
    id: string;
    title: string;
    description: string | null;
    memberCount: number;
  } | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceGroup {
  id: string;
  title: string;
  description: string | null;
  createdByUserId: number | null;
  memberCount: number;
  members: Array<Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>>;
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
  assignedUserId?: number;
  assignedGroupId?: string;
}

export interface CreateResourceGroupRequest {
  title: string;
  description?: string | null;
  memberUserIds?: number[];
}

export interface UpdateResourceGroupRequest {
  title?: string;
  description?: string | null;
  memberUserIds?: number[];
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
  director?: CertificateSignerDisplayRecord | null;
  programDirector?: CertificateSignerDisplayRecord | null;
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
