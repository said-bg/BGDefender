import { useState } from 'react';
import type { Course } from '@/services/course';
import { formatCourseStatus, formatUpdatedAt, getCourseTitle } from './adminDashboard.utils';
import styles from './AdminDashboardActivity.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

type AdminDashboardActivityProps = {
  courses: Course[];
  language: string;
  t: AdminDashboardT;
};

export default function AdminDashboardActivity({
  courses,
  language,
  t,
}: AdminDashboardActivityProps) {
  const items = courses.slice(0, 3);
  const [isOpen, setIsOpen] = useState(true);
  const summaryLabel =
    items.length > 0
      ? t('dashboard.activitySummary', {
          count: items.length,
          defaultValue: `${items.length} recent update${items.length > 1 ? 's' : ''}`,
        })
      : t('dashboard.noActivity', {
          defaultValue: 'No course updates yet.',
        });

  return (
    <section className={styles.activity}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {t('dashboard.activityEyebrow', { defaultValue: 'Activity' })}
          </p>
          <h2 className={styles.title}>
            {t('dashboard.activityTitle', { defaultValue: 'Recent updates' })}
          </h2>
        </div>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setIsOpen((previous) => !previous)}
          aria-expanded={isOpen}
        >
          {isOpen
            ? t('dashboard.collapseActivity', { defaultValue: 'Hide' })
            : t('dashboard.expandActivity', { defaultValue: 'Show' })}
        </button>
      </div>

      {!isOpen ? <p className={styles.collapsedSummary}>{summaryLabel}</p> : null}

      {isOpen ? (
        <div className={styles.list}>
          {items.length > 0 ? (
            items.map((course) => (
              <article key={course.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <p className={styles.itemTitle}>{getCourseTitle(course, language)}</p>
                  <p className={styles.itemMeta}>
                    {formatCourseStatus(course.status, t)} - {formatUpdatedAt(course.updatedAt)}
                  </p>
                </div>
                <div className={styles.itemCounts}>
                  <span>
                    <strong>{course.authors.length}</strong> {t('authorsCount')}
                  </span>
                  <span>
                    <strong>{course.chapters.length}</strong> {t('chaptersCount')}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <p className={styles.emptyText}>
              {t('dashboard.noActivity', {
                defaultValue: 'No course updates yet.',
              })}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

