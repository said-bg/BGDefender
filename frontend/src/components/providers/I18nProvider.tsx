'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/config/i18n';
import type { AppLocale } from '@/lib/locale';
import { DEFAULT_LOCALE } from '@/lib/locale';
import { setLocalePreference } from '@/lib/localePreference';

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage: AppLocale;
}

/**
 * i18n Provider Component
 * Wraps the app with i18next configuration
 */
export const I18nProvider = ({ children, initialLanguage }: I18nProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      const activeLanguage = initialLanguage || DEFAULT_LOCALE;

      setLocalePreference(activeLanguage);

      if (i18n.language !== activeLanguage) {
        await i18n.changeLanguage(activeLanguage);
      }

      setIsReady(true);
    };

    void initializeLanguage();
  }, [initialLanguage]);

  if (!isReady) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
