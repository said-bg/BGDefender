'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { UserPlan, UserRole } from '@/types/api';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { t, i18n } = useTranslation('auth');
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const changeLanguage = (lang: 'en' | 'fi') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', lang);
    }

    void i18n.changeLanguage(lang);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = useMemo(() => {
    if (!user) {
      return '';
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email.split('@')[0];
  }, [user]);

  const avatarText = useMemo(() => {
    if (!user) {
      return 'U';
    }

    const initials = [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase();

    return initials || user.email.slice(0, 1).toUpperCase();
  }, [user]);

  const membershipBadge = useMemo(() => {
    if (!user) {
      return '';
    }

    if (user.role === UserRole.ADMIN) {
      return t('navbar.badges.admin');
    }

    if (user.role === UserRole.CREATOR) {
      return t('navbar.badges.creator');
    }

    if (user.plan === UserPlan.PREMIUM) {
      return t('navbar.badges.premium');
    }

    return t('navbar.badges.free');
  }, [t, user]);

  const roleLabel = useMemo(() => {
    if (!user) {
      return '';
    }

    if (user.role === UserRole.ADMIN) {
      return t('navbar.badges.admin');
    }

    if (user.role === UserRole.CREATOR) {
      return t('navbar.badges.creator');
    }

    return t('navbar.badges.user');
  }, [t, user]);

  const planToneClass = useMemo(() => {
    if (!user) {
      return '';
    }

    return user.plan === UserPlan.PREMIUM ? styles.premiumTone : styles.freeTone;
  }, [user]);

  const roleToneClass = useMemo(() => {
    if (!user) {
      return '';
    }

    if (user.role === UserRole.ADMIN) {
      return styles.adminTone;
    }

    if (user.role === UserRole.CREATOR) {
      return styles.creatorTone;
    }

    return styles.userTone;
  }, [user]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/assets/images/bgdefender.jpeg"
              alt="BGDefender"
              width={36}
              height={36}
              className={styles.logoMark}
              priority
            />
            <span className={styles.logoText}>Defender</span>
          </Link>

          <div className={styles.navigationLinks}>
            <Link href="/" className={styles.navLink}>
              {t('navbar.home')}
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/my-courses" className={styles.navLink}>
                  {t('navbar.myCourses')}
                </Link>
                <Link href="/favorites" className={styles.navLink}>
                  {t('navbar.favorites')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.languageSwitcher}>
            <button
              onClick={() => changeLanguage('fi')}
              className={`${styles.langBtn} ${i18n.language === 'fi' ? styles.active : ''}`}
            >
              FI
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`${styles.langBtn} ${i18n.language === 'en' ? styles.active : ''}`}
            >
              EN
            </button>
          </div>

          <div className={styles.authSection}>
            {isAuthenticated && user ? (
              <div className={styles.accountMenu} ref={menuRef}>
                <button
                  type="button"
                  className={styles.accountTrigger}
                  onClick={() => setIsMenuOpen((previous) => !previous)}
                  aria-label={t('navbar.profile')}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                >
                  <span className={styles.accountAvatar}>{avatarText}</span>
                </button>

                {isMenuOpen ? (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownAvatar}>{avatarText}</span>
                      <div className={styles.dropdownIdentity}>
                        <p className={styles.dropdownName}>{displayName}</p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                        <div className={styles.dropdownMeta}>
                          <span className={`${styles.metaToken} ${planToneClass}`}>
                            {membershipBadge}
                          </span>
                          <span className={styles.metaDivider}>·</span>
                          <span className={`${styles.metaToken} ${roleToneClass}`}>
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.dropdownLinks}>
                      <Link
                        href="/account"
                        className={styles.dropdownLink}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('navbar.profile')}
                      </Link>
                    </div>

                    <button
                      type="button"
                      className={styles.dropdownLogout}
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                    >
                      {t('navbar.logout')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className={styles.loginBtn}>
                  {t('navbar.login')}
                </Link>
                <Link href="/auth/register" className={styles.registerBtn}>
                  {t('navbar.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
