import type { Course } from '@/services/courseService';
import { formatCourseLevel, formatCourseStatus, getCourseTitle } from './adminDashboard.utils';
import styles from './AdminRecentCourses.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

interface AdminRecentCoursesProps {
  courses: Course[];
  language: string;
  t: AdminDashboardT;
}

export default function AdminRecentCourses({ courses, language, t }: AdminRecentCoursesProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{t('recentCoursesTitle')}</h2>
          <p className={styles.sectionDescription}>{t('recentCoursesDescription')}</p>
        </div>
      </div>

      <div className={styles.courseList}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <article key={course.id} className={styles.courseRow}>
              <div className={styles.courseMain}>
                <span className={styles.statusPill}>{formatCourseStatus(course.status, t)}</span>
                <div>
                  <h3 className={styles.courseTitle}>{getCourseTitle(course, language)}</h3>
                  <div className={styles.courseMetaRow}>
                    <span
                      className={`${styles.levelBadge} ${
                        course.level === 'premium' ? styles.levelPremium : styles.levelFree
                      }`}
                    >
                      {formatCourseLevel(course.level, t)}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.courseMetaGroup}>
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
    </section>
  );
}
