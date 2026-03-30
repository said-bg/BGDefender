/**
 * Navbar Component
 */

'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import styles from './Navbar.module.css';

/**
 * Navbar Component with language switcher
 */
export const Navbar = () => {
  const { t, i18n } = useTranslation('auth');
  const { isAuthenticated, logout } = useAuth();

  const changeLanguage = (lang: 'en' | 'fi') => {
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

          <div className={styles.navigationLinks}>
            <Link href="/" className={styles.navLink}>
              {t('navbar.home')}
            </Link>
            {isAuthenticated && (
              <Link href="/my-courses" className={styles.navLink}>
                {t('navbar.myCourses')}
              </Link>
            )}
          </div>
        </div>

        <div className={styles.rightSection}>
          {/* Language switcher */}
          <div className={styles.languageSwitcher}>
            <button
              onClick={() => changeLanguage('en')}
              className={`${styles.langBtn} ${
                i18n.language === 'en' ? styles.active : ''
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('fi')}
              className={`${styles.langBtn} ${
                i18n.language === 'fi' ? styles.active : ''
              }`}
            >
              FI
            </button>
          </div>

          {/* Auth buttons */}
          <div className={styles.authSection}>
            {isAuthenticated ? (
              <button onClick={() => logout()} className={styles.logoutBtn}>
                {t('navbar.logout')}
              </button>
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
