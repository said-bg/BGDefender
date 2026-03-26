import { getApiErrorMessage, handleAuthError } from '../apiError';
import { AxiosError } from 'axios';

interface ErrorData {
  message?: string | string[];
  error?: string;
  [key: string]: unknown;
}

// Helper to create proper AxiosError mock
const createAxiosError = (data?: ErrorData): AxiosError => {
  const error = new AxiosError('API Error');
  (error as Record<string, unknown>).response = {
    data: data || {},
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {},
  };
  return error;
};

describe('apiError utility', () => {
  describe('getApiErrorMessage', () => {
    it('should extract message string from AxiosError response', () => {
      const mockError = createAxiosError({
        message: 'Email already exists',
      });

      const result = getApiErrorMessage(mockError, 'Fallback message');
      expect(result).toBe('Email already exists');
    });

    it('should join multiple messages from array', () => {
      const mockError = createAxiosError({
        message: ['Email must be valid', 'Password too short'],
      });

      const result = getApiErrorMessage(mockError, 'Fallback message');
      expect(result).toBe('Email must be valid; Password too short');
    });

    it('should fallback to error field if message is empty', () => {
      const mockError = createAxiosError({
        message: '',
        error: 'Something went wrong',
      });

      const result = getApiErrorMessage(mockError, 'Fallback message');
      expect(result).toBe('Something went wrong');
    });

    it('should return fallback if no response data', () => {
      const error = new AxiosError('API Error');
      (error as Record<string, unknown>).response = undefined;

      const result = getApiErrorMessage(error, 'Fallback message');
      expect(result).toBe('Fallback message');
    });

    it('should return fallback for non-AxiosError', () => {
      const result = getApiErrorMessage(new Error('Generic error'), 'Fallback message');
      expect(result).toBe('Fallback message');
    });

    it('should handle empty message array', () => {
      const mockError = createAxiosError({
        message: [],
        error: 'Error message',
      });

      const result = getApiErrorMessage(mockError, 'Fallback message');
      expect(result).toBe('Error message');
    });

    it('should prioritize message over error', () => {
      const mockError = createAxiosError({
        message: 'Primary message',
        error: 'Secondary error',
      });

      const result = getApiErrorMessage(mockError, 'Fallback message');
      expect(result).toBe('Primary message');
    });
  });

  describe('handleAuthError', () => {
    const mockTranslate = (key: string) => {
      const translations: Record<string, string> = {
        'auth.login.failed': 'Login failed',
        'auth.register.failed': 'Registration failed',
        'auth.general.error': 'An error occurred',
      };
      return translations[key] || key;
    };

    it('should extract error message and ignore fallback key', () => {
      const mockError = createAxiosError({
        message: 'Invalid credentials',
      });

      const result = handleAuthError(mockError, 'auth.login.failed', mockTranslate);
      expect(result).toBe('Invalid credentials');
    });

    it('should use translated fallback when no error data', () => {
      const error = new AxiosError('API Error');
      (error as Record<string, unknown>).response = undefined;

      const result = handleAuthError(error, 'auth.login.failed', mockTranslate);
      expect(result).toBe('Login failed');
    });

    it('should work with registration errors', () => {
      const mockError = createAxiosError({
        message: 'Email already registered',
      });

      const result = handleAuthError(mockError, 'auth.register.failed', mockTranslate);
      expect(result).toBe('Email already registered');
    });

    it('should use fallback key translation when error is not AxiosError', () => {
      const result = handleAuthError(new Error('Network error'), 'auth.general.error', mockTranslate);
      expect(result).toBe('An error occurred');
    });
  });
});
