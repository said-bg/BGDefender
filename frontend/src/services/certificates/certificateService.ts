import { apiClient } from '../api';
import type { CertificateRecord } from '@/types/api';

const certificateService = {
  async getMyCertificates(): Promise<CertificateRecord[]> {
    const response = await apiClient.get<CertificateRecord[]>('/certificates/me');
    return response.data;
  },

  async getMyCertificate(id: string): Promise<CertificateRecord> {
    const response = await apiClient.get<CertificateRecord>(`/certificates/me/${id}`);
    return response.data;
  },

  async getMyCertificatePdf(id: string, language: string): Promise<Blob> {
    const response = await apiClient.get(`/certificates/me/${id}/pdf`, {
      params: { lang: language },
      responseType: 'blob',
    });

    return response.data as Blob;
  },
};

export default certificateService;
