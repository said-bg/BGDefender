'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import HomeCourseCard from '@/features/home/components/HomeCourseCard';
import type { HomeCourse } from '@/features/home/lib/home.types';
import collectionService from '@/services/collections';
import type { CourseCollection } from '@/services/course';
import progressService from '@/services/progress';
import styles from './CollectionDetailPage.module.css';

type ProgressRow = Awaited<ReturnType<typeof progressService.getMyProgress>>[number];

const truncateText = (value: string, maxLength = 96) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength).trim()}...`;
};

const getChapterAndItemCounts = (course: CourseCollection['courses'][number]) => {
  const chapters = course.chapters || [];
  let totalItems = 0;

  chapters.forEach((chapter) => {
    totalItems += (chapter.subChapters || []).length;
  });

  return {
    chapters: chapters.length,
    items: totalItems,
  };
};

const mapCourseWithStats = (
  course: CourseCollection['courses'][number],
  progressByCourseId: Map<number | string, ProgressRow>,
): HomeCourse => {
  const { chapters, items } = getChapterAndItemCounts(course);
  const progress = progressByCourseId.get(course.id);

  return {
    ...course,
    chapterCount: chapters,
    itemCount: items,
    progressPercentage: progress?.completionPercentage ?? 0,
    lastAccessedAt: progress?.lastAccessedAt,
  };
};

export default function CollectionDetailPage() {
  const params = useParams<{ collectionId: string }>();
  const collectionId = Array.isArray(params?.collectionId)
    ? params.collectionId[0]
    : params?.collectionId;
  const { i18n, t } = useTranslation('courses');
  const { isAuthenticated, isInitialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<CourseCollection | null>(null);
  const [courses, setCourses] = useState<HomeCourse[]>([]);

  useEffect(() => {
    const loadCollection = async () => {
      if (!collectionId) {
        setLoading(false);
        setError(t('collectionDetail.notFoundTitle'));
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [collectionRows, progressRows] = await Promise.all([
          collectionService.getPublishedCollections(),
          isAuthenticated
            ? progressService.getMyProgress()
            : Promise.resolve([] as ProgressRow[]),
        ]);

        const matchedCollection =
          collectionRows.find((entry) => entry.id === collectionId) ?? null;

        if (!matchedCollection) {
          setCollection(null);
          setCourses([]);
          setError(t('collectionDetail.notFoundTitle'));
          setLoading(false);
          return;
        }

        const progressByCourseId = new Map(
          progressRows.map((progress) => [progress.courseId, progress]),
        );

        setCollection(matchedCollection);
        setCourses(
          matchedCollection.courses.map((course) =>
            mapCourseWithStats(course, progressByCourseId),
          ),
        );
        setLoading(false);
      } catch {
        setCollection(null);
        setCourses([]);
        setError(t('page.failedToLoadCourses'));
        setLoading(false);
      }
    };

    if (isInitialized) {
      void loadCollection();
    }
  }, [collectionId, isAuthenticated, isInitialized, t]);

  const collectionTitle = useMemo(() => {
    if (!collection) {
      return '';
    }

    return i18n.language === 'fi' ? collection.titleFi : collection.titleEn;
  }, [collection, i18n.language]);

  const collectionDescription = useMemo(() => {
    if (!collection) {
      return '';
    }

    const localizedDescription =
      i18n.language === 'fi' ? collection.descriptionFi : collection.descriptionEn;
    const fallbackDescription =
      i18n.language === 'fi' ? collection.descriptionEn : collection.descriptionFi;

    return (
      localizedDescription ||
      fallbackDescription ||
      t('page.collectionCardFallbackDescription', {
        count: collection.courses.length,
      })
    ).trim();
  }, [collection, i18n.language, t]);

  const getCourseTitle = (course: HomeCourse) =>
    i18n.language === 'fi' ? course.titleFi : course.titleEn;

  const getCourseDescription = (course: HomeCourse) => {
    const localizedDescription = i18n.language === 'fi' ? course.descriptionFi : course.descriptionEn;
    const fallbackDescription = i18n.language === 'fi' ? course.descriptionEn : course.descriptionFi;

    return truncateText(localizedDescription || fallbackDescription || '');
  };

  return (
    <div className={styles.container}>
      <section className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          {t('collectionDetail.back')}
        </Link>

        {loading ? (
          <div className={styles.stateCard}>
            {t('collectionDetail.loading')}
          </div>
        ) : error || !collection ? (
          <div className={styles.stateCard}>
            <h1 className={styles.stateTitle}>
              {t('collectionDetail.notFoundTitle')}
            </h1>
            <p className={styles.stateDescription}>
              {error === t('page.failedToLoadCourses')
                ? error
                : t('collectionDetail.notFoundDescription')}
            </p>
          </div>
        ) : (
          <>
            <header className={styles.header}>
              <span className={styles.eyebrow}>
                {t('page.collections')}
              </span>
              <h1 className={styles.title}>{collectionTitle}</h1>
              <p className={styles.description}>{collectionDescription}</p>
            </header>

            {courses.length === 0 ? (
              <div className={styles.stateCard}>
                <h2 className={styles.stateTitle}>
                  {t('collectionDetail.emptyTitle')}
                </h2>
                <p className={styles.stateDescription}>
                  {t('collectionDetail.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className={styles.grid}>
                {courses.map((course, index) => (
                  <HomeCourseCard
                    key={course.id}
                    course={course}
                    getCourseDescription={getCourseDescription}
                    getCourseTitle={getCourseTitle}
                    priority={index === 0}
                    t={t}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
