'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import NavbarAccountMenu from './NavbarAccountMenu';
import NavbarLanguageSwitcher from './NavbarLanguageSwitcher';
import NavbarLinks from './NavbarLinks';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const { t, i18n } = useTranslation('navbar');
  const { isAuthenticated, logout, user } = useAuth();

  const changeLanguage = (lang: 'en' | 'fi') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', lang);
    }

    void i18n.changeLanguage(lang);
  };

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

          <NavbarLinks
            favoritesLabel={t('favorites')}
            homeLabel={t('home')}
            isAuthenticated={isAuthenticated}
            myCoursesLabel={t('myCourses')}
          />
        </div>

        <div className={styles.rightSection}>
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
                  freeBadge: t('badges.free'),
                  logout: t('logout'),
                  premiumBadge: t('badges.premium'),
                  profile: t('profile'),
                  userBadge: t('badges.user'),
                }}
              />
            ) : (
              <>
                <Link href="/auth/login" className={styles.loginBtn}>
                  {t('login')}
                </Link>
                <Link href="/auth/register" className={styles.registerBtn}>
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
