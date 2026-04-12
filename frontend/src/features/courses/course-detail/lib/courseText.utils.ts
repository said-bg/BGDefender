import type { Author, Chapter, PedagogicalContent, Course, SubChapter } from '@/services/course';
import type { ActiveLanguage } from '../courseDetail.types';

export const getPreviewText = (text: string, length = 96) => {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

export const stripHtmlToText = (value: string) =>
  decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|blockquote|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  );

const looksLikeRichHtml = (value: string) =>
  /<(p|div|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|pre|code|table|thead|tbody|tr|td|th|hr|a|strong|em|u|s|span|img|iframe|video)(\s|>)/i.test(
    value,
  );

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
    .flatMap((content) => {
      const localizedContent = getLocalizedText(
        language,
        content.contentEn,
        content.contentFi,
      );
      const normalizedContent = looksLikeRichHtml(localizedContent)
        ? stripHtmlToText(localizedContent)
        : localizedContent;

      return splitIntoParagraphs(normalizedContent);
    })
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
  return firstSubChapter ? getSubChapterParagraphs(language, firstSubChapter) : [];
};

export const getOverviewParagraphs = (language: ActiveLanguage, course: Course) =>
  splitIntoParagraphs(
    getLocalizedText(language, course.descriptionEn, course.descriptionFi),
  );

export const getAuthorRole = (
  language: ActiveLanguage,
  author: Author,
  fallback: string,
) => getLocalizedText(language, author.roleEn, author.roleFi) || fallback;
