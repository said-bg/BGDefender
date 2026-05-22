'use client';

import Link from 'next/link';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { localizePathname, normalizeLocale } from '@/lib/locale';
import AuthorsField from './AuthorsField';
import CourseSettingsFields from './CourseSettingsFields';
import CourseTextFields from './CourseTextFields';
import CreateCourseActions from './CreateCourseActions';
import formStyles from './CreateCoursePage.module.css';
import shellStyles from './CreateCourseShell.module.css';
import useCreateCourse from './useCreateCourse';

export default function CreateCourseForm() {
  const { t, i18n } = useTranslation('admin');
  const activeLocale = normalizeLocale(i18n.language);
  const backToCoursesHref = localizePathname('/admin/courses', activeLocale);
  const manageAuthorsHref = localizePathname('/admin/authors', activeLocale);
  const {
    authors,
    authorsError,
    coverUploadError,
    form,
    imageMode,
    isSubmitting,
    isUploadingCover,
    loadingAuthors,
    programDirectors,
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
          <Link href={backToCoursesHref} className={shellStyles.backLink}>
            {t('create.backToCourses')}
          </Link>
          <p className={shellStyles.eyebrow}>
            {t('create.eyebrow')}
          </p>
          <h1 className={shellStyles.title}>
            {t('create.title')}
          </h1>
          <p className={shellStyles.subtitle}>
            {t('create.subtitle')}
          </p>
        </div>
      </section>

      <section className={formStyles.formCard}>
        <div className={formStyles.cardHeader}>
          <h2 className={formStyles.sectionTitle}>
            {t('create.detailsTitle')}
          </h2>
          <p className={formStyles.sectionDescription}>
            {t('create.detailsDescription')}
          </p>
        </div>

        <form className={formStyles.form} onSubmit={onSubmit}>
          <CourseTextFields form={form} setField={setField} t={t} />

          <CourseSettingsFields
            coverUploadError={coverUploadError}
          form={form}
          imageMode={imageMode}
          isUploadingCover={isUploadingCover}
          programDirectors={programDirectors}
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
            manageAuthorsHref={manageAuthorsHref}
            selectedAuthors={selectedAuthors}
            onToggleAuthor={toggleAuthor}
            t={t}
          />

          <CreateCourseActions
            cancelHref={backToCoursesHref}
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
