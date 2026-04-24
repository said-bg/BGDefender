'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './MyCoursesPage.module.css';
import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks';
import type { Course } from '@/services/course';
import CourseProgressCard from '@/features/courses/components/CourseProgressCard';
import { UserRole } from '@/types/api';
import useMyCoursesPage from './useMyCoursesPage';

function MyCoursesPageContent() {
  const { i18n, t } = useTranslation('courses');
  const { isAuthenticated, isInitialized } = useAuth();
  const { activeFilter, filteredCourses, setActiveFilter, state, summary } = useMyCoursesPage(
    isInitialized,
    isAuthenticated,
    t('myCourses.failedToLoad'),
  );

  const getCourseTitle = (course: Course) =>
    i18n.language === 'fi' ? course.titleFi : course.titleEn;

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>{t('myCourses.title')}</h1>
            <p className={styles.subtitle}>{t('myCourses.subtitle')}</p>
          </div>
          <p className={styles.courseCount}>
            {summary.all} {t('myCourses.summaryAll')}
          </p>
        </div>

        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterButton} ${
              activeFilter === 'all' ? styles.filterButtonActive : ''
            }`}
            onClick={() => setActiveFilter('all')}
          >
            {t('myCourses.all')}
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${
              activeFilter === 'in_progress' ? styles.filterButtonActive : ''
            }`}
            onClick={() => setActiveFilter('in_progress')}
          >
            {t('myCourses.inProgress')}
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${
              activeFilter === 'completed' ? styles.filterButtonActive : ''
            }`}
            onClick={() => setActiveFilter('completed')}
          >
            {t('myCourses.completed')}
          </button>
        </div>

        {state.loading ? (
          <p className={styles.stateMessage}>{t('myCourses.loading')}</p>
        ) : state.error ? (
          <p className={`${styles.stateMessage} ${styles.errorMessage}`}>
            {state.error}
          </p>
        ) : filteredCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>{t('myCourses.emptyTitle')}</h2>
            <p className={styles.emptyDescription}>
              {t('myCourses.emptyDescription')}
            </p>
            <Link href="/" className={styles.emptyAction}>
              {t('myCourses.browseCourses')}
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredCourses.map((course, index) => (
              <CourseProgressCard
                key={course.id}
                actionLabel={course.completed ? t('myCourses.review') : t('page.resume')}
                badgeLabel={
                  course.completed ? t('myCourses.completed') : t('myCourses.inProgress')
                }
                badgeVariant={course.completed ? 'completed' : 'active'}
                chaptersLabel={t('page.chapters')}
                course={course}
                href={`/courses/${course.id}`}
                itemsLabel={t('page.items')}
                priority={index === 0}
                progressLabel={t('page.progress')}
                resumeOnOpen
                title={getCourseTitle(course)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <ProtectedRoute
      requiredRole={[UserRole.USER, UserRole.CREATOR]}
      unauthorizedRedirect="/admin"
    >
      <MyCoursesPageContent />
    </ProtectedRoute>
  );
}

