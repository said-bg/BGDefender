'use client';

import Link from 'next/link';
import styles from './NavbarLinks.module.css';

interface NavbarLinksProps {
  adminLabel: string;
  contactLabel: string;
  favoritesLabel: string;
  homeLabel: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  myCoursesLabel: string;
}

export default function NavbarLinks({
  adminLabel,
  contactLabel,
  favoritesLabel,
  homeLabel,
  isAdmin,
  isAuthenticated,
  myCoursesLabel,
}: NavbarLinksProps) {
  return (
    <div className={styles.navigationLinks}>
      {isAdmin ? (
        <Link href="/admin" className={styles.navLink}>
          {adminLabel}
        </Link>
      ) : (
        <>
          <Link href="/" className={styles.navLink}>
            {homeLabel}
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/my-courses" className={styles.navLink}>
                {myCoursesLabel}
              </Link>
              <Link href="/favorites" className={styles.navLink}>
                {favoritesLabel}
              </Link>
              <Link href="/contact" className={styles.navLink}>
                {contactLabel}
              </Link>
            </>
          ) : (
            <Link href="/contact" className={styles.navLink}>
              {contactLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
