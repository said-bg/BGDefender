/**
 * JWT Interceptor
 * Handles automatic token attachment and error handling
 */

import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken } from '../utils/tokenStorage';

// Dynamic import for client-side only
let modalStoreInstance: unknown = null;
const isDevelopment = process.env.NODE_ENV === 'development';

// Flag to prevent multiple simultaneous 401 handlers
let isHandling401 = false;

/**
 * Initialize modal store (client-side only)
 */
const initializeModalStore = async () => {
  if (typeof window === 'undefined') return;

  if (!modalStoreInstance) {
    try {
      const { useModalStore } = await import('@/store/modalStore');
      modalStoreInstance = useModalStore;
    } catch {
      console.warn('Could not initialize modal store');
    }
  }
};

/**
 * Request Interceptor
 * Adds JWT token to Authorization header
 */
export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const token = getToken();
  let language = 'en';

  if (typeof window !== 'undefined') {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage === 'fi' || savedLanguage === 'en') {
      language = savedLanguage;
    }
  }

  if (token) {
    // Add token to Authorization header
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['Accept-Language'] = language;

  return config;
};

/**
 * Response Interceptor
 * Handles errors globally, especially 401 (session expired)
 */
export const responseErrorInterceptor = async (error: AxiosError) => {
  const status = error.response?.status;
  const logDevError = (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  };

  switch (status) {
    case 401: {
      // Unauthorized - Session expired or invalid token
      // Prevent multiple simultaneous 401 handlers
      if (isHandling401) {
        break;
      }

      const hasToken = getToken();
      
      if (hasToken) {
        // Mark as handling to prevent race conditions
        isHandling401 = true;

        // User WAS authenticated - session truly expired
        if (typeof window !== 'undefined') {
          // Reset auth state completely - INDEPENDENT of modal availability
          try {
            const { useAuthStore } = await import('@/store/authStore');
            useAuthStore.getState().logout();
          } catch (e) {
            if (isDevelopment) {
              console.warn('Could not reset auth store:', e);
            }
          }

          // Initialize modal store and show session expired modal
          await initializeModalStore();
          
          if (modalStoreInstance) {
            try {
              const store = ((modalStoreInstance as { getState?: () => unknown })?.getState?.()) || modalStoreInstance;
              const storeWithShowModal = store as { showModal?: (config: unknown) => unknown };
              
              // Get language for i18n
              let lang = 'en';
              if (typeof window !== 'undefined') {
                const savedLang = localStorage.getItem('i18nextLng');
                if (savedLang && ['en', 'fi'].includes(savedLang)) {
                  lang = savedLang;
                }
              }
              
              // Translations
              const translations: Record<string, Record<string, string>> = {
                en: {
                  title: 'Session Expired',
                  message: 'Your session has expired. Please sign in again.',
                  button: 'Sign In',
                },
                fi: {
                  title: 'Istunto Vanhentunut',
                  message: 'Istuntosi on vanhentunut. Kirjaudu uudelleen sisään.',
                  button: 'Kirjaudu Sisään',
                },
              };
              
              const t = translations[lang as keyof typeof translations] || translations.en;

              storeWithShowModal.showModal?.({
                type: 'error',
                title: t.title,
                message: t.message,
                confirmLabel: t.button,
                onConfirm: () => {
                  window.location.href = '/login';
                },
              });
            } catch (e) {
              if (isDevelopment) {
                console.warn('Could not show modal, redirecting directly:', e);
              }
              window.location.href = '/login';
            }
          } else {
            // Fallback: redirect immediately
            window.location.href = '/login';
          }

          // Reset flag after 3 seconds (in case redirect fails or takes time)
          setTimeout(() => {
            isHandling401 = false;
          }, 3000);
        }
      }
      // If no token, don't show modal - let the form handle the error
      break;
    }

    case 409:
      // Expected form-level conflict, such as duplicate email. The UI shows it.
      break;

    case 400:
      // Expected validation error, such as invalid current password. The UI shows it.
      break;

    case 403:
      // Forbidden - User doesn't have permission
      logDevError('Access forbidden');
      break;

    case 500:
      // Server error
      logDevError('Server error:', error.response?.data);
      break;

    default:
      logDevError('API Error:', error.message);
  }

  return Promise.reject(error);
};

const jwtInterceptorExports = {
  requestInterceptor,
  responseErrorInterceptor,
};

export default jwtInterceptorExports;
