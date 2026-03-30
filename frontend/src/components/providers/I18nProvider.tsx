'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/config/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

const DEFAULT_LANGUAGE = 'fi';
const SUPPORTED_LANGUAGES = ['fi', 'en'];

/**
 * i18n Provider Component
 * Wraps the app with i18next configuration
 */
export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      const savedLanguage = window.localStorage.getItem('i18nextLng');
      const activeLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage || '')
        ? savedLanguage!
        : DEFAULT_LANGUAGE;

      if (savedLanguage !== activeLanguage) {
        window.localStorage.setItem('i18nextLng', activeLanguage);
      }

      if (i18n.language !== activeLanguage) {
        await i18n.changeLanguage(activeLanguage);
      }

      setIsReady(true);
    };

    void initializeLanguage();
  }, []);

  if (!isReady) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
