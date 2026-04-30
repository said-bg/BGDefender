import type { Course } from '@/services/course';
import type { CourseProgress, ProgressViewType } from '@/services/progress';
import type { NavigationItem, ViewState } from '../courseDetail.types';

export type CourseNavigationOptions = {
  includeUnpublishedAssessments?: boolean;
};

type SearchParamsLike = {
  get: (name: string) => string | null;
} | null | undefined;

export const hasVisibleTrainingQuiz = (
  chapter: Course['chapters'][number],
  options: CourseNavigationOptions = {},
) =>
  Boolean(
    chapter.trainingQuiz &&
      (options.includeUnpublishedAssessments || chapter.trainingQuiz.isPublished),
  );

export const getVisibleFinalTest = (
  course: Course,
  options: CourseNavigationOptions = {},
) =>
  course.finalTests?.find(
    (finalTest) => options.includeUnpublishedAssessments || finalTest.isPublished,
  ) ?? null;

export const getViewKey = (view: ViewState): string => {
  if (view.type === 'overview') {
    return 'overview';
  }

  if (view.type === 'final-test') {
    return 'final-test';
  }

  if (view.type === 'chapter') {
    return `chapter:${view.chapterId}`;
  }

  if (view.type === 'quiz') {
    return `quiz:${view.chapterId}`;
  }

  return `subchapter:${view.subChapterId}`;
};

export const buildNavigationItems = (
  course: Course,
  options: CourseNavigationOptions = {},
): NavigationItem[] => {
  const items: NavigationItem[] = [
    { key: 'overview', view: { type: 'overview' } },
  ];

  for (const chapter of course.chapters) {
    items.push({
      key: `chapter:${chapter.id}`,
      view: { type: 'chapter', chapterId: chapter.id },
    });

    for (const subChapter of chapter.subChapters || []) {
      items.push({
        key: `subchapter:${subChapter.id}`,
        view: {
          type: 'subchapter',
          chapterId: chapter.id,
          subChapterId: subChapter.id,
        },
      });
    }

    if (hasVisibleTrainingQuiz(chapter, options)) {
      items.push({
        key: `quiz:${chapter.id}`,
        view: {
          type: 'quiz',
          chapterId: chapter.id,
        },
      });
    }
  }

  if (getVisibleFinalTest(course, options)) {
    items.push({
      key: 'final-test',
      view: { type: 'final-test' },
    });
  }

  return items;
};

export const calculateCompletionPercentage = (
  navigationItems: NavigationItem[],
  selectedView: ViewState,
): number => {
  const detailedSteps = navigationItems.length - 1;

  if (selectedView.type === 'final-test') {
    return 100;
  }

  if (detailedSteps <= 0 || selectedView.type === 'overview') {
    return 0;
  }

  const currentIndex = navigationItems.findIndex(
    (item) => item.key === getViewKey(selectedView),
  );

  if (currentIndex <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((currentIndex / detailedSteps) * 100));
};

export const getChapterProgressPercentage = (
  course: Course,
  chapterId: string,
  selectedView: ViewState,
  options: CourseNavigationOptions = {},
): number => {
  if (selectedView.type === 'final-test') {
    return 100;
  }

  const chapterIndex = course.chapters.findIndex((chapter) => chapter.id === chapterId);
  const selectedChapterIndex =
    selectedView.type === 'overview'
      ? -1
      : course.chapters.findIndex((chapter) => chapter.id === selectedView.chapterId);

  if (chapterIndex < 0 || selectedChapterIndex < 0) {
    return 0;
  }

  if (chapterIndex < selectedChapterIndex) {
    return 100;
  }

  if (chapterIndex > selectedChapterIndex) {
    return 0;
  }

  const chapter = course.chapters[chapterIndex];
  const totalSteps = Math.max(
    1,
    1 + (chapter.subChapters?.length ?? 0) + (hasVisibleTrainingQuiz(chapter, options) ? 1 : 0),
  );

  if (selectedView.type !== 'subchapter') {
    if (selectedView.type === 'quiz') {
      return 100;
    }

    return Math.round((1 / totalSteps) * 100);
  }

  const subChapterIndex = chapter.subChapters?.findIndex(
    (subChapter) => subChapter.id === selectedView.subChapterId,
  ) ?? -1;

  if (subChapterIndex < 0) {
    return Math.round((1 / totalSteps) * 100);
  }

  return Math.min(100, Math.round(((2 + subChapterIndex) / totalSteps) * 100));
};

export const getCourseProgressPercentage = (
  course: Course,
  selectedView: ViewState,
  options: CourseNavigationOptions = {},
): number => {
  if (selectedView.type === 'overview') {
    return 0;
  }

  return calculateCompletionPercentage(buildNavigationItems(course, options), selectedView);
};

export const resolveViewStateForCourse = (
  course: Course,
  requestedView: ViewState,
  options: CourseNavigationOptions = {},
): ViewState => {
  if (requestedView.type === 'overview') {
    return requestedView;
  }

  if (requestedView.type === 'final-test') {
    return getVisibleFinalTest(course, options) ? requestedView : { type: 'overview' };
  }

  const chapter = course.chapters.find((item) => item.id === requestedView.chapterId);

  if (!chapter) {
    return { type: 'overview' };
  }

  if (requestedView.type === 'chapter') {
    return requestedView;
  }

  if (requestedView.type === 'quiz') {
    return hasVisibleTrainingQuiz(chapter, options)
      ? requestedView
      : { type: 'chapter', chapterId: chapter.id };
  }

  const subChapter = chapter.subChapters.find(
    (item) => item.id === requestedView.subChapterId,
  );

  return subChapter ? requestedView : { type: 'chapter', chapterId: chapter.id };
};

export const getPreviewViewFromSearchParams = (
  searchParams: SearchParamsLike,
): ViewState => {
  const view = searchParams?.get('view');
  const chapterId = searchParams?.get('chapterId');
  const subChapterId = searchParams?.get('subChapterId');

  if (view === 'final-test') {
    return { type: 'final-test' };
  }

  if (view === 'quiz' && chapterId) {
    return { type: 'quiz', chapterId };
  }

  if (view === 'subchapter' && chapterId && subChapterId) {
    return { type: 'subchapter', chapterId, subChapterId };
  }

  if (view === 'chapter' && chapterId) {
    return { type: 'chapter', chapterId };
  }

  return { type: 'overview' };
};

export const getSafeAdminPreviewReturnTo = (
  searchParams: SearchParamsLike,
) => {
  const returnTo = searchParams?.get('returnTo');

  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return null;
  }

  return returnTo;
};

export const getViewStateFromProgress = (
  progress: CourseProgress | null,
): ViewState => {
  if (!progress?.lastViewedType) {
    return { type: 'overview' };
  }

  if (progress.lastViewedType === 'chapter' && progress.lastChapterId) {
    return { type: 'chapter', chapterId: progress.lastChapterId };
  }

  if (
    progress.lastViewedType === 'subchapter' &&
    progress.lastChapterId &&
    progress.lastSubChapterId
  ) {
    return {
      type: 'subchapter',
      chapterId: progress.lastChapterId,
      subChapterId: progress.lastSubChapterId,
    };
  }

  return { type: 'overview' };
};

export const getProgressPayloadFromView = (
  navigationItems: NavigationItem[],
  selectedView: ViewState,
): {
  completionPercentage: number;
  lastViewedType: ProgressViewType;
  lastChapterId?: string;
  lastSubChapterId?: string;
} => {
  const completionPercentage = calculateCompletionPercentage(
    navigationItems,
    selectedView,
  );

  if (selectedView.type === 'overview') {
    return { completionPercentage, lastViewedType: 'overview' };
  }

  if (selectedView.type === 'final-test') {
    return {
      completionPercentage: 100,
      lastViewedType: 'overview',
    };
  }

  if (selectedView.type === 'chapter') {
    return {
      completionPercentage,
      lastViewedType: 'chapter',
      lastChapterId: selectedView.chapterId,
    };
  }

  if (selectedView.type === 'quiz') {
    return {
      completionPercentage,
      lastViewedType: 'chapter',
      lastChapterId: selectedView.chapterId,
    };
  }

  return {
    completionPercentage,
    lastViewedType: 'subchapter',
    lastChapterId: selectedView.chapterId,
    lastSubChapterId: selectedView.subChapterId,
  };
};

export const preserveCompletedProgress = (
  existingProgress: CourseProgress | null,
  payload: {
    completionPercentage: number;
    lastViewedType: ProgressViewType;
    lastChapterId?: string;
    lastSubChapterId?: string;
  },
) => {
  if (
    !existingProgress ||
    (!existingProgress.completed && existingProgress.completionPercentage < 100)
  ) {
    return payload;
  }

  return { ...payload, completionPercentage: 100 };
};

export const isCourseProgressSynced = (
  existingProgress: CourseProgress | null,
  payload: {
    completionPercentage: number;
    lastViewedType: ProgressViewType;
    lastChapterId?: string;
    lastSubChapterId?: string;
  },
) => {
  if (!existingProgress) {
    return false;
  }

  return (
    existingProgress.completionPercentage === payload.completionPercentage &&
    existingProgress.lastViewedType === payload.lastViewedType &&
    (existingProgress.lastChapterId ?? undefined) === payload.lastChapterId &&
    (existingProgress.lastSubChapterId ?? undefined) === payload.lastSubChapterId
  );
};

