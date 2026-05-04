import { Dispatch, SetStateAction } from 'react';
import type { TranslationFn } from '@/types/i18n';
import CoverImageField from '../fields/CoverImageField';
import formStyles from '../../shared/EditCourseForm.module.css';
import sharedStyles from '../../shared/EditCoursePage.module.css';
import { CoverImageMode, EditCourseFormState } from '../lib/details.types';

type CourseSettingsFieldsProps = {
  coverUploadError: string | null;
  form: EditCourseFormState;
  imageMode: CoverImageMode;
  isUploadingCover: boolean;
  onCoverUpload: (file: File) => void | Promise<void>;
  onImageModeChange: (mode: CoverImageMode) => void;
  setForm: Dispatch<SetStateAction<EditCourseFormState>>;
  t: TranslationFn;
  uploadedFilename: string | null;
};

export default function CourseSettingsFields({
  coverUploadError,
  form,
  imageMode,
  isUploadingCover,
  onCoverUpload,
  onImageModeChange,
  setForm,
  t,
  uploadedFilename,
}: CourseSettingsFieldsProps) {
  return (
    <>
      <div className={formStyles.fieldGroup}>
        <label className={formStyles.field}>
          <span>{t('create.level')}</span>
          <select
            value={form.level}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                level: event.target.value as EditCourseFormState['level'],
              }))
            }
          >
            <option value="free">{t('levels.free')}</option>
            <option value="premium">{t('levels.premium')}</option>
          </select>
        </label>

        <label className={formStyles.field}>
          <span>{t('create.status')}</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                status: event.target.value as EditCourseFormState['status'],
              }))
            }
          >
            <option value="draft">{t('status.draft')}</option>
            <option value="published">{t('status.published')}</option>
          </select>
        </label>
      </div>

      <div className={formStyles.fieldGroup}>
        <label className={formStyles.field}>
          <span>{t('create.duration')}</span>
          <p className={sharedStyles.helperText}>
            {t('create.durationDescription')}
          </p>
          <input
            type="number"
            min="1"
            value={form.estimatedDuration}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                estimatedDuration: event.target.value,
              }))
            }
            placeholder={t('create.durationPlaceholder')}
          />
        </label>

        <CoverImageField
          coverImage={form.coverImage}
          coverUploadError={coverUploadError}
          imageMode={imageMode}
          isUploadingCover={isUploadingCover}
          onModeChange={onImageModeChange}
          onUpload={onCoverUpload}
          onValueChange={(value) =>
            setForm((previous) => ({ ...previous, coverImage: value }))
          }
          t={t}
          uploadedFilename={uploadedFilename}
        />
      </div>
    </>
  );
}
