/**
 * Axios API Client
 * Centralized HTTP client for all API calls
 * Includes JWT token management and error handling
 */

import axios, { AxiosInstance } from 'axios';
import { requestInterceptor, responseErrorInterceptor } from './jwtInterceptor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - adds JWT token to Authorization header
apiClient.interceptors.request.use(
  requestInterceptor,
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally (401, 409, 400, etc.)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  responseErrorInterceptor
);

export default apiClient;
