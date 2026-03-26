/**
 * API Error Handling Utilities
 * Centralized error extraction from API responses
 */

import { AxiosError } from 'axios';

/**
 * Standard API error response structure
 * Backend should return this format for all errors
 */
export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Extract error message from AxiosError response
 * Handles various backend response formats
 * 
 * @param error - The error caught (typically AxiosError)
 * @param fallback - Fallback message if extraction fails
 * @returns Extracted error message or fallback
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  // Not an AxiosError - return fallback
  if (!(error instanceof AxiosError)) {
    console.warn('[getApiErrorMessage] Not an AxiosError:', error);
    return fallback;
  }

  // Extract response data
  const data = error.response?.data as ApiErrorResponse | undefined;

  // No data - return fallback
  if (!data) {
    console.warn('[getApiErrorMessage] No response data:', error.message);
    return fallback;
  }

  // Handle message as array (backend sometimes returns array of validation errors)
  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.join('; ');
  }

  // Handle message as string
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  // Fallback to error field if message is empty
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }

  // Last resort - return fallback
  console.warn('[getApiErrorMessage] Could not extract error message, using fallback');
  return fallback;
};

/**
 * Centralized error handler for auth forms
 * Extracts and returns proper error message
 * 
 * @param error - Error caught from try/catch
 * @param fallbackKey - i18n key for fallback message (e.g., 'login.failed')
 * @param t - i18n translate function
 * @returns Error message (either extracted or translated fallback)
 */
export const handleAuthError = (
  error: unknown,
  fallbackKey: string,
  t: (key: string) => string
): string => {
  const fallbackMessage = t(fallbackKey);
  return getApiErrorMessage(error, fallbackMessage);
};
