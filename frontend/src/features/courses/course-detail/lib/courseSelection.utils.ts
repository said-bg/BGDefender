import type { Course } from '@/services/course';
import type { ActiveLanguage, SelectedContent, ViewState } from '../courseDetail.types';
import {
  type CourseNavigationOptions,
  getVisibleFinalTest,
  hasVisibleTrainingQuiz,
} from './courseNavigation.utils';
import {
  getChapterParagraphs,
  getLocalizedText,
  getOverviewParagraphs,
  getSubChapterParagraphs,
} from './courseText.utils';

const getOverviewSelection = (
  course: Course,
  language: ActiveLanguage,
  t: (key: string) => string,
): SelectedContent => ({
  kind: 'overview',
  title: t('detail.overview'),
  description: '',
  paragraphs: getOverviewParagraphs(language, course),
  contentBlocks: [],
});

export const getSelectedContent = (
  course: Course,
  selectedView: ViewState,
  language: ActiveLanguage,
  t: (key: string) => string,
  options: CourseNavigationOptions = {},
): SelectedContent => {
  if (selectedView.type === 'overview') {
    return getOverviewSelection(course, language, t);
  }
  
  if (selectedView.type === 'final-test') {
    const finalTest = getVisibleFinalTest(course, options);

    if (!finalTest) {
      return getOverviewSelection(course, language, t);
    }

    return {
      kind: 'final-test',
      title: getLocalizedText(language, finalTest.titleEn, finalTest.titleFi),
      description: getLocalizedText(
        language,
        finalTest.descriptionEn,
        finalTest.descriptionFi,
      ),
      paragraphs: [],
    };
  }

  const chapter = course.chapters.find(
    (item) => item.id === selectedView.chapterId,
  );

  if (!chapter) {
    return getOverviewSelection(course, language, t);
  }

  const chapterSelection: SelectedContent = {
    kind: 'chapter',
    title: getLocalizedText(language, chapter.titleEn, chapter.titleFi),
    description: getLocalizedText(
      language,
      chapter.descriptionEn,
      chapter.descriptionFi,
    ),
    paragraphs: getChapterParagraphs(language, chapter),
    contentBlocks: [],
  };

  if (selectedView.type === 'chapter') {
    return chapterSelection;
  }

  if (selectedView.type === 'quiz') {
    const trainingQuiz = chapter.trainingQuiz;

    if (!trainingQuiz || !hasVisibleTrainingQuiz(chapter, options)) {
      return chapterSelection;
    }

    return {
      kind: 'quiz',
      title: getLocalizedText(language, trainingQuiz.titleEn, trainingQuiz.titleFi),
      description: getLocalizedText(
        language,
        trainingQuiz.descriptionEn,
        trainingQuiz.descriptionFi,
      ),
      paragraphs: [],
      parentTitle: getLocalizedText(language, chapter.titleEn, chapter.titleFi),
      chapterId: chapter.id,
      passingScore: trainingQuiz.passingScore,
    };
  }

  const subChapter = chapter.subChapters?.find(
    (item) => item.id === selectedView.subChapterId,
  );

  if (!subChapter) {
    return chapterSelection;
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
    contentBlocks: [...(subChapter.pedagogicalContents ?? [])].sort(
      (left, right) => left.orderIndex - right.orderIndex,
    ),
  };
};
