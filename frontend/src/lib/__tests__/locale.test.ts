import {
  buildAlternates,
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  isAuthRoute,
  isPrivateRoute,
  localizePathname,
  normalizeLocale,
  stripLocaleFromPathname,
} from '../locale';

describe('locale helpers', () => {
  it('normalizes locales and falls back safely', () => {
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('fi')).toBe('fi');
    expect(normalizeLocale('sv')).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it('extracts and strips locale prefixes from pathnames', () => {
    expect(getLocaleFromPathname('/en/courses')).toBe('en');
    expect(getLocaleFromPathname('/fi')).toBe('fi');
    expect(getLocaleFromPathname('/courses')).toBeNull();

    expect(stripLocaleFromPathname('/en/courses/course-1')).toBe('/courses/course-1');
    expect(stripLocaleFromPathname('/fi/kurssit/kurssi-1')).toBe('/courses/kurssi-1');
    expect(stripLocaleFromPathname('/fi')).toBe('/');
    expect(stripLocaleFromPathname('/contact')).toBe('/contact');
  });

  it('builds localized pathnames without duplicating the locale segment', () => {
    expect(localizePathname('/', 'fi')).toBe('/fi');
    expect(localizePathname('/courses', 'en')).toBe('/en/courses');
    expect(localizePathname('/courses', 'fi')).toBe('/fi/kurssit');
    expect(localizePathname('/fi/yhteystiedot', 'en')).toBe('/en/contact');
    expect(localizePathname('/en/courses/course-1', 'fi')).toBe('/fi/kurssit/course-1');
  });

  it('identifies private and auth routes from localized and unlocalized paths', () => {
    expect(isPrivateRoute('/fi/hallinta')).toBe(true);
    expect(isPrivateRoute('/creator')).toBe(true);
    expect(isPrivateRoute('/contact')).toBe(false);

    expect(isAuthRoute('/en/login')).toBe(true);
    expect(isAuthRoute('/fi/kirjaudu')).toBe(true);
    expect(isAuthRoute('/reset-password')).toBe(true);
    expect(isAuthRoute('/courses')).toBe(false);
  });

  it('builds canonical and language alternates for the same route', () => {
    expect(buildAlternates('/en/contact', 'en')).toEqual({
      canonical: '/en/contact',
      languages: {
        fi: '/fi/yhteystiedot',
        en: '/en/contact',
      },
    });
  });
});
