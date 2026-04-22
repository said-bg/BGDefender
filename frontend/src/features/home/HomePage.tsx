'use client';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HomeCollectionsSection from './components/HomeCollectionsSection';
import HomeCourseRail from './components/HomeCourseRail';
import HomeHero from './components/HomeHero';
import useHomeCourses from './hooks/useHomeCourses';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { t } = useTranslation('courses');
  const {
    courses,
    getCollectionDescription,
    getCollectionTitle,
    getCardDescription,
    getTitle,
    hasIncompleteProfile,
    isAuthenticated,
    isLearnerHome,
    learnerHomeStorageKey,
    visibleInProgressCourses,
    welcomeName,
  } = useHomeCourses();
  const isFirstLearnerVisit = useMemo(() => {
    if (
      !isLearnerHome ||
      !learnerHomeStorageKey ||
      typeof window === 'undefined'
    ) {
      return false;
    }

    return window.localStorage.getItem(learnerHomeStorageKey) !== '1';
  }, [isLearnerHome, learnerHomeStorageKey]);

  useEffect(() => {
    if (!isLearnerHome || !learnerHomeStorageKey) {
      return;
    }

    window.localStorage.setItem(learnerHomeStorageKey, '1');
  }, [isLearnerHome, learnerHomeStorageKey]);

  const heroTitle = isLearnerHome
    ? t(isFirstLearnerVisit ? 'page.welcomeFirstTitle' : 'page.welcomeTitle', {
        name: welcomeName,
      })
    : t('page.heroTitle');
  const heroDescription = isLearnerHome
    ? isFirstLearnerVisit
      ? t('page.welcomeFirstDescription')
      : hasIncompleteProfile
      ? t('page.welcomeDescriptionIncomplete')
      : t('page.welcomeDescription')
    : t('page.heroDescription');
  const heroActions = isLearnerHome
    ? [
        {
          href: visibleInProgressCourses.length > 0 ? '/my-courses' : '#free-courses',
          label:
            visibleInProgressCourses.length > 0
              ? t('page.resumeLearning')
              : t('page.exploreCourses'),
        },
        {
          href: hasIncompleteProfile ? '/account' : '/certificates',
          label: hasIncompleteProfile
            ? t('page.completeProfileCta')
            : t('page.viewCertificatesCta'),
          secondary: true,
        },
      ]
    : undefined;
  if (courses.loading) {
    return (
      <div className={styles.container}>
        <HomeHero compact description={heroDescription} heroTitle={heroTitle} t={t} />
        <section className={styles.section}>
          <p className={styles.loadingState}>{t('page.loadingCourses')}</p>
        </section>
      </div>
    );
  }

  if (courses.error) {
    return (
      <div className={styles.container}>
        <HomeHero compact description={heroDescription} heroTitle={heroTitle} t={t} />
        <section className={styles.section}>
          <p className={styles.errorState}>{courses.error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <HomeHero
        actions={heroActions}
        description={heroDescription}
        eyebrow={
          isLearnerHome
            ? t('page.welcomeEyebrow')
            : undefined
        }
        heroTitle={heroTitle}
        t={t}
      />

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

      {courses.collections.length > 0 && (
        <HomeCollectionsSection
          collections={courses.collections}
          title={t('page.collections')}
          description={t('page.collectionsDescription')}
          emptyLabel={t('page.noCoursesAvailable')}
          getCollectionDescription={getCollectionDescription}
          getCollectionTitle={getCollectionTitle}
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
