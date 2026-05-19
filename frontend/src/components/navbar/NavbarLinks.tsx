'use client';

import Link from 'next/link';
import styles from './NavbarLinks.module.css';

interface NavbarLinksProps {
  contactLabel: string;
  favoritesLabel: string;
  homeLabel: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  managementHref?: string;
  managementLabel?: string;
  myCoursesLabel: string;
  showManagementLink: boolean;
}

export default function NavbarLinks({
  contactLabel,
  favoritesLabel,
  homeLabel,
  isAdmin,
  isAuthenticated,
  managementHref,
  managementLabel,
  myCoursesLabel,
  showManagementLink,
}: NavbarLinksProps) {
  return (
    <div className={styles.navigationLinks}>
      {isAdmin ? (
        <Link href={managementHref ?? '/admin'} className={styles.navLink}>
          {managementLabel ?? homeLabel}
        </Link>
      ) : (
        <Link href="/" className={styles.navLink}>
          {homeLabel}
        </Link>
      )}
      {isAuthenticated ? (
        <>
          {!isAdmin ? (
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
              {showManagementLink && managementHref && managementLabel ? (
                <Link href={managementHref} className={styles.navLink}>
                  {managementLabel}
                </Link>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <Link href="/contact" className={styles.navLink}>
          {contactLabel}
        </Link>
      )}
    </div>
  );
}
