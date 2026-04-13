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
  coverImage: string;
  orderIndex: string;
  isPublished: boolean;
  courseIds: string[];
};

type CollectionImageMode = 'url' | 'upload';

type AdminCollectionsFormProps = {
  availableCourses: Course[];
  coverUploadError: string | null;
  editingCollectionId: string | null;
  form: CollectionFormState;
  handleCoverUpload: (file: File) => void;
  handleImageModeChange: (mode: CollectionImageMode) => void;
  handleMoveCourse: (courseId: string, direction: 'up' | 'down') => void;
  handleSubmit: () => Promise<void>;
  handleToggleCourse: (courseId: string) => void;
  imageMode: CollectionImageMode;
  isUploadingCover: boolean;
  language: string;
  resetForm: () => void;
  selectedCourses: Course[];
  submitting: boolean;
  t: CollectionsTranslate;
  uploadedFilename: string | null;
  updateForm: <K extends keyof CollectionFormState>(
    key: K,
    value: CollectionFormState[K],
  ) => void;
};

export default function AdminCollectionsForm({
  availableCourses,
  coverUploadError,
  editingCollectionId,
  form,
  handleCoverUpload,
  handleImageModeChange,
  handleMoveCourse,
  handleSubmit,
  handleToggleCourse,
  imageMode,
  isUploadingCover,
  language,
  resetForm,
  selectedCourses,
  submitting,
  t,
  uploadedFilename,
  updateForm,
}: AdminCollectionsFormProps) {
  const getLocalizedCourseTitle = (course: Course) =>
    language === 'fi' ? course.titleFi || course.titleEn : course.titleEn || course.titleFi;

  const getLocalizedLevel = (course: Course) =>
    course.level === 'premium'
      ? t('levels.premium')
      : t('levels.free');

  const publishedLabel = t('collections.published');

  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>
          {editingCollectionId
            ? t('collections.editTitle')
            : t('collections.createTitle')}
        </h2>
        <p className={styles.sectionDescription}>
          {t('collections.formDescription')}
        </p>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="collection-title-en">
            {t('collections.titleEn')}
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
            {t('collections.titleFi')}
          </label>
          <input
            id="collection-title-fi"
            className={styles.input}
            value={form.titleFi}
            onChange={(event) => updateForm('titleFi', event.target.value)}
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <label className={styles.fieldLabel}>
            {t('collections.coverImage')}
          </label>
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={`${styles.modeButton} ${imageMode === 'url' ? styles.modeButtonActive : ''}`}
              onClick={() => handleImageModeChange('url')}
            >
              {t('collections.imageModeUrl')}
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${imageMode === 'upload' ? styles.modeButtonActive : ''}`}
              onClick={() => handleImageModeChange('upload')}
            >
              {t('collections.imageModeUpload')}
            </button>
          </div>

          {imageMode === 'url' ? (
            <input
              className={styles.input}
              value={form.coverImage}
              onChange={(event) => updateForm('coverImage', event.target.value)}
              placeholder={t('collections.coverImagePlaceholder')}
            />
          ) : (
            <div className={styles.uploadBox}>
              <label className={styles.uploadLabel}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={styles.hiddenFileInput}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleCoverUpload(file);
                    }
                  }}
                />
                <span className={styles.uploadLabelText}>
                  {isUploadingCover
                    ? t('collections.coverUploading')
                    : t('collections.coverUploadCta')}
                </span>
                <span className={styles.uploadHelper}>
                  {t('collections.coverUploadHint')}
                </span>
              </label>

              {uploadedFilename ? (
                <p className={styles.statusMessage}>
                  {t('collections.coverUploadSuccess')}{' '}
                  {uploadedFilename}
                </p>
              ) : null}

              {form.coverImage ? <p className={styles.statusMessage}>{form.coverImage}</p> : null}
            </div>
          )}

          {coverUploadError ? <p className={styles.errorMessage}>{coverUploadError}</p> : null}
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <label className={styles.fieldLabel} htmlFor="collection-description-en">
            {t('collections.descriptionEn')}
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
            {t('collections.descriptionFi')}
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
            {t('collections.order')}
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
            {t('collections.visibility')}
          </span>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateForm('isPublished', event.target.checked)}
            />
            <span>
              {t('collections.visibilityPublished')}
            </span>
          </label>
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
          <div className={styles.pickerLayout}>
            <div className={styles.coursePickerCard}>
              <h3 className={styles.pickerTitle}>
                {t('collections.availableCourses')}
              </h3>
              <p className={styles.pickerDescription}>
                {t('collections.availableCoursesHint')}
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
                      <p className={styles.courseOptionTitle}>
                        {getLocalizedCourseTitle(course)}
                      </p>
                      <p className={styles.courseOptionMeta}>
                        {getLocalizedLevel(course)} - {publishedLabel}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.coursePickerCard}>
              <h3 className={styles.pickerTitle}>
                {t('collections.selectedCourses')}
              </h3>
              <p className={styles.pickerDescription}>
                {t('collections.selectedCoursesHint')}
              </p>

              {selectedCourses.length === 0 ? (
                <div className={styles.emptyState}>
                  <h4 className={styles.emptyTitle}>
                    {t('collections.noSelectedCourses')}
                  </h4>
                  <p className={styles.emptyDescription}>
                    {t('collections.noSelectedCoursesHint')}
                  </p>
                </div>
              ) : (
                <div className={styles.selectedCourseList}>
                  {selectedCourses.map((course, index) => (
                    <article key={course.id} className={styles.selectedCourseCard}>
                      <div className={styles.selectedCourseCopy}>
                        <p className={styles.selectedCourseTitle}>
                          {getLocalizedCourseTitle(course)}
                        </p>
                        <p className={styles.selectedCourseMeta}>
                          {t('collections.selectedPosition', { position: index + 1 })}
                        </p>
                      </div>
                      <div className={styles.selectedCourseActions}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => handleMoveCourse(course.id, 'up')}
                          disabled={index === 0}
                        >
                          {t('collections.moveUp')}
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => handleMoveCourse(course.id, 'down')}
                          disabled={index === selectedCourses.length - 1}
                        >
                          {t('collections.moveDown')}
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleToggleCourse(course.id)}
                        >
                          {t('collections.removeCourse')}
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
              ? t('collections.saving')
              : editingCollectionId
                ? t('collections.save')
                : t('collections.create')}
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={resetForm}
          >
            {editingCollectionId
              ? t('collections.cancelEdit')
              : t('collections.reset')}
          </button>
        </div>
      </div>
    </section>
  );
}
