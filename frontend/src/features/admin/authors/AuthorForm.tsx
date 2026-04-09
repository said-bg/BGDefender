'use client';

import { FormEvent } from 'react';
import AuthorPhotoField from './AuthorPhotoField';
import formStyles from './AuthorForm.module.css';
import pageStyles from '@/features/admin/authors/AdminAuthorsPage.module.css';

type AuthorFormProps = {
  editingAuthorId: string | null;
  form: {
    name: string;
    roleEn: string;
    roleFi: string;
    biographyEn: string;
    biographyFi: string;
    photo: string;
  };
  isSubmitting: boolean;
  isUploadingPhoto: boolean;
  photoMode: 'url' | 'upload';
  photoUploadError: string | null;
  submitError: string | null;
  submitMessage: string | null;
  uploadedPhotoFilename: string | null;
  onPhotoModeChange: (mode: 'url' | 'upload') => void;
  onPhotoUpload: (file: File) => void;
  onReset: () => void;
  onSetField: (field: string, value: string) => void;
  onSubmit: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function AuthorForm({
  editingAuthorId,
  form,
  isSubmitting,
  isUploadingPhoto,
  photoMode,
  photoUploadError,
  submitError,
  submitMessage,
  uploadedPhotoFilename,
  onPhotoModeChange,
  onPhotoUpload,
  onReset,
  onSetField,
  onSubmit,
  t,
}: AuthorFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <section className={pageStyles.formCard}>
      <div className={pageStyles.cardHeader}>
        <h2 className={pageStyles.sectionTitle}>
          {editingAuthorId
            ? t('authors.editTitle', { defaultValue: 'Edit author' })
            : t('authors.createTitle', { defaultValue: 'Create author' })}
        </h2>
        <p className={pageStyles.sectionDescription}>
          {t('authors.formDescription', {
            defaultValue:
              'Keep author information ready once so you can reuse it across all courses.',
          })}
        </p>
      </div>

      <form className={formStyles.form} onSubmit={handleSubmit}>
        <label className={formStyles.field}>
          <span>{t('authors.name', { defaultValue: 'Name' })}</span>
          <input
            value={form.name}
            onChange={(event) => onSetField('name', event.target.value)}
            placeholder={t('authors.namePlaceholder', {
              defaultValue: 'Enter the author name',
            })}
          />
        </label>

        <div className={formStyles.fieldGroup}>
          <label className={formStyles.field}>
            <span>{t('authors.roleEn', { defaultValue: 'Role (English)' })}</span>
            <input
              value={form.roleEn}
              onChange={(event) => onSetField('roleEn', event.target.value)}
              placeholder={t('authors.roleEnPlaceholder', {
                defaultValue: 'Example: Security Analyst',
              })}
            />
          </label>

          <label className={formStyles.field}>
            <span>{t('authors.roleFi', { defaultValue: 'Role (Finnish)' })}</span>
            <input
              value={form.roleFi}
              onChange={(event) => onSetField('roleFi', event.target.value)}
              placeholder={t('authors.roleFiPlaceholder', {
                defaultValue: 'Example: Tietoturva-asiantuntija',
              })}
            />
          </label>
        </div>

        <AuthorPhotoField
          formName={form.name}
          photo={form.photo}
          photoMode={photoMode}
          isUploadingPhoto={isUploadingPhoto}
          photoUploadError={photoUploadError}
          uploadedPhotoFilename={uploadedPhotoFilename}
          onPhotoModeChange={onPhotoModeChange}
          onPhotoUpload={onPhotoUpload}
          onPhotoChange={(value) => onSetField('photo', value)}
          t={t}
        />

        <label className={formStyles.fieldWide}>
          <span>{t('authors.biographyEn', { defaultValue: 'Biography (English)' })}</span>
          <textarea
            rows={4}
            value={form.biographyEn}
            onChange={(event) => onSetField('biographyEn', event.target.value)}
            placeholder={t('authors.biographyEnPlaceholder', {
              defaultValue: 'Write a short English biography for this author.',
            })}
          />
        </label>

        <label className={formStyles.fieldWide}>
          <span>{t('authors.biographyFi', { defaultValue: 'Biography (Finnish)' })}</span>
          <textarea
            rows={4}
            value={form.biographyFi}
            onChange={(event) => onSetField('biographyFi', event.target.value)}
            placeholder={t('authors.biographyFiPlaceholder', {
              defaultValue: 'Write a short Finnish biography for this author.',
            })}
          />
        </label>

        {submitMessage ? <p className={pageStyles.successMessage}>{submitMessage}</p> : null}
        {submitError ? <p className={pageStyles.errorMessage}>{submitError}</p> : null}

        <div className={formStyles.actions}>
          <button type="button" className={formStyles.secondaryAction} onClick={onReset}>
            {editingAuthorId
              ? t('authors.cancelEdit', { defaultValue: 'Cancel edit' })
              : t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button type="submit" className={formStyles.primaryAction} disabled={isSubmitting}>
            {isSubmitting
              ? editingAuthorId
                ? t('authors.saving', { defaultValue: 'Saving author...' })
                : t('authors.creating', { defaultValue: 'Creating author...' })
              : editingAuthorId
                ? t('authors.save', { defaultValue: 'Save author' })
                : t('authors.create', { defaultValue: 'Create author' })}
          </button>
        </div>
      </form>
    </section>
  );
}
