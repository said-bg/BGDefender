'use client';

import { useTranslation } from 'react-i18next';
import AdminDashboardActivity from '@/features/admin/dashboard/AdminDashboardActivity';
import AdminDashboardMetrics from '@/features/admin/dashboard/AdminDashboardMetrics';
import AdminRecentCourses from '@/features/admin/dashboard/AdminRecentCourses';
import styles from '@/features/admin/dashboard/AdminDashboardPage.module.css';
import CreatorDashboardHero from './CreatorDashboardHero';
import CreatorLearningMetrics from './CreatorLearningMetrics';
import CreatorDashboardToolbar from './CreatorDashboardToolbar';
import useCreatorDashboard from './useCreatorDashboard';

export default function CreatorDashboardContent() {
  const { t, i18n } = useTranslation('admin');
  const { courses, error, learningSummary, loading, summary } =
    useCreatorDashboard();

  return (
    <div className={styles.page}>
      <CreatorDashboardHero t={t} />
      <CreatorDashboardToolbar t={t} />

      {loading ? (
        <section className={styles.section}>
          <p className={styles.statusMessage}>{t('loading')}</p>
        </section>
      ) : error ? (
        <section className={styles.section}>
          <p className={styles.errorMessage}>{error}</p>
        </section>
      ) : (
        <div className={styles.dashboardGrid}>
          <div className={styles.primaryColumn}>
            <CreatorLearningMetrics summary={learningSummary} t={t} />
            <AdminDashboardMetrics summary={summary} t={t} />
            <AdminRecentCourses courses={courses} language={i18n.language} t={t} />
          </div>
          <div className={styles.secondaryColumn}>
            <AdminDashboardActivity courses={courses} language={i18n.language} t={t} />
          </div>
        </div>
      )}
    </div>
  );
}
