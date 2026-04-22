'use client';
import formStyles from './AuthorForm.module.css';
import photoStyles from './AuthorPhotoField.module.css';
import pageStyles from '@/features/admin/authors/AdminAuthorsPage.module.css';
import { PhotoMode } from './types';

type AuthorPhotoFieldProps = {
  formName: string;
  photo: string;
  photoMode: PhotoMode;
  isUploadingPhoto: boolean;
  photoUploadError: string | null;
  uploadedPhotoFilename: string | null;
  onPhotoModeChange: (mode: PhotoMode) => void;
  onPhotoUpload: (file: File) => void;
  onPhotoChange: (value: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function AuthorPhotoField({
  formName,
  photo,
  photoMode,
  isUploadingPhoto,
  photoUploadError,
  uploadedPhotoFilename,
  onPhotoModeChange,
  onPhotoUpload,
  onPhotoChange,
  t,
}: AuthorPhotoFieldProps) {
  return (
    <div className={formStyles.fieldWide}>
      <div className={formStyles.fieldHeader}>
        <span className={formStyles.fieldLabel}>
          {t('authors.photo', { defaultValue: 'Photo (optional)' })}
        </span>
      </div>
      <div className={photoStyles.modeSwitch}>
        <button
          type="button"
          className={`${photoStyles.modeButton} ${photoMode === 'url' ? photoStyles.modeButtonActive : ''}`}
          onClick={() => onPhotoModeChange('url')}
        >
          {t('authors.photoModeUrl', { defaultValue: 'Use URL' })}
        </button>
        <button
          type="button"
          className={`${photoStyles.modeButton} ${photoMode === 'upload' ? photoStyles.modeButtonActive : ''}`}
          onClick={() => onPhotoModeChange('upload')}
        >
          {t('authors.photoModeUpload', { defaultValue: 'Upload image' })}
        </button>
      </div>

      {photoMode === 'url' ? (
        <input
          value={photo}
          onChange={(event) => onPhotoChange(event.target.value)}
          placeholder={t('authors.photoPlaceholder', {
            defaultValue: 'https://example.com/author-photo.jpg',
          })}
        />
      ) : (
        <div className={photoStyles.uploadBox}>
          <label className={photoStyles.uploadLabel}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={photoStyles.hiddenFileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onPhotoUpload(file);
                }
              }}
            />
            <span className={photoStyles.uploadLabelText}>
              {isUploadingPhoto
                ? t('authors.photoUploading', {
                    defaultValue: 'Uploading photo...',
                  })
                : t('authors.photoUploadCta', {
                    defaultValue: 'Choose an author photo to upload',
                  })}
            </span>
            <span className={photoStyles.uploadHelper}>
              {t('authors.photoUploadHint', {
                defaultValue: 'JPG, PNG, or WEBP up to 5 MB.',
              })}
            </span>
          </label>

          {uploadedPhotoFilename ? (
            <p className={pageStyles.helperMessage}>
              {t('authors.photoUploadSuccess', {
                defaultValue: 'Uploaded file:',
              })}{' '}
              {uploadedPhotoFilename}
            </p>
          ) : null}

          {photo ? <p className={pageStyles.helperMessage}>{photo}</p> : null}
        </div>
      )}

      {photoUploadError ? <p className={pageStyles.errorMessage}>{photoUploadError}</p> : null}

      {photo ? (
        <div className={photoStyles.photoPreview}>
          {/* This preview must support arbitrary external URLs entered by admins. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={formName || t('authors.photoPreviewAlt', { defaultValue: 'Author preview' })}
            className={photoStyles.photoPreviewImage}
            width={64}
            height={64}
            loading="lazy"
          />
          <div className={photoStyles.photoPreviewCopy}>
            <strong className={photoStyles.photoPreviewTitle}>
              {t('authors.previewTitle', { defaultValue: 'Preview' })}
            </strong>
            <span className={photoStyles.photoPreviewText}>
              {formName || t('authors.previewFallback', { defaultValue: 'Author name' })}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

