'use client';

import type { CourseCollection } from '@/services/course';
import styles from '../AdminCollectionsPage.module.css';

type CollectionsTranslate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type AdminCollectionsListProps = {
  deletingId: string | null;
  handleDelete: (collection: CourseCollection) => Promise<void>;
  handleMoveCourse: (collectionId: string, direction: 'up' | 'down') => void;
  language: string;
  loading: boolean;
  preparedCollections: CourseCollection[];
  search: string;
  setSearch: (value: string) => void;
  startEdit: (collection: CourseCollection) => void;
  t: CollectionsTranslate;
};

export default function AdminCollectionsList({
  deletingId,
  handleDelete,
  handleMoveCourse,
  language,
  loading,
  preparedCollections,
  search,
  setSearch,
  startEdit,
  t,
}: AdminCollectionsListProps) {
  const getLocalizedCollectionTitle = (collection: CourseCollection) =>
    language === 'fi'
      ? collection.titleFi || collection.titleEn
      : collection.titleEn || collection.titleFi;

  const getLocalizedCollectionDescription = (collection: CourseCollection) =>
    language === 'fi'
      ? collection.descriptionFi || collection.descriptionEn
      : collection.descriptionEn || collection.descriptionFi;

  return (
    <section className={styles.listCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>
          {t('collections.listTitle')}
        </h2>
        <p className={styles.sectionDescription}>
          {t('collections.listDescription')}
        </p>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('collections.searchPlaceholder')}
        />
      </div>

      {loading ? (
        <p className={styles.statusMessage}>
          {t('loading')}
        </p>
      ) : preparedCollections.length === 0 ? (
        <section className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>
            {t('collections.emptyTitle')}
          </h3>
          <p className={styles.emptyDescription}>
            {t('collections.emptyDescription')}
          </p>
        </section>
      ) : (
        <div className={styles.collectionList}>
          {preparedCollections.map((collection) => (
            <article key={collection.id} className={styles.collectionCard}>
              <div className={styles.collectionCopy}>
                <h3 className={styles.collectionTitle}>
                  {getLocalizedCollectionTitle(collection)}
                </h3>
                <p className={styles.collectionMeta}>
                  {getLocalizedCollectionDescription(collection) ||
                    t('collections.noDescription')}
                </p>
                <div className={styles.badgeRow}>
                  <span
                    className={`${styles.badge} ${
                      collection.isPublished
                        ? styles.badgePublished
                        : styles.badgeHidden
                    }`}
                  >
                    {collection.isPublished
                      ? t('collections.published')
                      : t('collections.hidden')}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeHidden}`}>
                    {t('collections.courseCount', { count: collection.courses.length })}
                  </span>
                </div>
              </div>

              <div className={styles.collectionActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => handleMoveCourse(collection.id, 'up')}
                  disabled={preparedCollections.indexOf(collection) === 0}
                  title={t('collections.moveUp')}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => handleMoveCourse(collection.id, 'down')}
                  disabled={preparedCollections.indexOf(collection) === preparedCollections.length - 1}
                  title={t('collections.moveDown')}
                >
                  Move down
                </button>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => startEdit(collection)}
                >
                  {t('collections.editAction')}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDelete(collection)}
                  disabled={deletingId === collection.id}
                >
                  {deletingId === collection.id
                    ? t('collections.deleting')
                    : t('collections.delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
