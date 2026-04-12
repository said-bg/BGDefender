'use client';

import styles from '../AdminCollectionsPage.module.css';

type CollectionsTranslate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type CollectionsSummary = {
  total: number;
  published: number;
  hidden: number;
  assignedCourses: number;
};

type AdminCollectionsSummaryProps = {
  summary: CollectionsSummary;
  t: CollectionsTranslate;
};

export default function AdminCollectionsSummary({
  summary,
  t,
}: AdminCollectionsSummaryProps) {
  return (
    <section className={styles.summary}>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryTotal', { defaultValue: 'Collections' })}
        </span>
        <strong className={styles.summaryValue}>{summary.total}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryPublished', { defaultValue: 'Published' })}
        </span>
        <strong className={styles.summaryValue}>{summary.published}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryHidden', { defaultValue: 'Hidden' })}
        </span>
        <strong className={styles.summaryValue}>{summary.hidden}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryAssignedCourses', {
            defaultValue: 'Assigned courses',
          })}
        </span>
        <strong className={styles.summaryValue}>{summary.assignedCourses}</strong>
      </article>
    </section>
  );
}
