'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import styles from './page.module.css';

export default function UnauthorizedPage() {
  const { t } = useTranslation('unauthorized');
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>403</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.description}>{t('description')}</p>

        <div className={styles.actions}>
          <Link href={localizePathname('/', activeLocale)} className={styles.primaryAction}>
            {t('goToCourses')}
          </Link>

          <Link
            href={localizePathname('/login', activeLocale)}
            className={styles.secondaryAction}
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
