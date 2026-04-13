import apiClient from '../api/apiClient';
import type {
  CourseCollection,
  CreateCourseCollectionRequest,
  UploadCollectionCoverResponse,
  UpdateCourseCollectionRequest,
} from '../course';

const collectionService = {
  async getPublishedCollections(): Promise<CourseCollection[]> {
    const response = await apiClient.get<CourseCollection[]>('/collections');
    return response.data;
  },

  async getAdminCollections(): Promise<CourseCollection[]> {
    const response = await apiClient.get<CourseCollection[]>('/collections/admin');
    return response.data;
  },

  async createCollection(
    payload: CreateCourseCollectionRequest,
  ): Promise<CourseCollection> {
    const response = await apiClient.post<CourseCollection>('/collections', payload);
    return response.data;
  },

  async updateCollection(
    id: string,
    payload: UpdateCourseCollectionRequest,
  ): Promise<CourseCollection> {
    const response = await apiClient.put<CourseCollection>(`/collections/${id}`, payload);
    return response.data;
  },

  async deleteCollection(id: string): Promise<void> {
    await apiClient.delete(`/collections/${id}`);
  },

  async uploadCollectionCover(file: File): Promise<UploadCollectionCoverResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadCollectionCoverResponse>(
      '/collections/admin/upload-cover',
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

export default collectionService;
