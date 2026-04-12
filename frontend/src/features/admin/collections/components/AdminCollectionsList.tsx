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
  loading,
  preparedCollections,
  search,
  setSearch,
  startEdit,
  t,
}: AdminCollectionsListProps) {
  return (
    <section className={styles.listCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>
          {t('collections.listTitle', { defaultValue: 'Existing collections' })}
        </h2>
        <p className={styles.sectionDescription}>
          {t('collections.listDescription', {
            defaultValue:
              'Review all custom sections, update their visibility, and keep the learner home curated the way you want.',
          })}
        </p>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('collections.searchPlaceholder', {
            defaultValue: 'Search by title or description',
          })}
        />
      </div>

      {loading ? (
        <p className={styles.statusMessage}>
          {t('loading', { defaultValue: 'Loading admin data...' })}
        </p>
      ) : preparedCollections.length === 0 ? (
        <section className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>
            {t('collections.emptyTitle', { defaultValue: 'No collections yet' })}
          </h3>
          <p className={styles.emptyDescription}>
            {t('collections.emptyDescription', {
              defaultValue:
                'Create the first curated section and it will be ready for the learner home right away.',
            })}
          </p>
        </section>
      ) : (
        <div className={styles.collectionList}>
          {preparedCollections.map((collection) => (
            <article key={collection.id} className={styles.collectionCard}>
              <div className={styles.collectionCopy}>
                <h3 className={styles.collectionTitle}>{collection.titleEn}</h3>
                <p className={styles.collectionMeta}>
                  {collection.descriptionEn ||
                    t('collections.noDescription', {
                      defaultValue: 'No description added yet.',
                    })}
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
                      ? t('collections.published', { defaultValue: 'Published' })
                      : t('collections.hidden', { defaultValue: 'Hidden' })}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeHidden}`}>
                    {t('collections.courseCount', {
                      defaultValue: '{{count}} courses',
                      count: collection.courses.length,
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.collectionActions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => startEdit(collection)}
                >
                  {t('collections.editAction', { defaultValue: 'Edit' })}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDelete(collection)}
                  disabled={deletingId === collection.id}
                >
                  {deletingId === collection.id
                    ? t('collections.deleting', { defaultValue: 'Deleting...' })
                    : t('collections.delete', { defaultValue: 'Delete' })}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
