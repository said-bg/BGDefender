'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { UserRole } from '@/types/api';
import NavbarAccountMenu from './NavbarAccountMenu';
import NavbarLanguageSwitcher from './NavbarLanguageSwitcher';
import NavbarLinks from './NavbarLinks';
import NavbarNotifications from './NavbarNotifications';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { t, i18n } = useTranslation('navbar');
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const homeHref = isAdmin ? '/admin' : '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (lang: 'en' | 'fi') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', lang);
    }

    void i18n.changeLanguage(lang);
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

  const mobileNavigationLinks = useMemo(() => {
    if (isAdmin) {
      return [
        { href: '/admin', label: t('admin') },
      ];
    }

    const links = [{ href: '/', label: t('home') }];

    if (isAuthenticated) {
      links.push(
        { href: '/my-courses', label: t('myCourses') },
        { href: '/favorites', label: t('favorites') },
      );
    }

    return links;
  }, [isAdmin, isAuthenticated, t]);

  const mobileAccountLinks = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }

    const links = [{ href: '/account', label: t('profile') }];

    if (user.role === UserRole.ADMIN) {
      links.unshift({ href: '/admin', label: t('admin') });
      return links;
    }

    links.push(
      { href: '/resources', label: t('resources') },
      { href: '/certificates', label: t('certificates') },
    );

    return links;
  }, [isAuthenticated, t, user]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
              adminLabel={t('admin')}
              favoritesLabel={t('favorites')}
              homeLabel={t('home')}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              myCoursesLabel={t('myCourses')}
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
                  user={user}
                  logout={logout}
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
                    userBadge: t('badges.user'),
                  }}
                />
              ) : (
                <>
                  <Link href="/login" className={styles.loginBtn}>
                    {t('login')}
                  </Link>
                  <Link href="/register" className={styles.registerBtn}>
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
                onClick={() => {
                  closeMobileMenu();
                  logout();
                  window.location.replace('/');
                }}
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
                href="/login"
                className={styles.mobileSecondaryAction}
                onClick={closeMobileMenu}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
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
