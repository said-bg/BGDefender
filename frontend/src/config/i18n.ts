import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enAuth from '../../public/locales/en/auth.json';
import fiAuth from '../../public/locales/fi/auth.json';
import enCourses from '../../public/locales/en/courses.json';
import fiCourses from '../../public/locales/fi/courses.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fi',
    defaultNS: 'auth',
    ns: ['auth', 'courses'],
    supportedLngs: ['fi', 'en'],
    nonExplicitSupportedLngs: true,
    resources: {
      en: {
        auth: enAuth,
        courses: enCourses,
      },
      fi: {
        auth: fiAuth,
        courses: fiCourses,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

export default i18n;
