import { Dispatch, FormEvent, SetStateAction } from 'react';
import CourseDescriptionFields from './components/CourseDescriptionFields';
import CourseDetailsActions from './components/CourseDetailsActions';
import CourseSettingsFields from './components/CourseSettingsFields';
import CourseTitleFields from './components/CourseTitleFields';
import AuthorsField from './fields/AuthorsField';
import formStyles from '../shared/EditCourseForm.module.css';
import { CoverImageMode, EditCourseFormState } from './lib/details.types';
import { Author } from '@/services/course';

type CourseDetailsFormProps = {
  authors: Author[];
  authorsError: string | null;
  coverUploadError: string | null;
  form: EditCourseFormState;
  imageMode: CoverImageMode;
  isSubmitting: boolean;
  isUploadingCover: boolean;
  language: string;
  onCoverUpload: (file: File) => void | Promise<void>;
  onImageModeChange: (mode: CoverImageMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onToggleAuthor: (authorId: string) => void;
  selectedAuthors: Author[];
  setForm: Dispatch<SetStateAction<EditCourseFormState>>;
  submitError: string | null;
  submitMessage: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  uploadedFilename: string | null;
};

export default function CourseDetailsForm({
  authors,
  authorsError,
  coverUploadError,
  form,
  imageMode,
  isSubmitting,
  isUploadingCover,
  language,
  onCoverUpload,
  onImageModeChange,
  onSubmit,
  onToggleAuthor,
  selectedAuthors,
  setForm,
  submitError,
  submitMessage,
  t,
  uploadedFilename,
}: CourseDetailsFormProps) {
  return (
    <section className={formStyles.formCard}>
      <div className={formStyles.cardHeader}>
        <h2 className={formStyles.sectionTitle}>
          {t('edit.detailsTitle', { defaultValue: 'Course details' })}
        </h2>
        <p className={formStyles.sectionDescription}>
          {t('edit.detailsDescription', {
            defaultValue:
              'Update the course overview, metadata, cover image, and author assignment.',
          })}
        </p>
      </div>

      <form className={formStyles.form} onSubmit={onSubmit}>
        <CourseTitleFields form={form} setForm={setForm} t={t} />

        <CourseDescriptionFields form={form} setForm={setForm} t={t} />

        <CourseSettingsFields
          coverUploadError={coverUploadError}
          form={form}
          imageMode={imageMode}
          isUploadingCover={isUploadingCover}
          onCoverUpload={onCoverUpload}
          onImageModeChange={onImageModeChange}
          setForm={setForm}
          t={t}
          uploadedFilename={uploadedFilename}
        />

        <AuthorsField
          authors={authors}
          authorsError={authorsError}
          language={language}
          onToggleAuthor={onToggleAuthor}
          selectedAuthorIds={form.authorIds}
          selectedAuthors={selectedAuthors}
          t={t}
        />

        <CourseDetailsActions
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitMessage={submitMessage}
          t={t}
        />
      </form>
    </section>
  );
}





