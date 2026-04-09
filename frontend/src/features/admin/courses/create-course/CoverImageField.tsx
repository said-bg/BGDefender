'use client';

import detailStyles from './CreateCourseDetails.module.css';
import pageStyles from './CreateCoursePage.module.css';
import { ImageMode } from './types';

type CoverImageFieldProps = {
  coverImage: string;
  coverUploadError: string | null;
  imageMode: ImageMode;
  isUploadingCover: boolean;
  uploadedFilename: string | null;
  onCoverImageChange: (value: string) => void;
  onCoverUpload: (file: File) => void;
  onImageModeChange: (mode: ImageMode) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CoverImageField({
  coverImage,
  coverUploadError,
  imageMode,
  isUploadingCover,
  uploadedFilename,
  onCoverImageChange,
  onCoverUpload,
  onImageModeChange,
  t,
}: CoverImageFieldProps) {
  return (
    <div className={pageStyles.field}>
      <span>{t('create.coverImage', { defaultValue: 'Cover image' })}</span>
      <div className={detailStyles.modeSwitch}>
        <button
          type="button"
          className={`${detailStyles.modeButton} ${imageMode === 'url' ? detailStyles.modeButtonActive : ''}`}
          onClick={() => onImageModeChange('url')}
        >
          {t('create.imageModeUrl', { defaultValue: 'Use URL' })}
        </button>
        <button
          type="button"
          className={`${detailStyles.modeButton} ${imageMode === 'upload' ? detailStyles.modeButtonActive : ''}`}
          onClick={() => onImageModeChange('upload')}
        >
          {t('create.imageModeUpload', { defaultValue: 'Upload image' })}
        </button>
      </div>

      {imageMode === 'url' ? (
        <input
          value={coverImage}
          onChange={(event) => onCoverImageChange(event.target.value)}
          placeholder={t('create.coverImagePlaceholder', {
            defaultValue: 'https://example.com/course-cover.jpg',
          })}
        />
      ) : (
        <div className={detailStyles.uploadBox}>
          <label className={detailStyles.uploadLabel}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={detailStyles.hiddenFileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onCoverUpload(file);
                }
              }}
            />
            <span className={detailStyles.uploadLabelText}>
              {isUploadingCover
                ? t('create.coverUploading', {
                    defaultValue: 'Uploading image...',
                  })
                : t('create.coverUploadCta', {
                    defaultValue: 'Choose an image to upload',
                  })}
            </span>
            <span className={detailStyles.uploadHelper}>
              {t('create.coverUploadHint', {
                defaultValue: 'JPG, PNG, WEBP, or GIF up to 5 MB.',
              })}
            </span>
          </label>

          {uploadedFilename ? (
            <p className={pageStyles.helperMessage}>
              {t('create.coverUploadSuccess', {
                defaultValue: 'Uploaded file:',
              })}{' '}
              {uploadedFilename}
            </p>
          ) : null}

          {coverImage ? <p className={pageStyles.helperMessage}>{coverImage}</p> : null}
        </div>
      )}

      {coverUploadError ? <p className={pageStyles.errorMessage}>{coverUploadError}</p> : null}
    </div>
  );
}
