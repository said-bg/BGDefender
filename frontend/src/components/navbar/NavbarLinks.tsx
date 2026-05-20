'use client';

import Link from 'next/link';
import styles from './NavbarLinks.module.css';

interface NavbarLinksProps {
  contactLabel: string;
  favoritesLabel: string;
  homeHref: string;
  homeLabel: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  managementHref?: string;
  managementLabel?: string;
  myCoursesHref: string;
  contactHref: string;
  favoritesHref: string;
  myCoursesLabel: string;
  showManagementLink: boolean;
}

export default function NavbarLinks({
  contactLabel,
  contactHref,
  favoritesHref,
  favoritesLabel,
  homeHref,
  homeLabel,
  isAdmin,
  isAuthenticated,
  managementHref,
  managementLabel,
  myCoursesHref,
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
        <Link href={homeHref} className={styles.navLink}>
          {homeLabel}
        </Link>
      )}
      {isAuthenticated ? (
        <>
          {!isAdmin ? (
            <>
              <Link href={myCoursesHref} className={styles.navLink}>
                {myCoursesLabel}
              </Link>
              <Link href={favoritesHref} className={styles.navLink}>
                {favoritesLabel}
              </Link>
              <Link href={contactHref} className={styles.navLink}>
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
        <Link href={contactHref} className={styles.navLink}>
          {contactLabel}
        </Link>
      )}
    </div>
  );
}
