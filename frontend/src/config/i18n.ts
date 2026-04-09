import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enAccount from '../../public/locales/en/account.json';
import enAdmin from '../../public/locales/en/admin.json';
import enAuth from '../../public/locales/en/auth.json';
import enCommon from '../../public/locales/en/common.json';
import enNavbar from '../../public/locales/en/navbar.json';
import enResources from '../../public/locales/en/resources.json';
import enUnauthorized from '../../public/locales/en/unauthorized.json';
import fiAccount from '../../public/locales/fi/account.json';
import fiAdmin from '../../public/locales/fi/admin.json';
import fiAuth from '../../public/locales/fi/auth.json';
import fiCommon from '../../public/locales/fi/common.json';
import enCourses from '../../public/locales/en/courses.json';
import fiCourses from '../../public/locales/fi/courses.json';
import fiNavbar from '../../public/locales/fi/navbar.json';
import fiResources from '../../public/locales/fi/resources.json';
import fiUnauthorized from '../../public/locales/fi/unauthorized.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fi',
    defaultNS: 'auth',
    ns: ['auth', 'courses', 'admin', 'navbar', 'account', 'common', 'unauthorized', 'resources'],
    supportedLngs: ['fi', 'en'],
    nonExplicitSupportedLngs: true,
    resources: {
      en: {
        account: enAccount,
        auth: enAuth,
        admin: {
          ...enAdmin,
          common: enCommon,
        },
        common: enCommon,
        courses: enCourses,
        navbar: enNavbar,
        resources: enResources,
        unauthorized: enUnauthorized,
      },
      fi: {
        account: fiAccount,
        auth: fiAuth,
        admin: {
          ...fiAdmin,
          common: fiCommon,
        },
        common: fiCommon,
        courses: fiCourses,
        navbar: fiNavbar,
        resources: fiResources,
        unauthorized: fiUnauthorized,
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
