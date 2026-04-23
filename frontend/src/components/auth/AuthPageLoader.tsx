/**
 * Auth Page Loader Component
 * Reusable loading spinner for auth pages
 * 
 * Usage:
 * <Suspense fallback={<AuthPageLoader />}>
 *   <YourAuthPage />
 * </Suspense>
 */

'use client';

import { useTranslation } from 'react-i18next';
import styles from './AuthPageLoader.module.css';

export const AuthPageLoader = () => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.loaderPage}>
      <div className={styles.loaderContent}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.loadingText}>{t('loading')}</p>
      </div>
    </div>
  );
};

export default AuthPageLoader;
