'use client';

import Link from 'next/link';
import styles from './NavbarLinks.module.css';

interface NavbarLinksProps {
  favoritesLabel: string;
  homeLabel: string;
  isAuthenticated: boolean;
  myCoursesLabel: string;
}

export default function NavbarLinks({
  favoritesLabel,
  homeLabel,
  isAuthenticated,
  myCoursesLabel,
}: NavbarLinksProps) {
  return (
    <div className={styles.navigationLinks}>
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
        </>
      ) : null}
    </div>
  );
}
