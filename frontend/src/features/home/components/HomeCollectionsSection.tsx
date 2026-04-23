'use client';

import Link from 'next/link';
import CourseCover from '@/components/course-cover/CourseCover';
import useHomeCourseRailScroll from '../hooks/useHomeCourseRailScroll';
import type { HomeCourseCollection } from '../lib/home.types';
import styles from './HomeCollectionsSection.module.css';

type HomeCollectionsSectionProps = {
  collections: HomeCourseCollection[];
  description: string;
  emptyLabel: string;
  title: string;
  getCollectionTitle: (collection: HomeCourseCollection) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function HomeCollectionsSection({
  collections,
  description,
  emptyLabel,
  title,
  getCollectionTitle,
  t,
}: HomeCollectionsSectionProps) {
  const { canScrollLeft, canScrollRight, scrollByViewport, viewportRef } =
    useHomeCourseRailScroll(collections.length);

  const renderCollectionCard = (collection: HomeCourseCollection, index: number) => {
    const collectionTitle = getCollectionTitle(collection);
    const stackDepth = Math.min(Math.max(collection.courses.length - 1, 0), 2);
    const stackCourses = collection.courses.slice(0, 2);

    return (
      <article key={collection.id} className={styles.card}>
        <Link href={`/collections/${collection.id}`} className={styles.cardLink}>
          {stackDepth > 0 ? (
            <div className={styles.stackFrame}>
              {stackDepth >= 2 ? (
                <div className={`${styles.stackLayer} ${styles.stackLayerBack}`}>
                  <CourseCover
                    src={stackCourses[1]?.coverImage}
                    title={
                      stackCourses[1]?.titleEn ||
                      stackCourses[1]?.titleFi ||
                      t('page.collectionLabel')
                    }
                    seedKey={stackCourses[1]?.id || `${collection.id}-stack-back`}
                    sizes="280px"
                    imageClassName={styles.stackLayerImage}
                    fallbackClassName={styles.stackLayerFill}
                    variant="stack"
                  />
                </div>
              ) : null}
              <div className={`${styles.stackLayer} ${styles.stackLayerMid}`}>
                <CourseCover
                  src={stackCourses[0]?.coverImage}
                  title={
                    stackCourses[0]?.titleEn ||
                    stackCourses[0]?.titleFi ||
                      t('page.collectionLabel')
                  }
                  seedKey={stackCourses[0]?.id || `${collection.id}-stack-mid`}
                  sizes="280px"
                  imageClassName={styles.stackLayerImage}
                  fallbackClassName={styles.stackLayerFill}
                  variant="stack"
                />
              </div>
            </div>
          ) : null}

          <div className={styles.cardHero}>
            <CourseCover
              src={collection.coverImage}
              title={collectionTitle}
              seedKey={collection.id}
              sizes="(max-width: 768px) 90vw, 360px"
              imageClassName={styles.cardImage}
              fallbackClassName={styles.cardImagePlaceholder}
              priority={index === 0}
              variant="collection"
            />

            <div className={styles.heroPanel}>
              <span className={styles.collectionLabel}>
                {t('page.collectionLabel')}
              </span>
              <h3 className={styles.heroTitle}>{collectionTitle}</h3>
              <div className={styles.heroFooter}>
                <p className={styles.heroMeta}>
                  {t('page.collectionCourseCount', {
                    count: collection.courses.length,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.cardBody}>
            {collection.courses.length === 0 ? (
              <p className={styles.previewEmpty}>{emptyLabel}</p>
            ) : null}
          </div>
        </Link>
      </article>
    );
  };

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
      ) : collections.length <= 3 ? (
        <div className={styles.grid}>
          {collections.map((collection, index) => renderCollectionCard(collection, index))}
        </div>
      ) : (
        <div className={styles.railShell}>
          {canScrollLeft ? (
            <button
              type="button"
              className={`${styles.railNav} ${styles.railNavLeft}`}
              onClick={() => scrollByViewport('left')}
              aria-label={t('page.scrollLeft')}
            >
              {'\u2039'}
            </button>
          ) : null}

          <div className={styles.railFrame}>
            {canScrollLeft ? <div className={`${styles.railEdge} ${styles.railEdgeLeft}`} /> : null}
            <div ref={viewportRef} className={styles.railViewport}>
              {collections.map((collection, index) => (
                <div key={collection.id} className={styles.railCard}>
                  {renderCollectionCard(collection, index)}
                </div>
              ))}
            </div>
            {canScrollRight ? <div className={`${styles.railEdge} ${styles.railEdgeRight}`} /> : null}
          </div>

          {canScrollRight ? (
            <button
              type="button"
              className={`${styles.railNav} ${styles.railNavRight}`}
              onClick={() => scrollByViewport('right')}
              aria-label={t('page.scrollRight')}
            >
              {'\u203A'}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
