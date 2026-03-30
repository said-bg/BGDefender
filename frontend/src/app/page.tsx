'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';
import courseService, { Course } from '@/services/courseService';
import progressService from '@/services/progressService';
import { useAuth } from '@/hooks';

interface CourseWithStats extends Course {
  chapterCount: number;
  itemCount: number;
  progressPercentage: number;
  lastAccessedAt?: string;
}

interface CoursesState {
  inProgress: CourseWithStats[];
  free: CourseWithStats[];
  premium: CourseWithStats[];
  loading: boolean;
  error: string | null;
}

const truncateText = (value: string, maxLength = 96) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength).trim()}...`;
};

export default function Home() {
  const { i18n, t } = useTranslation('courses');
  const { isAuthenticated, isInitialized } = useAuth();
  const [courses, setCourses] = useState<CoursesState>({
    inProgress: [],
    free: [],
    premium: [],
    loading: true,
    error: null,
  });

  // Keep this helper local to the page because the landing cards only need
  // a lightweight summary of the course structure.
  const getChapterAndItemCounts = (course: Course) => {
    const chapters = course.chapters || [];
    let totalItems = 0;

    chapters.forEach((chapter) => {
      const subChapters = chapter.subChapters || [];
      totalItems += subChapters.length;
    });

    return {
      chapters: chapters.length,
      items: totalItems,
    };
  };

  const heroImageSrc = '/assets/images/home-bg.png';

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourses((prev) => ({ ...prev, loading: true, error: null }));
        const [response, progressRows] = await Promise.all([
          courseService.getPublishedCourses(50, 0),
          isAuthenticated
            ? progressService.getMyProgress()
            : Promise.resolve([] as Awaited<
                ReturnType<typeof progressService.getMyProgress>
              >),
        ]);

        const progressByCourseId = new Map(
          progressRows.map((progress) => [progress.courseId, progress]),
        );

        const coursesWithStats: CourseWithStats[] = response.data.map((course) => {
          const { chapters, items } = getChapterAndItemCounts(course);
          const progress = progressByCourseId.get(course.id);

          return {
            ...course,
            chapterCount: chapters,
            itemCount: items,
            progressPercentage: progress?.completionPercentage ?? 0,
            lastAccessedAt: progress?.lastAccessedAt,
          };
        });

        const inProgressCourses = coursesWithStats
          .filter((course) => course.progressPercentage > 0)
          .sort((left, right) => {
            const leftTime = left.lastAccessedAt
              ? new Date(left.lastAccessedAt).getTime()
              : 0;
            const rightTime = right.lastAccessedAt
              ? new Date(right.lastAccessedAt).getTime()
              : 0;

            return rightTime - leftTime;
          });

        const freeCourses = coursesWithStats.filter((c) => c.level === 'free');
        const premiumCourses = coursesWithStats.filter(
          (c) => c.level === 'premium',
        );

        setCourses({
          inProgress: inProgressCourses,
          free: freeCourses,
          premium: premiumCourses,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to load courses:', error);
        setCourses((prev) => ({
          ...prev,
          loading: false,
          error: t('page.failedToLoadCourses'),
        }));
      }
    };

    if (!isInitialized) {
      return;
    }

    void loadCourses();
  }, [isAuthenticated, isInitialized, t]);

  const getTitle = (course: CourseWithStats) => {
    return i18n.language === 'fi' ? course.titleFi : course.titleEn;
  };

  // Keep the landing cards readable by using the course's real description
  // and shortening it when the text would otherwise dominate the card.
  const getCardDescription = (course: CourseWithStats) => {
    const localizedDescription =
      i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn;
    const fallbackDescription =
      i18n.language === 'fi' ? course.descriptionEn : course.descriptionFi;

    return truncateText(localizedDescription || fallbackDescription || '');
  };

  const renderCourseGrid = (courseList: CourseWithStats[]) => {
    if (courseList.length === 0) {
      return <p className={styles.emptyState}>{t('page.noCoursesAvailable')}</p>;
    }

    return (
      <div className={styles.grid}>
        {courseList.map((course, index) => (
          <div key={course.id} className={styles.card}>
            <div
              className={`${styles.cardHero} ${
                course.level === 'premium' ? styles.heroPremium : styles.heroFree
              }`}
            >
              {course.coverImage ? (
                <Image
                  src={course.coverImage}
                  alt={getTitle(course)}
                  fill
                  className={styles.cardImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className={styles.cardImagePlaceholder} />
              )}
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{getTitle(course)}</h3>
              <p className={styles.cardDescription}>{getCardDescription(course)}</p>

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
                    course.level === 'premium' ? styles.badgePremium : styles.badgeFree
                  }`}
                >
                  {course.level === 'premium'
                    ? t('page.badgePremium')
                    : t('page.badgeFree')}
                </span>
                <Link href={`/courses/${course.id}`} className={styles.button}>
                  {course.progressPercentage > 0
                    ? t('page.resume')
                    : t('page.start')}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (courses.loading) {
    return (
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroShell}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>{t('page.heroEyebrow')}</p>
              <h1 className={styles.heading}>{t('page.heroTitle')}</h1>
              <p className={styles.subheading}>{t('page.heroDescription')}</p>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <p className={styles.loadingState}>{t('page.loadingCourses')}</p>
        </section>
      </div>
    );
  }

  if (courses.error) {
    return (
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroShell}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>{t('page.heroEyebrow')}</p>
              <h1 className={styles.heading}>{t('page.heroTitle')}</h1>
              <p className={styles.subheading}>{t('page.heroDescription')}</p>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <p className={styles.errorState}>{courses.error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroShell}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>{t('page.heroEyebrow')}</p>
            <h1 className={styles.heading}>{t('page.heroTitle')}</h1>
            <p className={styles.subheading}>{t('page.heroDescription')}</p>

            <div className={styles.heroActions}>
              <a href="#free-courses" className={styles.primaryAction}>
                {t('page.exploreCourses')}
              </a>
              <a href="#premium-courses" className={styles.secondaryAction}>
                {t('page.viewPremium')}
              </a>
            </div>

            <div className={styles.heroHighlights}>
              <span className={styles.highlightPill}>{t('page.highlightExpert')}</span>
              <span className={styles.highlightPill}>{t('page.highlightLabs')}</span>
              <span className={styles.highlightPill}>
                {t('page.highlightCertificates')}
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroVisualFrame}>
              <div className={styles.heroImageWrap}>
                <Image
                  src={heroImageSrc}
                  alt="BG Defender home hero"
                  fill
                  priority
                  loading="eager"
                  className={styles.heroImage}
                  sizes="(max-width: 960px) 100vw, 48vw"
                />
              </div>

              <div className={styles.heroVisualCaption}>
                <span className={styles.heroMetaText}>{t('page.featuredCourse')}</span>
                <p className={styles.heroVisualTitle}>
                  {t('page.heroFallbackTitle')}
                </p>
                <p className={styles.heroVisualDescription}>
                  {t('page.heroFeaturedDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isAuthenticated && courses.inProgress.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIntro}>
              <h2 className={styles.sectionTitle}>{t('page.continueLearning')}</h2>
              <p className={styles.sectionDescription}>
                {t('page.continueLearningDescription')}
              </p>
            </div>
            <Link href="/my-courses" className={styles.sectionLink}>
              {t('page.viewAllMyCourses')}
            </Link>
          </div>
          {renderCourseGrid(courses.inProgress)}
        </section>
      )}

      {courses.free.length > 0 && (
        <section id="free-courses" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIntro}>
              <h2 className={styles.sectionTitle}>{t('page.free')}</h2>
              <p className={styles.sectionDescription}>
                {t('page.freeDescription')}
              </p>
            </div>
          </div>
          {renderCourseGrid(courses.free)}
        </section>
      )}

      {courses.premium.length > 0 && (
        <section id="premium-courses" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIntro}>
              <h2 className={styles.sectionTitle}>{t('page.premium')}</h2>
              <p className={styles.sectionDescription}>
                {t('page.premiumDescription')}
              </p>
            </div>
          </div>
          {renderCourseGrid(courses.premium)}
        </section>
      )}
    </div>
  );
}
