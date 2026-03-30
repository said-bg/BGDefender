import {
  Author,
  Chapter,
  Course,
  PedagogicalContent,
  SubChapter,
} from '@/services/courseService';
import type { CourseProgress, ProgressViewType } from '@/services/progressService';

export type ActiveLanguage = 'en' | 'fi';

export type ViewState =
  | { type: 'overview' }
  | { type: 'chapter'; chapterId: string }
  | { type: 'subchapter'; chapterId: string; subChapterId: string };

export type SelectedContent = {
  kind: 'overview' | 'chapter' | 'subchapter';
  title: string;
  description: string;
  paragraphs: string[];
  parentTitle?: string;
};

export type NavigationItem = {
  key: string;
  view: ViewState;
};

export const getViewKey = (view: ViewState): string => {
  if (view.type === 'overview') {
    return 'overview';
  }

  if (view.type === 'chapter') {
    return `chapter:${view.chapterId}`;
  }

  return `subchapter:${view.subChapterId}`;
};

export const getPreviewText = (text: string, length = 96) => {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
};

export const splitIntoParagraphs = (value: string | null | undefined) => {
  if (!value) {
    return [];
  }

  return value
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

export const getLocalizedText = (
  language: ActiveLanguage,
  english?: string | null,
  finnish?: string | null,
) => {
  if (language === 'fi') {
    return finnish || english || '';
  }

  return english || finnish || '';
};

export const getContentParagraphs = (
  language: ActiveLanguage,
  contents: PedagogicalContent[],
) =>
  contents
    .flatMap((content) =>
      splitIntoParagraphs(
        getLocalizedText(language, content.contentEn, content.contentFi),
      ),
    )
    .filter(Boolean);

export const getSubChapterParagraphs = (
  language: ActiveLanguage,
  subChapter: SubChapter,
) => {
  const contentParagraphs = getContentParagraphs(
    language,
    subChapter.pedagogicalContents || [],
  );

  if (contentParagraphs.length > 0) {
    return contentParagraphs;
  }

  return splitIntoParagraphs(
    getLocalizedText(language, subChapter.descriptionEn, subChapter.descriptionFi),
  );
};

export const getChapterParagraphs = (
  language: ActiveLanguage,
  chapter: Chapter,
) => {
  const ownParagraphs = splitIntoParagraphs(
    getLocalizedText(language, chapter.descriptionEn, chapter.descriptionFi),
  );

  if (ownParagraphs.length > 0) {
    return ownParagraphs;
  }

  const firstSubChapter = chapter.subChapters?.[0];
  if (!firstSubChapter) {
    return [];
  }

  return getSubChapterParagraphs(language, firstSubChapter);
};

export const getOverviewParagraphs = (
  language: ActiveLanguage,
  course: Course,
) =>
  splitIntoParagraphs(
    getLocalizedText(language, course.descriptionEn, course.descriptionFi),
  );

export const getAuthorRole = (
  language: ActiveLanguage,
  author: Author,
  fallback: string,
) => getLocalizedText(language, author.roleEn, author.roleFi) || fallback;

export const buildNavigationItems = (course: Course): NavigationItem[] => {
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
  }

  return items;
};

export const calculateCompletionPercentage = (
  navigationItems: NavigationItem[],
  selectedView: ViewState,
): number => {
  const detailedSteps = navigationItems.length - 1;

  if (detailedSteps <= 0 || selectedView.type === 'overview') {
    return 0;
  }

  const currentIndex = navigationItems.findIndex(
    (item) => item.key === getViewKey(selectedView),
  );

  if (currentIndex <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((currentIndex / detailedSteps) * 100),
  );
};

// Build a simple sidebar progress value from the current course location without
// introducing extra persistence rules. The current chapter is treated as partially
// complete, previous chapters as complete, and upcoming chapters as untouched.
export const getChapterProgressPercentage = (
  course: Course,
  chapterId: string,
  selectedView: ViewState,
): number => {
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
  const totalSteps = Math.max(1, 1 + (chapter.subChapters?.length ?? 0));

  if (selectedView.type === 'chapter') {
    return Math.round((1 / totalSteps) * 100);
  }

  const subChapterIndex = chapter.subChapters.findIndex(
    (subChapter) => subChapter.id === selectedView.subChapterId,
  );

  if (subChapterIndex < 0) {
    return Math.round((1 / totalSteps) * 100);
  }

  return Math.min(100, Math.round(((2 + subChapterIndex) / totalSteps) * 100));
};

export const getCourseProgressPercentage = (
  course: Course,
  selectedView: ViewState,
): number => {
  if (selectedView.type === 'overview') {
    return 0;
  }

  return calculateCompletionPercentage(buildNavigationItems(course), selectedView);
};

export const getViewStateFromProgress = (
  progress: CourseProgress | null,
): ViewState => {
  if (!progress?.lastViewedType) {
    return { type: 'overview' };
  }

  if (progress.lastViewedType === 'chapter' && progress.lastChapterId) {
    return {
      type: 'chapter',
      chapterId: progress.lastChapterId,
    };
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

  if (selectedView.type === 'chapter') {
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

// Keep completed courses marked as completed while still letting the UI store the
// latest chapter/subchapter the learner decided to review afterwards.
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

  return {
    ...payload,
    completionPercentage: 100,
  };
};

export const getSelectedContent = (
  course: Course,
  selectedView: ViewState,
  language: ActiveLanguage,
  t: (key: string) => string,
): SelectedContent => {
  const overviewParagraphs = getOverviewParagraphs(language, course);

  if (selectedView.type === 'overview') {
    return {
      kind: 'overview',
      title: t('detail.overview'),
      description: '',
      paragraphs: overviewParagraphs,
    };
  }

  const chapter = course.chapters.find(
    (item) => item.id === selectedView.chapterId,
  );

  if (!chapter) {
    return {
      kind: 'overview',
      title: t('detail.overview'),
      description: '',
      paragraphs: overviewParagraphs,
    };
  }

  if (selectedView.type === 'chapter') {
    return {
      kind: 'chapter',
      title: getLocalizedText(language, chapter.titleEn, chapter.titleFi),
      description: getLocalizedText(
        language,
        chapter.descriptionEn,
        chapter.descriptionFi,
      ),
      paragraphs: getChapterParagraphs(language, chapter),
    };
  }

  const subChapter = chapter.subChapters.find(
    (item) => item.id === selectedView.subChapterId,
  );

  if (!subChapter) {
    return {
      kind: 'chapter',
      title: getLocalizedText(language, chapter.titleEn, chapter.titleFi),
      description: getLocalizedText(
        language,
        chapter.descriptionEn,
        chapter.descriptionFi,
      ),
      paragraphs: getChapterParagraphs(language, chapter),
    };
  }

  return {
    kind: 'subchapter',
    title: getLocalizedText(language, subChapter.titleEn, subChapter.titleFi),
    description: getLocalizedText(
      language,
      subChapter.descriptionEn,
      subChapter.descriptionFi,
    ),
    paragraphs: getSubChapterParagraphs(language, subChapter),
    parentTitle: getLocalizedText(language, chapter.titleEn, chapter.titleFi),
  };
};
