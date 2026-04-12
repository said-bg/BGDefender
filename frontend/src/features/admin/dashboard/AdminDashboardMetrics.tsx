import type { AdminCourseSummary } from '@/services/course';
import styles from './AdminDashboardMetrics.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

interface AdminDashboardMetricsProps {
  summary: AdminCourseSummary | null;
  t: AdminDashboardT;
}

export default function AdminDashboardMetrics({ summary, t }: AdminDashboardMetricsProps) {
  const metrics = [
    {
      label: t('metrics.totalCourses'),
      value: summary?.totalCourses ?? 0,
    },
    {
      label: t('metrics.published'),
      value: summary?.publishedCourses ?? 0,
    },
    {
      label: t('metrics.drafts'),
      value: summary?.draftCourses ?? 0,
    },
    {
      label: t('metrics.archived'),
      value: summary?.archivedCourses ?? 0,
    },
  ];

  return (
    <section className={styles.metricsGrid}>
      {metrics.map((metric) => (
        <article key={metric.label} className={styles.metricCard}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <strong className={styles.metricValue}>{metric.value}</strong>
        </article>
      ))}
    </section>
  );
}

