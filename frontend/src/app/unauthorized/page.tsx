'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';

export default function UnauthorizedPage() {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>403</p>
        <h1 className={styles.title}>{t('unauthorized.title')}</h1>
        <p className={styles.description}>{t('unauthorized.description')}</p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>
            {t('unauthorized.goToCourses')}
          </Link>

          <Link href="/auth/login" className={styles.secondaryAction}>
            {t('unauthorized.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
