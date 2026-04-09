import type { Course } from '@/services/courseService';
import type { ActiveLanguage, SelectedContent, ViewState } from '../courseDetail.types';
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
): SelectedContent => {
  if (selectedView.type === 'overview') {
    return getOverviewSelection(course, language, t);
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