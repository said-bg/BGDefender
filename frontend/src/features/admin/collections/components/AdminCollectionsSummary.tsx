'use client';

import styles from './AdminCollectionsSummary.module.css';

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
          {t('collections.summaryTotal')}
        </span>
        <strong className={styles.summaryValue}>{summary.total}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryPublished')}
        </span>
        <strong className={styles.summaryValue}>{summary.published}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryHidden')}
        </span>
        <strong className={styles.summaryValue}>{summary.hidden}</strong>
      </article>
      <article className={styles.summaryCard}>
        <span className={styles.summaryLabel}>
          {t('collections.summaryAssignedCourses')}
        </span>
        <strong className={styles.summaryValue}>{summary.assignedCourses}</strong>
      </article>
    </section>
  );
}
