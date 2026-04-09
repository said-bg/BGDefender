'use client';

import Link from 'next/link';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AuthorsField from './AuthorsField';
import CourseSettingsFields from './CourseSettingsFields';
import CourseTextFields from './CourseTextFields';
import CreateCourseActions from './CreateCourseActions';
import formStyles from './CreateCoursePage.module.css';
import shellStyles from './CreateCourseShell.module.css';
import useCreateCourse from './useCreateCourse';

export default function CreateCourseForm() {
  const { t, i18n } = useTranslation('admin');
  const {
    authors,
    authorsError,
    coverUploadError,
    form,
    imageMode,
    isSubmitting,
    isUploadingCover,
    loadingAuthors,
    selectedAuthors,
    submitError,
    submitMessage,
    uploadedFilename,
    handleCoverUpload,
    handleSubmit,
    setField,
    setImageMode,
    toggleAuthor,
  } = useCreateCourse();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  return (
    <div className={shellStyles.page}>
      <section className={shellStyles.hero}>
        <div className={shellStyles.heroCopy}>
          <Link href="/admin/courses" className={shellStyles.backLink}>
            {t('create.backToCourses', { defaultValue: 'Back to course management' })}
          </Link>
          <p className={shellStyles.eyebrow}>
            {t('create.eyebrow', { defaultValue: 'Create course' })}
          </p>
          <h1 className={shellStyles.title}>
            {t('create.title', { defaultValue: 'Create a new course' })}
          </h1>
          <p className={shellStyles.subtitle}>
            {t('create.subtitle', {
              defaultValue:
                'Set up the course shell first. We will handle chapters, subchapters, and rich content right after this step.',
            })}
          </p>
        </div>
      </section>

      <section className={formStyles.formCard}>
        <div className={formStyles.cardHeader}>
          <h2 className={formStyles.sectionTitle}>
            {t('create.detailsTitle', { defaultValue: 'Course details' })}
          </h2>
          <p className={formStyles.sectionDescription}>
            {t('create.detailsDescription', {
              defaultValue:
                'This information feeds the course overview and the main catalog cards.',
            })}
          </p>
        </div>

        <form className={formStyles.form} onSubmit={onSubmit}>
          <CourseTextFields form={form} setField={setField} t={t} />

          <CourseSettingsFields
            coverUploadError={coverUploadError}
            form={form}
            imageMode={imageMode}
            isUploadingCover={isUploadingCover}
            setField={setField}
            setImageMode={setImageMode}
            t={t}
            uploadedFilename={uploadedFilename}
            onCoverUpload={(file) => void handleCoverUpload(file)}
          />

          <AuthorsField
            authors={authors}
            authorsError={authorsError}
            authorIds={form.authorIds}
            i18nLanguage={i18n.language}
            loadingAuthors={loadingAuthors}
            selectedAuthors={selectedAuthors}
            onToggleAuthor={toggleAuthor}
            t={t}
          />

          <CreateCourseActions
            isSubmitting={isSubmitting}
            submitError={submitError}
            submitMessage={submitMessage}
            t={t}
          />
        </form>
      </section>
    </div>
  );
}
