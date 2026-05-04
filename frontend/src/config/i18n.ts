import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enAccount from '../../public/locales/en/account.json';
import enAdmin from '../../public/locales/en/admin.json';
import enAuth from '../../public/locales/en/auth.json';
import enCertificates from '../../public/locales/en/certificates.json';
import enCommon from '../../public/locales/en/common.json';
import enContact from '../../public/locales/en/contact.json';
import enNavbar from '../../public/locales/en/navbar.json';
import enResources from '../../public/locales/en/resources.json';
import enUnauthorized from '../../public/locales/en/unauthorized.json';
import fiAccount from '../../public/locales/fi/account.json';
import fiAdmin from '../../public/locales/fi/admin.json';
import fiAuth from '../../public/locales/fi/auth.json';
import fiCertificates from '../../public/locales/fi/certificates.json';
import fiCommon from '../../public/locales/fi/common.json';
import fiContact from '../../public/locales/fi/contact.json';
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
    ns: ['auth', 'courses', 'admin', 'navbar', 'account', 'common', 'contact', 'unauthorized', 'resources', 'certificates'],
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
        certificates: enCertificates,
        common: enCommon,
        contact: enContact,
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
        certificates: fiCertificates,
        common: fiCommon,
        contact: fiContact,
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
