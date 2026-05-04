import { ChangeEvent } from 'react';
import detailStyles from '../DetailsPage.module.css';
import formStyles from '../../shared/EditCourseForm.module.css';
import sharedStyles from '../../shared/EditCoursePage.module.css';
import { CoverImageMode } from '../lib/details.types';

type CoverImageFieldProps = {
  coverImage: string;
  coverUploadError: string | null;
  imageMode: CoverImageMode;
  isUploadingCover: boolean;
  onModeChange: (mode: CoverImageMode) => void;
  onUpload: (file: File) => void | Promise<void>;
  onValueChange: (value: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  uploadedFilename: string | null;
};

export default function CoverImageField({
  coverImage,
  coverUploadError,
  imageMode,
  isUploadingCover,
  onModeChange,
  onUpload,
  onValueChange,
  t,
  uploadedFilename,
}: CoverImageFieldProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    void onUpload(file);
  };

  return (
    <div className={formStyles.field}>
      <span>{t('create.coverImage')}</span>
      <div className={detailStyles.modeSwitch}>
        <button
          type="button"
          className={`${formStyles.modeButton} ${
            imageMode === 'url' ? formStyles.modeButtonActive : ''
          }`}
          onClick={() => onModeChange('url')}
        >
          {t('create.imageModeUrl')}
        </button>
        <button
          type="button"
          className={`${formStyles.modeButton} ${
            imageMode === 'upload' ? formStyles.modeButtonActive : ''
          }`}
          onClick={() => onModeChange('upload')}
        >
          {t('create.imageModeUpload')}
        </button>
      </div>

      {imageMode === 'url' ? (
        <input
          value={coverImage}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={t('create.coverImagePlaceholder')}
        />
      ) : (
        <div className={detailStyles.uploadBox}>
          <label className={detailStyles.uploadLabel}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={detailStyles.hiddenFileInput}
              onChange={handleFileChange}
            />
            <span className={detailStyles.uploadLabelText}>
              {isUploadingCover
                ? t('create.coverUploading')
                : t('create.coverUploadCta')}
            </span>
            <span className={detailStyles.uploadHelper}>
              {t('create.coverUploadHint')}
            </span>
          </label>

          {uploadedFilename ? (
            <p className={sharedStyles.helperMessage}>
              {t('create.coverUploadSuccess')}{' '}
              {uploadedFilename}
            </p>
          ) : null}

          {coverImage ? <p className={sharedStyles.helperMessage}>{coverImage}</p> : null}
        </div>
      )}

      {coverUploadError ? <p className={sharedStyles.errorMessage}>{coverUploadError}</p> : null}
    </div>
  );
}


