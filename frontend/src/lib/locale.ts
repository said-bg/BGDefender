import type { Metadata } from 'next';

export const SUPPORTED_LOCALES = ['fi', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'fi';
export const LOCALE_COOKIE = 'bgd_locale';

const LOCALIZED_ROUTE_SEGMENTS: Record<AppLocale, Record<string, string>> = {
  en: {
    account: 'account',
    admin: 'admin',
    analytics: 'analytics',
    authors: 'authors',
    certificates: 'certificates',
    collections: 'collections',
    contact: 'contact',
    content: 'content',
    courses: 'courses',
    creator: 'creator',
    edit: 'edit',
    'final-test': 'final-test',
    favorites: 'favorites',
    'forgot-password': 'forgot-password',
    login: 'login',
    'my-courses': 'my-courses',
    new: 'new',
    quiz: 'quiz',
    register: 'register',
    resources: 'resources',
    'reset-password': 'reset-password',
    structure: 'structure',
    unauthorized: 'unauthorized',
    users: 'users',
  },
  fi: {
    account: 'tili',
    admin: 'hallinta',
    analytics: 'analytiikka',
    authors: 'tekijat',
    certificates: 'todistukset',
    collections: 'kokoelmat',
    contact: 'yhteystiedot',
    content: 'sisalto',
    courses: 'kurssit',
    creator: 'studio',
    edit: 'muokkaa',
    'final-test': 'lopputesti',
    favorites: 'suosikit',
    'forgot-password': 'unohtuiko-salasana',
    login: 'kirjaudu',
    'my-courses': 'omat-kurssit',
    new: 'uusi',
    quiz: 'visa',
    register: 'rekisteroidy',
    resources: 'resurssit',
    'reset-password': 'palauta-salasana',
    structure: 'rakenne',
    unauthorized: 'ei-oikeutta',
    users: 'kayttajat',
  },
};

const REVERSE_LOCALIZED_ROUTE_SEGMENTS: Record<AppLocale, Record<string, string>> = {
  en: Object.fromEntries(
    Object.entries(LOCALIZED_ROUTE_SEGMENTS.en).map(([internal, localized]) => [
      localized,
      internal,
    ]),
  ),
  fi: Object.fromEntries(
    Object.entries(LOCALIZED_ROUTE_SEGMENTS.fi).map(([internal, localized]) => [
      localized,
      internal,
    ]),
  ),
};

const PRIVATE_ROUTE_PREFIXES = [
  '/account',
  '/admin',
  '/certificates',
  '/creator',
  '/favorites',
  '/my-courses',
  '/resources',
];

const AUTH_ROUTE_PREFIXES = ['/forgot-password', '/login', '/register', '/reset-password'];

const PUBLIC_ROUTE_METADATA: Record<
  string,
  Record<AppLocale, { title: string; description: string }>
> = {
  '/': {
    en: {
      title: 'Defender Academy | Learn Cybersecurity Online',
      description:
        'Learn cybersecurity with structured online courses, practical lessons, and certification-ready learning paths.',
    },
    fi: {
      title: 'Defender Academy | Opi kyberturvallisuutta verkossa',
      description:
        'Opiskele kyberturvallisuutta verkossa selkeiden kurssien, kaytannon laheisten oppituntien ja sertifiointiin valmistavien polkujen avulla.',
    },
  },
  '/contact': {
    en: {
      title: 'Contact Defender Academy',
      description:
        'Reach out for support, creator access, premium questions, or general help with BG Defender Academy.',
    },
    fi: {
      title: 'Ota yhteytta Defender Academyyn',
      description:
        'Ota yhteytta tukea, creator-kayttooikeuksia, premium-kysymyksia tai yleista apua varten BG Defender Academyssa.',
    },
  },
  '/courses': {
    en: {
      title: 'Cybersecurity Courses | Defender Academy',
      description:
        'Browse BG Defender Academy cybersecurity courses and start a practical learning path online.',
    },
    fi: {
      title: 'Kyberturvallisuuskurssit | Defender Academy',
      description:
        'Selaa BG Defender Academyn kyberturvallisuuskursseja ja aloita kaytannollinen oppimispolku verkossa.',
    },
  },
  '/unauthorized': {
    en: {
      title: 'Access Denied | Defender Academy',
      description: 'You do not have permission to access this area.',
    },
    fi: {
      title: 'Paasy estetty | Defender Academy',
      description: 'Sinulla ei ole oikeutta kayttaa tata aluetta.',
    },
  },
};

const routeMetadataFallback = (
  locale: AppLocale,
  title: string,
  description: string,
) => ({
  title,
  description,
});

export const normalizeLocale = (value: string | null | undefined): AppLocale => {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.toLowerCase().split('-')[0];
  return SUPPORTED_LOCALES.includes(normalized as AppLocale)
    ? (normalized as AppLocale)
    : DEFAULT_LOCALE;
};

export const getLocaleFromPathname = (pathname: string): AppLocale | null => {
  const [, maybeLocale] = pathname.split('/');
  if (!maybeLocale) {
    return null;
  }

  return SUPPORTED_LOCALES.includes(maybeLocale as AppLocale)
    ? (maybeLocale as AppLocale)
    : null;
};

const normalizePathnameValue = (pathname: string) => {
  if (!pathname) {
    return '/';
  }

  const [rawPathname] = pathname.split(/[?#]/);
  const normalizedPathname = rawPathname || '/';

  if (normalizedPathname === '/') {
    return '/';
  }

  return normalizedPathname.startsWith('/')
    ? normalizedPathname
    : `/${normalizedPathname}`;
};

const translatePathSegments = (
  pathname: string,
  dictionary: Record<string, string>,
) => {
  const normalizedPathname = normalizePathnameValue(pathname);

  if (normalizedPathname === '/') {
    return '/';
  }

  const translatedSegments = normalizedPathname
    .split('/')
    .filter(Boolean)
    .map((segment) => dictionary[segment] ?? segment);

  return translatedSegments.length > 0 ? `/${translatedSegments.join('/')}` : '/';
};

export const stripLocaleFromPathname = (pathname: string) => {
  const normalizedPathname = normalizePathnameValue(pathname);
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    return normalizedPathname;
  }

  const stripped = normalizedPathname.replace(new RegExp(`^/${locale}`), '') || '/';
  return translatePathSegments(
    stripped.startsWith('/') ? stripped : `/${stripped}`,
    REVERSE_LOCALIZED_ROUTE_SEGMENTS[locale],
  );
};

export const localizePathname = (pathname: string, locale: AppLocale) => {
  const normalizedPath = stripLocaleFromPathname(pathname || '/');

  if (normalizedPath === '/') {
    return `/${locale}`;
  }

  return `/${locale}${translatePathSegments(
    normalizedPath,
    LOCALIZED_ROUTE_SEGMENTS[locale],
  )}`;
};

export const isPrivateRoute = (pathname: string) => {
  const normalizedPath = stripLocaleFromPathname(pathname);
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
};

export const isAuthRoute = (pathname: string) => {
  const normalizedPath = stripLocaleFromPathname(pathname);
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
};

export const getMetadataBase = () => {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return new URL(rawSiteUrl);
};

export const buildAlternates = (pathname: string, locale: AppLocale) => {
  const normalizedPath = stripLocaleFromPathname(pathname);

  return {
    canonical: localizePathname(normalizedPath, locale),
    languages: {
      fi: localizePathname(normalizedPath, 'fi'),
      en: localizePathname(normalizedPath, 'en'),
    },
  };
};

export const buildRouteMetadata = (
  locale: AppLocale,
  pathname: string,
): Metadata => {
  const normalizedPath = stripLocaleFromPathname(pathname);
  const pathWithoutTrailingSlash =
    normalizedPath !== '/' && normalizedPath.endsWith('/')
      ? normalizedPath.slice(0, -1)
      : normalizedPath;

  const routeMetadata =
    PUBLIC_ROUTE_METADATA[pathWithoutTrailingSlash]?.[locale] ??
    (pathWithoutTrailingSlash.startsWith('/courses/')
      ? routeMetadataFallback(
          locale,
          locale === 'fi'
            ? 'Kurssin tiedot | Defender Academy'
            : 'Course Details | Defender Academy',
          locale === 'fi'
            ? 'Tutustu kurssin sisaltoon, rakenteeseen ja oppimispolkuun Defender Academyssa.'
            : 'Explore course content, structure, and learning outcomes in Defender Academy.',
        )
      : routeMetadataFallback(
          locale,
          locale === 'fi' ? 'Defender Academy' : 'Defender Academy',
          locale === 'fi'
            ? 'BG Defender Academy kyberturvallisuuden verkko-oppimiseen.'
            : 'BG Defender Academy for cybersecurity online learning.',
        ));

  const isIndexable = !isPrivateRoute(pathname) && !isAuthRoute(pathname);

  return {
    title: routeMetadata.title,
    description: routeMetadata.description,
    metadataBase: getMetadataBase(),
    alternates: buildAlternates(pathname, locale),
    openGraph: {
      title: routeMetadata.title,
      description: routeMetadata.description,
      url: localizePathname(pathWithoutTrailingSlash, locale),
      siteName: 'Defender Academy',
      locale,
      type: 'website',
      images: [
        {
          url: '/assets/images/bgdefender.jpeg',
          width: 512,
          height: 512,
          alt: 'Defender Academy',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: routeMetadata.title,
      description: routeMetadata.description,
      images: ['/assets/images/bgdefender.jpeg'],
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
  };
};
