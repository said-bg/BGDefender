import apiClient from '../api/apiClient';
import type {
  CertificateSignerCourseAssignmentsResponse,
  CertificateSignerOptionsResponse,
  CertificateSignerRecord,
  CertificateSignerRole,
  UpsertCertificateSignerRequest,
} from '@/types/api';

const certificateSignerService = {
  async getOptions(): Promise<CertificateSignerOptionsResponse> {
    const response = await apiClient.get<CertificateSignerOptionsResponse>(
      '/certificate-signers/options',
    );

    return response.data;
  },

  async getAdminSigners(
    role?: CertificateSignerRole,
  ): Promise<CertificateSignerRecord[]> {
    const response = await apiClient.get<CertificateSignerRecord[]>(
      '/certificate-signers/admin',
      {
        params: role ? { role } : undefined,
      },
    );

    return response.data;
  },

  async createAdminSigner(
    payload: UpsertCertificateSignerRequest,
  ): Promise<CertificateSignerRecord> {
    const response = await apiClient.post<CertificateSignerRecord>(
      '/certificate-signers/admin',
      payload,
    );

    return response.data;
  },

  async updateAdminSigner(
    id: string,
    payload: UpsertCertificateSignerRequest,
  ): Promise<CertificateSignerRecord> {
    const response = await apiClient.put<CertificateSignerRecord>(
      `/certificate-signers/admin/${id}`,
      payload,
    );

    return response.data;
  },

  async getAdminSignerCourseAssignments(
    id: string,
  ): Promise<CertificateSignerCourseAssignmentsResponse> {
    const response = await apiClient.get<CertificateSignerCourseAssignmentsResponse>(
      `/certificate-signers/admin/${id}/course-assignments`,
    );

    return response.data;
  },

  async updateAdminSignerCourseAssignments(
    id: string,
    courseIds: string[],
  ): Promise<CertificateSignerCourseAssignmentsResponse> {
    const response = await apiClient.put<CertificateSignerCourseAssignmentsResponse>(
      `/certificate-signers/admin/${id}/course-assignments`,
      { courseIds },
    );

    return response.data;
  },

  async deleteAdminSigner(id: string): Promise<void> {
    await apiClient.delete(`/certificate-signers/admin/${id}`);
  },
};

export default certificateSignerService;
