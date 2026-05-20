'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import type { AppLocale } from '@/lib/locale';
import { localizePathname } from '@/lib/locale';
import { setLocalePreference } from '@/lib/localePreference';
import { markManualLogoutInProgress } from '@/services/api/jwtInterceptor';
import { UserRole } from '@/types/api';
import NavbarAccountMenu from './NavbarAccountMenu';
import NavbarLanguageSwitcher from './NavbarLanguageSwitcher';
import NavbarLinks from './NavbarLinks';
import NavbarNotifications from './NavbarNotifications';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { t, i18n } = useTranslation('navbar');
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCreator = user?.role === UserRole.CREATOR;
  const showManagementLink = isAuthenticated && (isAdmin || isCreator);
  const currentPathname = pathname || '/';
  const currentSearch = searchParams.toString();
  const activeLocale = (i18n.language.split('-')[0] || 'fi') as AppLocale;
  const localizedHref = (targetPath: string) => localizePathname(targetPath, activeLocale);
  const managementHref = localizedHref(isAdmin ? '/admin' : '/creator');
  const managementLabel = isAdmin ? t('admin') : t('studio');
  const homeHref = localizedHref(isAdmin ? '/admin' : '/');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (lang: AppLocale) => {
    setLocalePreference(lang);
    void i18n.changeLanguage(lang);

    const nextPathname = localizePathname(currentPathname, lang);
    const nextUrl = currentSearch ? `${nextPathname}?${currentSearch}` : nextPathname;
    router.replace(nextUrl);
  };

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 900px)');

    const syncDesktopState = (matches: boolean) => {
      if (!matches) {
        setIsMobileMenuOpen(false);
      }
    };

    syncDesktopState(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncDesktopState(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const mobileNavigationLinks = (() => {
    if (isAdmin) {
      return [{ href: localizePathname('/admin', activeLocale), label: t('admin') }];
    }

    const links = [{ href: localizePathname('/', activeLocale), label: t('home') }];

    if (isAuthenticated) {
      links.push(
        { href: localizePathname('/my-courses', activeLocale), label: t('myCourses') },
        { href: localizePathname('/favorites', activeLocale), label: t('favorites') },
        { href: localizePathname('/contact', activeLocale), label: t('contact') },
      );

      if (showManagementLink) {
        links.push({ href: managementHref, label: managementLabel });
      }
    } else {
      links.push({ href: localizePathname('/contact', activeLocale), label: t('contact') });
    }

    return links;
  })();

  const mobileAccountLinks = (() => {
    if (!isAuthenticated || !user) {
      return [];
    }

    const localizedLinks = [
      { href: localizePathname('/account', activeLocale), label: t('profile') },
    ];

    if (user.role === UserRole.ADMIN || user.role === UserRole.CREATOR) {
      localizedLinks.unshift({
        href: localizePathname(
          user.role === UserRole.ADMIN ? '/admin' : '/creator',
          activeLocale,
        ),
        label: user.role === UserRole.ADMIN ? t('admin') : t('studio'),
      });
    }

    if (user.role === UserRole.ADMIN) {
      return localizedLinks;
    }

    localizedLinks.push(
      { href: localizePathname('/resources', activeLocale), label: t('resources') },
      { href: localizePathname('/certificates', activeLocale), label: t('certificates') },
    );

    return localizedLinks;
  })();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleLogout = () => {
    closeMobileMenu();
    markManualLogoutInProgress();
    logout('/');
    router.replace(localizedHref('/'));
  };

  return (
    <nav className={styles.navbar} aria-label="Primary">
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href={homeHref} className={styles.logo}>
            <Image
              src="/assets/images/bgdefender.jpeg"
              alt="BGDefender"
              width={36}
              height={36}
              className={styles.logoMark}
              priority
            />
            <span className={styles.logoText}>
              {t('brandShort')}
            </span>
          </Link>

          <div className={styles.desktopLinks}>
            <NavbarLinks
              contactLabel={t('contact')}
              contactHref={localizedHref('/contact')}
              favoritesLabel={t('favorites')}
              favoritesHref={localizedHref('/favorites')}
              homeHref={localizedHref('/')}
              homeLabel={t('home')}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              managementHref={managementHref}
              managementLabel={managementLabel}
              myCoursesHref={localizedHref('/my-courses')}
              myCoursesLabel={t('myCourses')}
              showManagementLink={showManagementLink}
            />
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.mobileUtilityCluster}>
            <NavbarNotifications visible={isAuthenticated && user?.role !== UserRole.ADMIN} />
            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label={
                isMobileMenuOpen ? t('mobileMenuClose') : t('mobileMenuOpen')
              }
              onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            >
              <span className={styles.mobileMenuBar} />
              <span className={styles.mobileMenuBar} />
              <span className={styles.mobileMenuBar} />
            </button>
          </div>

          <div className={styles.desktopUtilities}>
            <NavbarNotifications visible={isAuthenticated && user?.role !== UserRole.ADMIN} />
            <NavbarLanguageSwitcher activeLanguage={i18n.language} onChangeLanguage={changeLanguage} />

            <div className={styles.authSection}>
              {isAuthenticated && user ? (
                <NavbarAccountMenu
                  localizedPath={localizedHref}
                  user={user}
                  logout={handleLogout}
                  labels={{
                    admin: t('admin'),
                    adminBadge: t('badges.admin'),
                    creatorBadge: t('badges.creator'),
                    certificates: t('certificates'),
                    freeBadge: t('badges.free'),
                    logout: t('logout'),
                    premiumBadge: t('badges.premium'),
                    profile: t('profile'),
                    resources: t('resources'),
                    studio: t('studio'),
                    userBadge: t('badges.user'),
                  }}
                />
              ) : (
                <>
                  <Link href={localizedHref('/login')} className={styles.loginBtn}>
                    {t('login')}
                  </Link>
                  <Link href={localizedHref('/register')} className={styles.registerBtn}>
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${styles.mobileMenuOverlay} ${
          isMobileMenuOpen ? styles.mobileMenuOverlayVisible : ''
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <div
        id="mobile-navigation-panel"
        className={`${styles.mobileMenuPanel} ${
          isMobileMenuOpen ? styles.mobileMenuPanelOpen : ''
        }`}
        role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen ? 'true' : undefined}
        aria-labelledby={isMobileMenuOpen ? 'mobile-navigation-title' : undefined}
        hidden={!isMobileMenuOpen}
      >
        <div className={styles.mobileMenuHeader}>
          <h2 id="mobile-navigation-title" className={styles.mobileMenuTitle}>
            {t('mobileMenuTitle')}
          </h2>
          <button
            type="button"
            className={styles.mobileMenuCloseButton}
            onClick={closeMobileMenu}
            aria-label={t('mobileMenuClose')}
          >
            <span className={styles.mobileMenuCloseIcon} />
            <span className={styles.mobileMenuCloseIcon} />
          </button>
        </div>

        <div className={styles.mobileMenuSection}>
          <p className={styles.mobileMenuLabel}>{t('navigation')}</p>
          <div className={styles.mobileMenuLinks}>
            {mobileNavigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileMenuLink}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.mobileMenuSection}>
          <p className={styles.mobileMenuLabel}>{t('language.switcherLabel')}</p>
          <div className={styles.mobileLanguageButtons}>
            <button
              type="button"
              className={`${styles.mobileLanguageButton} ${
                i18n.language === 'en' ? styles.mobileLanguageButtonActive : ''
              }`}
              aria-pressed={i18n.language === 'en'}
              onClick={() => void changeLanguage('en')}
            >
              {t('language.english')}
            </button>
            <button
              type="button"
              className={`${styles.mobileLanguageButton} ${
                i18n.language === 'fi' ? styles.mobileLanguageButtonActive : ''
              }`}
              aria-pressed={i18n.language === 'fi'}
              onClick={() => void changeLanguage('fi')}
            >
              {t('language.finnish')}
            </button>
          </div>
        </div>

        {isAuthenticated && user ? (
          <div className={styles.mobileMenuSection}>
            <p className={styles.mobileMenuLabel}>{t('profile')}</p>
            <div className={styles.mobileMenuLinks}>
              {mobileAccountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileMenuLink}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className={styles.mobileLogoutButton}
                onClick={handleLogout}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.mobileMenuSection}>
            <p className={styles.mobileMenuLabel}>{t('accountSection')}</p>
            <div className={styles.mobileAuthActions}>
              <Link
                href={localizedHref('/login')}
                className={styles.mobileSecondaryAction}
                onClick={closeMobileMenu}
              >
                {t('login')}
              </Link>
              <Link
                href={localizedHref('/register')}
                className={styles.mobilePrimaryAction}
                onClick={closeMobileMenu}
              >
                {t('register')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
