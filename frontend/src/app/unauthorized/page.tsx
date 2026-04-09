'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';

export default function UnauthorizedPage() {
  const { t } = useTranslation('unauthorized');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>403</p>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.description}>{t('description')}</p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>
            {t('goToCourses')}
          </Link>

          <Link href="/auth/login" className={styles.secondaryAction}>
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
