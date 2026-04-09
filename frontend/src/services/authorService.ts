import apiClient from './api/apiClient';
import { Author } from './courseService';

export interface AuthorsResponse {
  data: Author[];
  count: number;
}

export interface CreateAuthorRequest {
  name: string;
  roleEn?: string;
  roleFi?: string;
  biographyEn?: string;
  biographyFi?: string;
  photo?: string;
}

export interface UpdateAuthorRequest {
  name?: string;
  roleEn?: string;
  roleFi?: string;
  biographyEn?: string;
  biographyFi?: string;
  photo?: string;
}

interface UploadAuthorPhotoResponse {
  statusCode: number;
  url: string;
  filename: string;
}

const authorService = {
  async getAuthors(limit = 100, offset = 0): Promise<AuthorsResponse> {
    const response = await apiClient.get<AuthorsResponse>('/authors', {
      params: {
        limit,
        offset,
      },
    });

    return response.data;
  },

  async createAuthor(payload: CreateAuthorRequest): Promise<Author> {
    const response = await apiClient.post<Author>('/authors', payload);
    return response.data;
  },

  async updateAuthor(id: string, payload: UpdateAuthorRequest): Promise<Author> {
    const response = await apiClient.put<Author>(`/authors/${id}`, payload);
    return response.data;
  },

  async uploadAuthorPhoto(file: File): Promise<UploadAuthorPhotoResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadAuthorPhotoResponse>(
      '/authors/admin/upload-photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  async deleteAuthor(id: string): Promise<void> {
    await apiClient.delete(`/authors/${id}`);
  },
};

export default authorService;
