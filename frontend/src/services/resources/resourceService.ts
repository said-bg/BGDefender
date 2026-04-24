import apiClient from '../api/apiClient';
import type {
  AdminResourcesResponse,
  CreateAdminResourceRequest,
  CreateMyResourceRequest,
  Resource,
  ResourceSource,
  ResourceType,
  UploadResourceResponse,
} from '@/types/api';

type GetAdminResourcesParams = {
  limit?: number;
  offset?: number;
  search?: string;
  assignedUserId?: number;
  type?: ResourceType;
  source?: ResourceSource;
};

const resourceService = {
  async getAdminResources(
    params: GetAdminResourcesParams = {},
  ): Promise<AdminResourcesResponse> {
    const response = await apiClient.get<AdminResourcesResponse>('/resources/admin', {
      params,
    });

    return response.data;
  },

  async createAdminResource(payload: CreateAdminResourceRequest): Promise<Resource> {
    const response = await apiClient.post<Resource>('/resources/admin', payload);
    return response.data;
  },

  async getMyResources(): Promise<Resource[]> {
    const response = await apiClient.get<Resource[] | { data?: Resource[] }>('/resources/me');

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async createMyResource(payload: CreateMyResourceRequest): Promise<Resource> {
    const response = await apiClient.post<Resource>('/resources/me', payload);
    return response.data;
  },

  async deleteAdminResource(id: string): Promise<void> {
    await apiClient.delete(`/resources/admin/${id}`);
  },

  async deleteMyResource(id: string): Promise<void> {
    await apiClient.delete(`/resources/me/${id}`);
  },

  async openResourceFile(resource: Pick<Resource, 'id' | 'filename'>): Promise<void> {
    const response = await apiClient.get<Blob>(`/resources/${resource.id}/download`, {
      responseType: 'blob',
    });
    const objectUrl = window.URL.createObjectURL(response.data);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';

    if (resource.filename) {
      anchor.download = resource.filename;
    }

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
  },

  async uploadResource(file: File): Promise<UploadResourceResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResourceResponse>(
      '/resources/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },
};

export default resourceService;
