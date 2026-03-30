'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';
import { ProtectedRoute } from '@/components/auth';
import { useAuth } from '@/hooks';
import courseService, { Course } from '@/services/courseService';
import progressService from '@/services/progressService';
import {
  CourseFilter,
  CourseWithProgress,
  buildStartedCourses,
  filterMyCourses,
  getMyCoursesSummary,
} from './my-courses.utils';

type MyCoursesState = {
  courses: CourseWithProgress[];
  loading: boolean;
  error: string | null;
};

function MyCoursesPageContent() {
  const { i18n, t } = useTranslation('courses');
  const { isAuthenticated, isInitialized } = useAuth();
  const [activeFilter, setActiveFilter] = useState<CourseFilter>('all');
  const [state, setState] = useState<MyCoursesState>({
    courses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      return;
    }

    // Load the user's started courses by combining public course data with the saved progress rows.
    const loadMyCourses = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(100, 0),
          progressService.getMyProgress(),
        ]);
        const startedCourses = buildStartedCourses(response.data, progressRows);

        setState({
          courses: startedCourses,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load my courses:', error);
        setState({
          courses: [],
          loading: false,
          error: t('myCourses.failedToLoad'),
        });
      }
    };

    void loadMyCourses();
  }, [isAuthenticated, isInitialized, t]);

  // Keep the filtering logic in one place so the page stays easy to extend later with favorites.
  const filteredCourses = useMemo(() => {
    return filterMyCourses(state.courses, activeFilter);
  }, [activeFilter, state.courses]);

  const summary = useMemo(() => {
    // Keep the summary counts derived from the same source list to avoid drift between tabs and cards.
    return getMyCoursesSummary(state.courses);
  }, [state.courses]);

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
              <article key={course.id} className={styles.card}>
                <div
                  className={`${styles.cardHero} ${
                    course.level === 'premium'
                      ? styles.heroPremium
                      : styles.heroFree
                  }`}
                >
                  {course.coverImage ? (
                    <Image
                      src={course.coverImage}
                      alt={getCourseTitle(course)}
                      fill
                      className={styles.cardImage}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index === 0}
                    />
                  ) : (
                    <div className={styles.cardImagePlaceholder} />
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{getCourseTitle(course)}</h2>

                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{course.chapterCount}</span>
                      <span className={styles.statLabel}>{t('page.chapters')}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{course.itemCount}</span>
                      <span className={styles.statLabel}>{t('page.items')}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {course.progressPercentage}%
                      </span>
                      <span className={styles.statLabel}>{t('page.progress')}</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <span
                      className={`${styles.badge} ${
                        course.completed ? styles.badgeCompleted : styles.badgeActive
                      }`}
                    >
                      {course.completed
                        ? t('myCourses.completed')
                        : t('myCourses.inProgress')}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className={styles.resumeButton}
                    >
                      {course.completed ? t('myCourses.review') : t('page.resume')}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <ProtectedRoute>
      <MyCoursesPageContent />
    </ProtectedRoute>
  );
}
