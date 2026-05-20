'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import styles from './AppFooter.module.css';

export default function AppFooter() {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <div className={styles.links}>
          <Link href={localizePathname('/contact', activeLocale)} className={styles.link}>
            {t('footer.links.contact')}
          </Link>
        </div>
        <p className={styles.text}>
          {`Copyright ${currentYear} ${t('footer.rights')}`}
        </p>
      </div>
    </footer>
  );
}
