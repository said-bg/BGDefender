'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import CourseDetailsForm from '@/features/admin/courses/edit-course/details/CourseDetailsForm';
import { useEditCourseDetails } from '@/features/admin/courses/edit-course/details/useEditCourseDetails';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
  useEditCourseId,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';

export default function EditCoursePage() {
  return (
    <EditCourseProtected>
      <EditCourseDetailsContent />
    </EditCourseProtected>
  );
}

function EditCourseDetailsContent() {
  const { t, i18n } = useTranslation('admin');
  const router = useRouter();
  const courseId = useEditCourseId();
  const details = useEditCourseDetails({
    courseId,
    language: i18n.language,
    onSuccessRedirect: () => router.push('/admin/courses'),
    t,
  });

  if (details.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (details.loadError || !courseId) {
    return (
      <EditCourseErrorState
        message={
          details.loadError ||
          t('edit.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={courseId}
      section="details"
      title={t('edit.title', { defaultValue: 'Edit course' })}
      subtitle={t('edit.subtitle', {
        defaultValue:
          'Update the course shell before moving into chapters, subchapters, and content editing.',
      })}
      courseTitle={details.localizedCourseTitle}
    >
      <CourseDetailsForm
        authors={details.authors}
        authorsError={details.authorsError}
        coverUploadError={details.coverUploadError}
        form={details.form}
        imageMode={details.imageMode}
        isSubmitting={details.isSubmitting}
        isUploadingCover={details.isUploadingCover}
        language={i18n.language}
        onCoverUpload={details.handleCoverUpload}
        onImageModeChange={details.setImageMode}
        onSubmit={details.handleSubmit}
        onToggleAuthor={details.toggleAuthor}
        selectedAuthors={details.selectedAuthors}
        setForm={details.setForm}
        submitError={details.submitError}
        submitMessage={details.submitMessage}
        t={t}
        uploadedFilename={details.uploadedFilename}
      />
    </EditCourseShell>
  );
}

