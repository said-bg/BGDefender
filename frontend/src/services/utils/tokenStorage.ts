/**
 * Token Storage Utilities
 * Manage JWT token in localStorage
 */

const TOKEN_KEY = 'bg_defender_token';

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    // SSR - No localStorage available
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Save token to localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    // SSR - No localStorage available
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    // SSR - No localStorage available
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if token exists
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

const tokenStorageExports = {
  getToken,
  setToken,
  removeToken,
  hasToken,
};

export default tokenStorageExports;
