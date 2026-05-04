import CoverImageField from './CoverImageField';
import styles from './CreateCoursePage.module.css';
import type { CreateCourseFormState, ImageMode, SetCreateCourseField } from './types';

interface CourseSettingsFieldsProps {
  coverUploadError: string | null;
  form: CreateCourseFormState;
  imageMode: ImageMode;
  isUploadingCover: boolean;
  setField: SetCreateCourseField;
  setImageMode: (mode: ImageMode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  uploadedFilename: string | null;
  onCoverUpload: (file: File) => void;
}

export default function CourseSettingsFields({
  coverUploadError,
  form,
  imageMode,
  isUploadingCover,
  setField,
  setImageMode,
  t,
  uploadedFilename,
  onCoverUpload,
}: CourseSettingsFieldsProps) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.field}>
          <span>{t('create.level')}</span>
          <select
            value={form.level}
            onChange={(event) => setField('level', event.target.value as 'free' | 'premium')}
          >
            <option value="free">{t('levels.free')}</option>
            <option value="premium">{t('levels.premium')}</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>{t('create.status')}</span>
          <select
            value={form.status}
            onChange={(event) =>
              setField('status', event.target.value as 'draft' | 'published')
            }
          >
            <option value="draft">{t('status.draft')}</option>
            <option value="published">{t('status.published')}</option>
          </select>
        </label>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.field}>
          <span>{t('create.duration')}</span>
          <p className={styles.helperText}>
            {t('create.durationDescription')}
          </p>
          <input
            type="number"
            min="1"
            value={form.estimatedDuration}
            onChange={(event) => setField('estimatedDuration', event.target.value)}
            placeholder={t('create.durationPlaceholder')}
          />
        </label>

        <CoverImageField
          coverImage={form.coverImage}
          coverUploadError={coverUploadError}
          imageMode={imageMode}
          isUploadingCover={isUploadingCover}
          uploadedFilename={uploadedFilename}
          onCoverImageChange={(value) => setField('coverImage', value)}
          onCoverUpload={onCoverUpload}
          onImageModeChange={setImageMode}
          t={t}
        />
      </div>
    </>
  );
}
