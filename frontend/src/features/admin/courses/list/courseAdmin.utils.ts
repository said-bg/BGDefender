import { AdminCourseSummary, Course } from '@/services/course';
import type { TranslationFn } from '@/types/i18n';

export type LocalizedAdminCourse = Course & {
  title: string;
  description: string;
  chapterCount: number;
  lessonCount: number;
  authorNames: string;
};

const statusSummaryKeys: Record<'draft' | 'published' | 'archived', keyof AdminCourseSummary> = {
  draft: 'draftCourses',
  published: 'publishedCourses',
  archived: 'archivedCourses',
};

export const toLocalizedCourse = (course: Course, language: string): LocalizedAdminCourse => {
  const chapterCount = course.chapters.length;
  const lessonCount = course.chapters.reduce(
    (total, chapter) => total + chapter.subChapters.length,
    0,
  );

  return {
    ...course,
    title: language === 'fi' ? course.titleFi : course.titleEn,
    description: language === 'fi' ? course.descriptionFi : course.descriptionEn,
    chapterCount,
    lessonCount,
    authorNames: course.authors.map((author) => author.name).join(', '),
  };
};

export const updateSummaryForStatusChange = (
  summary: AdminCourseSummary | null,
  previousStatus: 'draft' | 'published' | 'archived',
  nextStatus: 'draft' | 'published' | 'archived',
) => {
  if (!summary || previousStatus === nextStatus) {
    return summary;
  }

  const previousKey = statusSummaryKeys[previousStatus];
  const nextKey = statusSummaryKeys[nextStatus];

  return {
    ...summary,
    [previousKey]: Math.max(0, summary[previousKey] - 1),
    [nextKey]: summary[nextKey] + 1,
  };
};

export const updateSummaryForDelete = (
  summary: AdminCourseSummary | null,
  deletedStatus: 'draft' | 'published' | 'archived',
) => {
  if (!summary) {
    return summary;
  }

  const deletedKey = statusSummaryKeys[deletedStatus];

  return {
    ...summary,
    totalCourses: Math.max(0, summary.totalCourses - 1),
    [deletedKey]: Math.max(0, summary[deletedKey] - 1),
  };
};

export const formatAdminCourseLevel = (level: Course['level'], t: TranslationFn) =>
  level === 'premium' ? t('levels.premium') : t('levels.free');

export const formatAdminCourseStatus = (status: Course['status'], t: TranslationFn) => {
  switch (status) {
    case 'published':
      return t('status.published');
    case 'archived':
      return t('status.archived');
    default:
      return t('status.draft');
  }
};

export const formatAdminUpdatedAt = (updatedAt: string, language: string) =>
  new Date(updatedAt).toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

