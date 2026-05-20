'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import CourseDetailsForm from '@/features/admin/courses/edit-course/details/CourseDetailsForm';
import { useEditCourseDetails } from '@/features/admin/courses/edit-course/details/hooks/useEditCourseDetails';
import { localizePathname, normalizeLocale } from '@/lib/locale';
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
  const activeLocale = normalizeLocale(i18n.language);
  const backToCoursesHref = localizePathname('/admin/courses', activeLocale);
  const manageAuthorsHref = localizePathname('/admin/authors', activeLocale);
  const details = useEditCourseDetails({
    courseId,
    language: i18n.language,
    onSuccessRedirect: () => router.push(backToCoursesHref),
    t,
  });

  if (details.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (details.loadError || !courseId) {
    return (
      <EditCourseErrorState
        message={details.loadError || t('edit.missingCourseId')}
      />
    );
  }

  return (
    <EditCourseShell
      courseId={courseId}
      section="details"
      course={details.course}
      title={t('edit.title')}
      subtitle={t('edit.subtitle')}
      courseTitle={details.localizedCourseTitle}
    >
      <CourseDetailsForm
        authors={details.authors}
        authorsError={details.authorsError}
        cancelHref={backToCoursesHref}
        coverUploadError={details.coverUploadError}
        form={details.form}
        imageMode={details.imageMode}
        isSubmitting={details.isSubmitting}
        isUploadingCover={details.isUploadingCover}
        language={i18n.language}
        manageAuthorsHref={manageAuthorsHref}
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

