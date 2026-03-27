'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import styles from './page.module.css';
import courseService, { Course } from '@/services/courseService';

interface CourseWithStats extends Course {
  chapterCount: number;
  itemCount: number;
}

interface CoursesState {
  free: CourseWithStats[];
  premium: CourseWithStats[];
  loading: boolean;
  error: string | null;
}

export default function Home() {
  const { i18n, t } = useTranslation('courses');
  const [courses, setCourses] = useState<CoursesState>({
    free: [],
    premium: [],
    loading: true,
    error: null,
  });

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

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourses((prev) => ({ ...prev, loading: true, error: null }));
        const response = await courseService.getPublishedCourses(50, 0);

        const coursesWithStats: CourseWithStats[] = response.data.map((course) => {
          const { chapters, items } = getChapterAndItemCounts(course);
          return {
            ...course,
            chapterCount: chapters,
            itemCount: items,
          };
        });

        const freeCourses = coursesWithStats.filter((c) => c.level === 'free');
        const premiumCourses = coursesWithStats.filter(
          (c) => c.level === 'premium',
        );

        setCourses({
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

    loadCourses();
  }, [t]);

  const renderCourseGrid = (courseList: CourseWithStats[]) => {
    if (courseList.length === 0) {
      return <p className={styles.emptyState}>No courses available</p>;
    }

    const getTitle = (course: CourseWithStats) => {
      return i18n.language === 'fi' ? course.titleFi : course.titleEn;
    };

    return (
      <div className={styles.grid}>
        {courseList.map((course, index) => (
          <div key={course.id} className={styles.card}>
            {/* Hero/Cover - Image from API */}
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

            {/* Content */}
            <div className={styles.cardBody}>
              {/* Title */}
              <h3 className={styles.cardTitle}>{getTitle(course)}</h3>

              {/* Stats */}
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
                  <span className={styles.statValue}>0%</span>
                  <span className={styles.statLabel}>{t('page.progress')}</span>
                </div>
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <span
                  className={`${styles.badge} ${
                    course.level === 'premium' ? styles.badgePremium : styles.badgeFree
                  }`}
                >
                  {course.level === 'premium' ? 'Premium' : 'Free'}
                </span>
                <Link href={`/courses/${course.id}`} className={styles.button}>
                  {t('page.start')}
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
          <div className={styles.heroContent}>
            <h1 className={styles.heading}>{t('page.title')}</h1>
            <p className={styles.subheading}>{t('page.subtitle')}</p>
          </div>
        </section>
        <section className={styles.section}>
          <p className={styles.loadingState}>Loading courses...</p>
        </section>
      </div>
    );
  }

  if (courses.error) {
    return (
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heading}>{t('page.title')}</h1>
            <p className={styles.subheading}>{t('page.subtitle')}</p>
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
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heading}>{t('page.title')}</h1>
          <p className={styles.subheading}>{t('page.subtitle')}</p>
        </div>
      </section>

      {/* Free Courses Section */}
      {courses.free.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('page.free')}</h2>
          </div>
          {renderCourseGrid(courses.free)}
        </section>
      )}

      {/* Premium Courses Section */}
      {courses.premium.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('page.premium')}</h2>
          </div>
          {renderCourseGrid(courses.premium)}
        </section>
      )}
    </div>
  );
}
