import apiClient from '../api/apiClient';
import type { AdminUsersResponse, UpdateAdminUserRequest, User, UserPlan, UserRole } from '@/types/api';

type DeleteAdminUserResponse = {
  message: string;
};

type GetAdminUsersParams = {
  limit?: number;
  offset?: number;
  search?: string;
  plan?: UserPlan;
  role?: UserRole;
};

const userService = {
  async getAdminUsers(params: GetAdminUsersParams = {}): Promise<AdminUsersResponse> {
    const response = await apiClient.get<AdminUsersResponse>('/admin/users', {
      params,
    });

    return response.data;
  },

  async updateAdminUser(id: number, payload: UpdateAdminUserRequest): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}`, payload);
    return response.data;
  },

  async deleteAdminUser(id: number): Promise<DeleteAdminUserResponse> {
    const response = await apiClient.delete<DeleteAdminUserResponse>(`/admin/users/${id}`);
    return response.data;
  },
};

export default userService;
