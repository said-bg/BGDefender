'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/api';
import AuthorForm from './AuthorForm';
import AuthorLibrary from './AuthorLibrary';
import styles from './AdminAuthorsPage.module.css';
import useAdminAuthors from './useAdminAuthors';

export default function AdminAuthorsPage() {
  return (
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <AdminAuthorsPageContent />
    </ProtectedRoute>
  );
}

function AdminAuthorsPageContent() {
  const { i18n, t } = useTranslation('admin');
  const {
    authors,
    deletingAuthorId,
    editingAuthorId,
    form,
    handleDelete,
    handlePhotoUpload,
    handleSubmit,
    hydrateFormFromAuthor,
    isSubmitting,
    isUploadingPhoto,
    loadError,
    loading,
    photoMode,
    photoUploadError,
    resetForm,
    setField,
    setPhotoMode,
    submitError,
    submitMessage,
    uploadedPhotoFilename,
  } = useAdminAuthors();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link href="/admin" className={styles.backLink}>
            {t('backToOverview', { defaultValue: 'Back to dashboard' })}
          </Link>
          <p className={styles.eyebrow}>
            {t('authors.eyebrow', { defaultValue: 'Author library' })}
          </p>
          <h1 className={styles.title}>
            {t('authors.title', { defaultValue: 'Manage authors' })}
          </h1>
          <p className={styles.subtitle}>
            {t('authors.subtitle', {
              defaultValue:
                'Create and maintain reusable author profiles so you can attach them to any course whenever you need.',
            })}
          </p>
        </div>
      </section>

      <div className={styles.layout}>
        <AuthorForm
          editingAuthorId={editingAuthorId}
          form={form}
          isSubmitting={isSubmitting}
          isUploadingPhoto={isUploadingPhoto}
          photoMode={photoMode}
          photoUploadError={photoUploadError}
          submitError={submitError}
          submitMessage={submitMessage}
          uploadedPhotoFilename={uploadedPhotoFilename}
          onPhotoModeChange={setPhotoMode}
          onPhotoUpload={(file) => void handlePhotoUpload(file)}
          onReset={() => resetForm()}
          onSetField={(field, value) => setField(field as keyof typeof form, value)}
          onSubmit={handleSubmit}
          t={t}
        />

        <AuthorLibrary
          authors={authors}
          deletingAuthorId={deletingAuthorId}
          language={i18n.language}
          loadError={loadError}
          loading={loading}
          onDelete={(author) => void handleDelete(author)}
          onEdit={hydrateFormFromAuthor}
          t={t}
        />
      </div>
    </div>
  );
}
