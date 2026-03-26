import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enAuth from '../../public/locales/en/auth.json';
import fiAuth from '../../public/locales/fi/auth.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'auth',
    lng: 'en',
    ns: ['auth'],
    resources: {
      en: {
        auth: enAuth,
      },
      fi: {
        auth: fiAuth,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
