'use client';

import type { Course } from '@/services/course';
import styles from '../AdminCollectionsPage.module.css';

type CollectionsTranslate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type CollectionFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: string;
  isPublished: boolean;
  courseIds: string[];
};

type AdminCollectionsFormProps = {
  availableCourses: Course[];
  editingCollectionId: string | null;
  form: CollectionFormState;
  handleMoveCourse: (courseId: string, direction: 'up' | 'down') => void;
  handleSubmit: () => Promise<void>;
  handleToggleCourse: (courseId: string) => void;
  resetForm: () => void;
  selectedCourses: Course[];
  submitting: boolean;
  t: CollectionsTranslate;
  updateForm: <K extends keyof CollectionFormState>(
    key: K,
    value: CollectionFormState[K],
  ) => void;
};

export default function AdminCollectionsForm({
  availableCourses,
  editingCollectionId,
  form,
  handleMoveCourse,
  handleSubmit,
  handleToggleCourse,
  resetForm,
  selectedCourses,
  submitting,
  t,
  updateForm,
}: AdminCollectionsFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>
          {editingCollectionId
            ? t('collections.editTitle', { defaultValue: 'Edit collection' })
            : t('collections.createTitle', { defaultValue: 'Create collection' })}
        </h2>
        <p className={styles.sectionDescription}>
          {t('collections.formDescription', {
            defaultValue:
              'Build custom course groups for the learner home, then control their title, order, and visibility from one place.',
          })}
        </p>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="collection-title-en">
            {t('collections.titleEn', { defaultValue: 'Title (English)' })}
          </label>
          <input
            id="collection-title-en"
            className={styles.input}
            value={form.titleEn}
            onChange={(event) => updateForm('titleEn', event.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="collection-title-fi">
            {t('collections.titleFi', { defaultValue: 'Title (Finnish)' })}
          </label>
          <input
            id="collection-title-fi"
            className={styles.input}
            value={form.titleFi}
            onChange={(event) => updateForm('titleFi', event.target.value)}
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <label className={styles.fieldLabel} htmlFor="collection-description-en">
            {t('collections.descriptionEn', {
              defaultValue: 'Description (English)',
            })}
          </label>
          <textarea
            id="collection-description-en"
            className={styles.textarea}
            value={form.descriptionEn}
            onChange={(event) => updateForm('descriptionEn', event.target.value)}
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <label className={styles.fieldLabel} htmlFor="collection-description-fi">
            {t('collections.descriptionFi', {
              defaultValue: 'Description (Finnish)',
            })}
          </label>
          <textarea
            id="collection-description-fi"
            className={styles.textarea}
            value={form.descriptionFi}
            onChange={(event) => updateForm('descriptionFi', event.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="collection-order">
            {t('collections.order', { defaultValue: 'Display order' })}
          </label>
          <input
            id="collection-order"
            className={styles.input}
            type="number"
            min="1"
            value={form.orderIndex}
            onChange={(event) => updateForm('orderIndex', event.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            {t('collections.visibility', { defaultValue: 'Visibility' })}
          </span>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateForm('isPublished', event.target.checked)}
            />
            <span>
              {t('collections.visibilityPublished', {
                defaultValue: 'Show this collection on the learner home',
              })}
            </span>
          </label>
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <div className={styles.pickerLayout}>
            <div className={styles.coursePickerCard}>
              <h3 className={styles.pickerTitle}>
                {t('collections.availableCourses', {
                  defaultValue: 'Available published courses',
                })}
              </h3>
              <p className={styles.pickerDescription}>
                {t('collections.availableCoursesHint', {
                  defaultValue:
                    'Pick the published courses you want to feature inside this collection.',
                })}
              </p>

              <div className={styles.courseOptionList}>
                {availableCourses.map((course) => (
                  <label key={course.id} className={styles.courseOption}>
                    <input
                      type="checkbox"
                      checked={form.courseIds.includes(course.id)}
                      onChange={() => handleToggleCourse(course.id)}
                    />
                    <div className={styles.courseOptionCopy}>
                      <p className={styles.courseOptionTitle}>{course.titleEn}</p>
                      <p className={styles.courseOptionMeta}>
                        {course.level} - {course.status}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.coursePickerCard}>
              <h3 className={styles.pickerTitle}>
                {t('collections.selectedCourses', {
                  defaultValue: 'Selected courses',
                })}
              </h3>
              <p className={styles.pickerDescription}>
                {t('collections.selectedCoursesHint', {
                  defaultValue:
                    'Adjust the order here. The learner home will show the courses in this same sequence.',
                })}
              </p>

              {selectedCourses.length === 0 ? (
                <div className={styles.emptyState}>
                  <h4 className={styles.emptyTitle}>
                    {t('collections.noSelectedCourses', {
                      defaultValue: 'No courses selected yet',
                    })}
                  </h4>
                  <p className={styles.emptyDescription}>
                    {t('collections.noSelectedCoursesHint', {
                      defaultValue:
                        'Choose at least one published course from the left panel.',
                    })}
                  </p>
                </div>
              ) : (
                <div className={styles.selectedCourseList}>
                  {selectedCourses.map((course, index) => (
                    <article key={course.id} className={styles.selectedCourseCard}>
                      <div className={styles.selectedCourseCopy}>
                        <p className={styles.selectedCourseTitle}>{course.titleEn}</p>
                        <p className={styles.selectedCourseMeta}>
                          {t('collections.selectedPosition', {
                            defaultValue: 'Position {{position}}',
                            position: index + 1,
                          })}
                        </p>
                      </div>
                      <div className={styles.selectedCourseActions}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => handleMoveCourse(course.id, 'up')}
                          disabled={index === 0}
                        >
                          {t('collections.moveUp', { defaultValue: 'Move up' })}
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => handleMoveCourse(course.id, 'down')}
                          disabled={index === selectedCourses.length - 1}
                        >
                          {t('collections.moveDown', { defaultValue: 'Move down' })}
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleToggleCourse(course.id)}
                        >
                          {t('collections.removeCourse', { defaultValue: 'Remove' })}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting
              ? t('collections.saving', {
                  defaultValue: 'Saving collection...',
                })
              : editingCollectionId
                ? t('collections.save', { defaultValue: 'Save collection' })
                : t('collections.create', { defaultValue: 'Create collection' })}
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={resetForm}
          >
            {editingCollectionId
              ? t('collections.cancelEdit', { defaultValue: 'Cancel edit' })
              : t('collections.reset', { defaultValue: 'Reset form' })}
          </button>
        </div>
      </div>
    </section>
  );
}
