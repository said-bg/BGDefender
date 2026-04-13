'use client';

import Image from 'next/image';
import Link from 'next/link';
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
              {t('brandShort', { defaultValue: 'Defender' })}
            </span>
          </Link>

          <NavbarLinks
            adminLabel={t('admin')}
            favoritesLabel={t('favorites')}
            homeLabel={t('home')}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            myCoursesLabel={t('myCourses')}
          />
        </div>

        <div className={styles.rightSection}>
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
                  certificates: t('certificates', { defaultValue: 'Certificates' }),
                  freeBadge: t('badges.free'),
                  logout: t('logout'),
                  premiumBadge: t('badges.premium'),
                  profile: t('profile'),
                  resources: t('resources', { defaultValue: 'Resources' }),
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
    </nav>
  );
};
