'use client';

import { useTranslation } from 'react-i18next';
import AdminDashboardActivity from './AdminDashboardActivity';
import AdminDashboardHero from './AdminDashboardHero';
import AdminDashboardMetrics from './AdminDashboardMetrics';
import AdminRecentCourses from './AdminRecentCourses';
import AdminDashboardToolbar from './AdminDashboardToolbar';
import styles from './AdminDashboardPage.module.css';
import useAdminDashboard from './useAdminDashboard';

export default function AdminDashboardContent() {
  const { t, i18n } = useTranslation('admin');
  const { courses, error, loading, summary } = useAdminDashboard();

  return (
    <div className={styles.page}>
      <AdminDashboardHero language={i18n.language} t={t} />
      <AdminDashboardToolbar t={t} />

      {loading ? (
        <section className={styles.section}>
          <p className={styles.statusMessage}>{t('loading')}</p>
        </section>
      ) : error ? (
        <section className={styles.section}>
          <p className={styles.errorMessage}>{error}</p>
        </section>
      ) : (
        <>
          <div className={styles.dashboardGrid}>
            <div className={styles.primaryColumn}>
              <AdminDashboardMetrics summary={summary} t={t} />
              <AdminRecentCourses courses={courses} language={i18n.language} t={t} />
            </div>
            <div className={styles.secondaryColumn}>
              <AdminDashboardActivity courses={courses} language={i18n.language} t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
