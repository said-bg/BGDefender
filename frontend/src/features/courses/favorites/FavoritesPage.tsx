'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './FavoritesPage.module.css';
import { ProtectedRoute } from '@/components/auth';
import type { Course } from '@/services/course';
import CourseProgressCard from '@/features/courses/components/CourseProgressCard';
import { UserRole } from '@/types/api';
import useFavoritesPage from './useFavoritesPage';

function FavoritesPageContent() {
  const { i18n, t } = useTranslation('courses');
  const { error, favoriteCourses, loading, toggleFavorite } = useFavoritesPage(
    t('favorites.failedToLoad'),
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

        {loading ? (
          <p className={styles.stateMessage}>{t('favorites.loading')}</p>
        ) : error ? (
          <p className={`${styles.stateMessage} ${styles.errorMessage}`}>
            {error}
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
              <CourseProgressCard
                key={course.id}
                actionLabel={course.progressPercentage > 0 ? t('page.resume') : t('page.start')}
                badgeLabel={
                  course.level === 'premium' ? t('page.badgePremium') : t('page.badgeFree')
                }
                badgeVariant={course.level === 'premium' ? 'premium' : 'free'}
                chaptersLabel={t('page.chapters')}
                course={course}
                description={i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn}
                href={`/courses/${course.id}`}
                itemsLabel={t('page.items')}
                onRemove={() => void toggleFavorite(course.id)}
                priority={index === 0}
                progressLabel={t('page.progress')}
                removeLabel={t('favorites.remove')}
                title={getCourseTitle(course)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <ProtectedRoute
      requiredRole={[UserRole.USER, UserRole.CREATOR]}
      unauthorizedRedirect="/admin"
    >
      <FavoritesPageContent />
    </ProtectedRoute>
  );
}

