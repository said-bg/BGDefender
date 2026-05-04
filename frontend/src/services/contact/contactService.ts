import apiClient from '../api/apiClient';
import type { ContactRequest, ContactResponse } from '@/types/api';

const CONTACT_ENDPOINTS = {
  SUBMIT: '/contact',
};

export const sendContactRequest = async (
  data: ContactRequest,
): Promise<ContactResponse> => {
  const response = await apiClient.post<ContactResponse>(
    CONTACT_ENDPOINTS.SUBMIT,
    data,
  );
  return response.data;
};

const contactServiceExports = {
  sendContactRequest,
};

export default contactServiceExports;
