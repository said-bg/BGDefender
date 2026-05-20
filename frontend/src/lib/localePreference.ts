import type { AppLocale } from './locale';
import { LOCALE_COOKIE } from './locale';

export const setLocalePreference = (locale: AppLocale) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('i18nextLng', locale);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }
};
