import courseService, { Course, UpdateCourseRequest } from '@/services/course';
import type { TranslationFn } from '@/types/i18n';
import { EditCourseFormState } from './details.types';

export const mapCourseToForm = (course: Course): EditCourseFormState => ({
  titleEn: course.titleEn,
  titleFi: course.titleFi,
  descriptionEn: course.descriptionEn,
  descriptionFi: course.descriptionFi,
  level: course.level,
  status: (course.status as EditCourseFormState['status']) || 'draft',
  estimatedDuration: course.estimatedDuration ? String(course.estimatedDuration) : '',
  coverImage: course.coverImage || '',
  authorIds: course.authors.map((author) => author.id),
});

export const getLocalizedCourseTitle = (course: Course | null, language: string) => {
  if (!course) {
    return '';
  }

  return language === 'fi' ? course.titleFi : course.titleEn;
};

export const validateCourseDetailsForm = (
  form: EditCourseFormState,
  t: TranslationFn,
) => {
  if (!form.titleEn.trim() || !form.titleFi.trim()) {
    return t('create.titleRequired', {
      defaultValue: 'Both English and Finnish titles are required.',
    });
  }

  if (!form.descriptionEn.trim() || !form.descriptionFi.trim()) {
    return t('create.descriptionRequired', {
      defaultValue: 'Both English and Finnish descriptions are required.',
    });
  }

  const durationValue = form.estimatedDuration.trim();
  if (durationValue && Number(durationValue) <= 0) {
    return t('create.durationInvalid', {
      defaultValue: 'Estimated duration must be greater than zero.',
    });
  }

  return null;
};

export const buildUpdateCoursePayload = (
  form: EditCourseFormState,
): UpdateCourseRequest => {
  const durationValue = form.estimatedDuration.trim();

  return {
    titleEn: form.titleEn.trim(),
    titleFi: form.titleFi.trim(),
    descriptionEn: form.descriptionEn.trim(),
    descriptionFi: form.descriptionFi.trim(),
    level: form.level,
    status: form.status,
    estimatedDuration: durationValue ? Number(durationValue) : undefined,
    coverImage: form.coverImage.trim(),
    authorIds: form.authorIds,
  };
};

export const uploadCourseCover = (file: File) => courseService.uploadCourseCover(file);

