'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';
import { ProtectedRoute } from '@/components/auth';
import { useFavoriteCourses } from '@/hooks';
import courseService, { Course } from '@/services/courseService';
import progressService from '@/services/progressService';
import type { FavoriteSummary } from '@/services/favoriteService';
import { buildFavoriteCourses } from './favorite-courses.utils';

type FavoriteCoursesState = {
  courses: Course[];
  progressRows: Awaited<ReturnType<typeof progressService.getMyProgress>>;
  loading: boolean;
  error: string | null;
};

function FavoritesPageContent() {
  const { i18n, t } = useTranslation('courses');
  const { favorites, isLoading: loadingFavorites, toggleFavorite } = useFavoriteCourses();
  const [state, setState] = useState<FavoriteCoursesState>({
    courses: [],
    progressRows: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Load public course data and progress rows once so the favorites page can
    // derive everything from the current favorite ids without refetching on each toggle.
    const loadFavoritePageData = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: null }));

        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(100, 0),
          progressService.getMyProgress(),
        ]);

        setState({
          courses: response.data,
          progressRows,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load favorites page:', error);
        setState({
          courses: [],
          progressRows: [],
          loading: false,
          error: t('favorites.failedToLoad'),
        });
      }
    };

    void loadFavoritePageData();
  }, [t]);

  const favoriteCourses = useMemo(
    () => buildFavoriteCourses(state.courses, favorites as FavoriteSummary[], state.progressRows),
    [favorites, state.courses, state.progressRows],
  );

  const getCourseTitle = (course: Course) =>
    i18n.language === 'fi' ? course.titleFi : course.titleEn;

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>{t('favorites.title')}</h1>
            <p className={styles.subtitle}>{t('favorites.subtitle')}</p>
          </div>
          <p className={styles.courseCount}>
            {favoriteCourses.length} {t('favorites.summaryAll')}
          </p>
        </div>

        {state.loading || loadingFavorites ? (
          <p className={styles.stateMessage}>{t('favorites.loading')}</p>
        ) : state.error ? (
          <p className={`${styles.stateMessage} ${styles.errorMessage}`}>
            {state.error}
          </p>
        ) : favoriteCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>{t('favorites.emptyTitle')}</h2>
            <p className={styles.emptyDescription}>
              {t('favorites.emptyDescription')}
            </p>
            <Link href="/" className={styles.emptyAction}>
              {t('favorites.browseCourses')}
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {favoriteCourses.map((course, index) => (
              <article key={course.id} className={styles.card}>
                <div
                  className={`${styles.cardHero} ${
                    course.level === 'premium' ? styles.heroPremium : styles.heroFree
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
                  <p className={styles.cardDescription}>
                    {i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn}
                  </p>

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
                    <div className={styles.cardFooterLeft}>
                      <span
                        className={`${styles.badge} ${
                          course.level === 'premium' ? styles.badgePremium : styles.badgeFree
                        }`}
                      >
                        {course.level === 'premium'
                          ? t('page.badgePremium')
                          : t('page.badgeFree')}
                      </span>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => void toggleFavorite(course.id)}
                      >
                        {t('favorites.remove')}
                      </button>
                    </div>
                    <Link href={`/courses/${course.id}`} className={styles.resumeButton}>
                      {course.progressPercentage > 0 ? t('page.resume') : t('page.start')}
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

export default function FavoritesPage() {
  return (
    <ProtectedRoute>
      <FavoritesPageContent />
    </ProtectedRoute>
  );
}
