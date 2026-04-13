'use client';

import Link from 'next/link';
import CourseCover from '@/components/course-cover/CourseCover';
import type { HomeCourseCollection } from '../lib/home.types';
import styles from './HomeCollectionsSection.module.css';

type HomeCollectionsSectionProps = {
  collections: HomeCourseCollection[];
  description: string;
  emptyLabel: string;
  title: string;
  getCollectionDescription: (collection: HomeCourseCollection) => string;
  getCollectionTitle: (collection: HomeCourseCollection) => string;
  getCourseTitle: (course: HomeCourseCollection['courses'][number]) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function HomeCollectionsSection({
  collections,
  description,
  emptyLabel,
  title,
  getCollectionDescription,
  getCollectionTitle,
  getCourseTitle,
  t,
}: HomeCollectionsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
      </div>

      {collections.length === 0 ? (
        <p className={styles.emptyState}>{emptyLabel}</p>
      ) : (
        <div className={styles.grid}>
          {collections.map((collection, index) => {
            const collectionTitle = getCollectionTitle(collection);
            const collectionDescription =
              getCollectionDescription(collection) ||
              t('page.collectionCardFallbackDescription', {
                count: collection.courses.length,
                defaultValue: '{{count}} courses grouped into one guided learning path.',
              });
            const previewCourses = collection.courses.slice(0, 3);

            return (
              <article key={collection.id} className={styles.card}>
                <Link href={`/collections/${collection.id}`} className={styles.cardLink}>
                  <div className={styles.cardHero}>
                    <CourseCover
                      src={collection.coverImage}
                      title={collectionTitle}
                      sizes="(max-width: 768px) 90vw, 360px"
                      imageClassName={styles.cardImage}
                      fallbackClassName={styles.cardImagePlaceholder}
                      priority={index === 0}
                    />
                    <span className={styles.collectionLabel}>
                      {t('page.collectionLabel', { defaultValue: 'Collection' })}
                    </span>
                    <span className={styles.courseCountBadge}>
                      {t('page.collectionCourseCount', {
                        count: collection.courses.length,
                        defaultValue: '{{count}} courses included',
                      })}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{collectionTitle}</h3>
                    <p className={styles.cardDescription}>{collectionDescription}</p>

                    {previewCourses.length > 0 ? (
                      <ul className={styles.previewList}>
                        {previewCourses.map((course) => (
                          <li key={course.id} className={styles.previewItem}>
                            {getCourseTitle(course)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.previewEmpty}>{emptyLabel}</p>
                    )}

                    <span className={styles.openLink}>
                      {t('page.openCollection', {
                        defaultValue: 'Open collection',
                      })}
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
