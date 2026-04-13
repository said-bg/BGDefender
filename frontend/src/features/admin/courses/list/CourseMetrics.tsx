'use client';

import { AdminCourseSummary } from '@/services/course';
import styles from './CourseMetrics.module.css';

type CourseMetricsProps = {
  summary: AdminCourseSummary | null;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CourseMetrics({ summary, t }: CourseMetricsProps) {
  const cards = [
    { key: 'totalCourses', label: t('metrics.totalCourses') },
    { key: 'publishedCourses', label: t('metrics.published') },
    { key: 'draftCourses', label: t('metrics.drafts') },
  ] as const;

  return (
    <section className={styles.metricStrip}>
      {cards.map((card) => (
        <article key={card.key} className={styles.metricCard}>
          <span className={styles.metricLabel}>{card.label}</span>
          <strong className={styles.metricValue}>{summary?.[card.key] ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}

