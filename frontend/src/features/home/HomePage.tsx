'use client';

import { useTranslation } from 'react-i18next';
import styles from './HomePage.module.css';
import HomeCourseRail from './HomeCourseRail';
import HomeHero from './HomeHero';
import useHomeCourses from './useHomeCourses';

export default function HomePage() {
  const { t } = useTranslation('courses');
  const {
    courses,
    getCardDescription,
    getTitle,
    isAuthenticated,
    visibleInProgressCourses,
  } = useHomeCourses();
  const heroTitle = t('page.heroTitle');

  if (courses.loading) {
    return (
      <div className={styles.container}>
        <HomeHero compact heroTitle={heroTitle} t={t} />
        <section className={styles.section}>
          <p className={styles.loadingState}>{t('page.loadingCourses')}</p>
        </section>
      </div>
    );
  }

  if (courses.error) {
    return (
      <div className={styles.container}>
        <HomeHero compact heroTitle={heroTitle} t={t} />
        <section className={styles.section}>
          <p className={styles.errorState}>{courses.error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <HomeHero heroTitle={heroTitle} t={t} />

      {isAuthenticated && visibleInProgressCourses.length > 0 && (
        <HomeCourseRail
          courses={visibleInProgressCourses}
          title={t('page.continueLearning')}
          description={t('page.continueLearningDescription')}
          emptyLabel={t('page.noCoursesAvailable')}
          viewAllHref="/my-courses"
          viewAllLabel={t('page.viewAllMyCourses')}
          getCourseDescription={getCardDescription}
          getCourseTitle={getTitle}
          t={t}
        />
      )}

      {courses.free.length > 0 && (
        <HomeCourseRail
          id="free-courses"
          courses={courses.free}
          title={t('page.free')}
          description={t('page.freeDescription')}
          emptyLabel={t('page.noCoursesAvailable')}
          getCourseDescription={getCardDescription}
          getCourseTitle={getTitle}
          t={t}
        />
      )}

      {courses.premium.length > 0 && (
        <HomeCourseRail
          id="premium-courses"
          courses={courses.premium}
          title={t('page.premium')}
          description={t('page.premiumDescription')}
          emptyLabel={t('page.noCoursesAvailable')}
          getCourseDescription={getCardDescription}
          getCourseTitle={getTitle}
          t={t}
        />
      )}
    </div>
  );
}
