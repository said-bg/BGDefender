import type { CourseLearningSummary } from '@/services/course';
import styles from './CreatorLearningMetrics.module.css';

interface CreatorLearningMetricsProps {
  summary: CourseLearningSummary | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function CreatorLearningMetrics({
  summary,
  t,
}: CreatorLearningMetricsProps) {
  const metrics = [
    {
      label: t('creatorDashboard.metrics.startedLearners'),
      value: summary?.startedLearners ?? 0,
      hint: t('creatorDashboard.metrics.startedLearnersHint'),
    },
    {
      label: t('creatorDashboard.metrics.completedLearners'),
      value: summary?.completedLearners ?? 0,
      hint: t('creatorDashboard.metrics.completedLearnersHint'),
    },
    {
      label: t('creatorDashboard.metrics.averageProgress'),
      value:
        summary?.averageProgress !== null && summary?.averageProgress !== undefined
          ? `${summary.averageProgress}%`
          : '-',
      hint: t('creatorDashboard.metrics.averageProgressHint'),
    },
    {
      label: t('creatorDashboard.metrics.finalTestPassRate'),
      value:
        summary?.finalTestPassRate !== null &&
        summary?.finalTestPassRate !== undefined
          ? `${summary.finalTestPassRate}%`
          : '-',
      hint: t('creatorDashboard.metrics.finalTestPassRateHint', {
        count: summary?.finalTestAttempts ?? 0,
      }),
    },
  ];

  return (
    <section className={styles.metricsGrid}>
      {metrics.map((metric) => (
        <article key={metric.label} className={styles.metricCard}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <strong className={styles.metricValue}>{metric.value}</strong>
          <span className={styles.metricHint}>{metric.hint}</span>
        </article>
      ))}
    </section>
  );
}
