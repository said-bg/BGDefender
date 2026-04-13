'use client';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const isFirstLearnerVisit =
    isLearnerHome &&
    Boolean(learnerHomeStorageKey) &&
    typeof window !== 'undefined' &&
    window.localStorage.getItem(learnerHomeStorageKey) !== '1';

  useEffect(() => {
    if (!isLearnerHome || !learnerHomeStorageKey) {
      return;
    }

    window.localStorage.setItem(learnerHomeStorageKey, '1');
  }, [isLearnerHome, learnerHomeStorageKey]);

  const heroTitle = isLearnerHome
    ? t(isFirstLearnerVisit ? 'page.welcomeFirstTitle' : 'page.welcomeTitle', {
        defaultValue: isFirstLearnerVisit ? 'Welcome, {{name}}' : 'Welcome back, {{name}}',
        name: welcomeName,
      })
    : t('page.heroTitle');
  const heroDescription = isLearnerHome
    ? isFirstLearnerVisit
      ? t('page.welcomeFirstDescription', {
          defaultValue:
            'Start your learning journey with a clean path, complete your profile when you are ready, and build toward your first certificate.',
        })
      : hasIncompleteProfile
      ? t('page.welcomeDescriptionIncomplete', {
          defaultValue:
            'Complete your profile, keep learning, and unlock certificates as soon as you pass certifying courses.',
        })
      : t('page.welcomeDescription', {
          defaultValue:
            'Pick up your learning path, review your latest progress, and keep your certificates within easy reach.',
        })
    : t('page.heroDescription');
  const heroActions = isLearnerHome
    ? [
        {
          href: visibleInProgressCourses.length > 0 ? '/my-courses' : '#free-courses',
          label:
            visibleInProgressCourses.length > 0
              ? t('page.resumeLearning', { defaultValue: 'Resume learning' })
              : t('page.exploreCourses'),
        },
        {
          href: hasIncompleteProfile ? '/account' : '/certificates',
          label: hasIncompleteProfile
            ? t('page.completeProfileCta', { defaultValue: 'Complete profile' })
            : t('page.viewCertificatesCta', { defaultValue: 'View certificates' }),
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
            ? t('page.welcomeEyebrow', { defaultValue: 'Your learning space' })
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

      {courses.collections.map((collection) => (
        <HomeCourseRail
          key={collection.id}
          courses={collection.courses}
          title={getCollectionTitle(collection)}
          description={
            getCollectionDescription(collection) ||
            t('page.customCollectionDescription', {
              defaultValue: 'A curated collection assembled by your admin team.',
            })
          }
          emptyLabel={t('page.noCoursesAvailable')}
          getCourseDescription={getCardDescription}
          getCourseTitle={getTitle}
          t={t}
        />
      ))}

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
