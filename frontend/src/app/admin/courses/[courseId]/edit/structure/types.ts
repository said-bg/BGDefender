'use client';

export type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export type ChapterFormState = {
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: string;
};

export type SubChapterFormState = {
  chapterId: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  orderIndex: string;
};

export const initialChapterForm: ChapterFormState = {
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  orderIndex: '1',
};

export const initialSubChapterForm: SubChapterFormState = {
  chapterId: '',
  titleEn: '',
  titleFi: '',
  descriptionEn: '',
  descriptionFi: '',
  orderIndex: '1',
};
