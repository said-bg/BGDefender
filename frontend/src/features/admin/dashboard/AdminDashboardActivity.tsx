import { useState } from 'react';
import type { Course } from '@/services/course';
import {
  formatAuditDateTime,
  formatCourseStatus,
  getActorName,
  getCourseTitle,
} from './adminDashboard.utils';
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
  const activityPanelId = 'admin-dashboard-activity-panel';
  const summaryLabel =
    items.length > 0
      ? t('dashboard.activitySummary', { count: items.length })
      : t('dashboard.noActivity');

  return (
    <section className={styles.activity}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('dashboard.activityEyebrow')}</p>
          <h2 className={styles.title}>{t('dashboard.activityTitle')}</h2>
        </div>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setIsOpen((previous) => !previous)}
          aria-expanded={isOpen}
          aria-controls={activityPanelId}
        >
          {isOpen
            ? t('dashboard.collapseActivity')
            : t('dashboard.expandActivity')}
        </button>
      </div>

      {!isOpen ? <p className={styles.collapsedSummary}>{summaryLabel}</p> : null}

      {isOpen ? (
        <div id={activityPanelId} className={styles.list}>
          {items.length > 0 ? (
            items.map((course) => {
              const auditActor =
                (course.status === 'published'
                  ? course.publishedBy ??
                    course.lastEditedBy ??
                    course.createdBy ??
                    course.owner
                  : course.lastEditedBy ??
                    course.publishedBy ??
                    course.createdBy ??
                    course.owner) ?? null;

              return (
                <article key={course.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <p className={styles.itemTitle}>{getCourseTitle(course, language)}</p>
                    <p className={styles.itemMeta}>
                      {formatCourseStatus(course.status, t)} -{' '}
                      {course.status === 'published' && course.publishedAt
                        ? formatAuditDateTime(course.publishedAt, language)
                        : formatAuditDateTime(course.updatedAt, language)}
                    </p>
                    <p className={styles.itemAudit}>
                      {course.status === 'published' && course.publishedAt
                        ? t('dashboard.activityPublishedBy', {
                            actor: getActorName(auditActor, t('auditUnknown')),
                          })
                        : t('dashboard.activityEditedBy', {
                            actor: getActorName(auditActor, t('auditUnknown')),
                          })}
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
              );
            })
          ) : (
            <p className={styles.emptyText}>{t('dashboard.noActivity')}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

