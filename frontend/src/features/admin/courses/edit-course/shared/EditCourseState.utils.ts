import { Chapter, Course, PedagogicalContent, SubChapter } from '@/services/courseService';

export const sortByOrderIndex = <T extends { orderIndex: number }>(items: T[]) =>
  [...items].sort((left, right) => left.orderIndex - right.orderIndex);

const getSafeSubChapters = (chapter: Chapter) => chapter.subChapters ?? [];

const getSafePedagogicalContents = (subChapter: SubChapter) =>
  subChapter.pedagogicalContents ?? [];

export const upsertChapter = (course: Course, chapter: Chapter): Course => ({
  ...course,
  chapters: sortByOrderIndex(
    course.chapters.some((current) => current.id === chapter.id)
      ? course.chapters.map((current) =>
          current.id === chapter.id
            ? { ...chapter, subChapters: getSafeSubChapters(chapter) }
            : current,
        )
      : [...course.chapters, { ...chapter, subChapters: getSafeSubChapters(chapter) }],
  ),
});

export const removeChapter = (course: Course, chapterId: string): Course => ({
  ...course,
  chapters: course.chapters.filter((chapter) => chapter.id !== chapterId),
});

export const upsertSubChapter = (
  course: Course,
  chapterId: string,
  subChapter: SubChapter,
): Course => ({
  ...course,
  chapters: course.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          subChapters: sortByOrderIndex(
            getSafeSubChapters(chapter).some((current) => current.id === subChapter.id)
              ? getSafeSubChapters(chapter).map((current) =>
                  current.id === subChapter.id ? subChapter : current,
                )
              : [...getSafeSubChapters(chapter), subChapter],
          ),
        }
      : chapter,
  ),
});

export const removeSubChapter = (
  course: Course,
  chapterId: string,
  subChapterId: string,
): Course => ({
  ...course,
  chapters: course.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          subChapters: getSafeSubChapters(chapter).filter(
            (subChapter) => subChapter.id !== subChapterId,
          ),
        }
      : chapter,
  ),
});

export const upsertPedagogicalContent = (
  course: Course,
  chapterId: string,
  subChapterId: string,
  content: PedagogicalContent,
): Course => ({
  ...course,
  chapters: course.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          subChapters: getSafeSubChapters(chapter).map((subChapter) =>
            subChapter.id === subChapterId
              ? {
                  ...subChapter,
                  pedagogicalContents: sortByOrderIndex(
                    getSafePedagogicalContents(subChapter).some(
                      (current) => current.id === content.id,
                    )
                      ? getSafePedagogicalContents(subChapter).map((current) =>
                          current.id === content.id ? content : current,
                        )
                      : [...getSafePedagogicalContents(subChapter), content],
                  ),
                }
              : subChapter,
          ),
        }
      : chapter,
  ),
});

export const removePedagogicalContent = (
  course: Course,
  chapterId: string,
  subChapterId: string,
  contentId: string,
): Course => ({
  ...course,
  chapters: course.chapters.map((chapter) =>
    chapter.id === chapterId
      ? {
          ...chapter,
          subChapters: getSafeSubChapters(chapter).map((subChapter) =>
            subChapter.id === subChapterId
              ? {
                  ...subChapter,
                  pedagogicalContents: getSafePedagogicalContents(subChapter).filter(
                    (content) => content.id !== contentId,
                  ),
                }
              : subChapter,
          ),
        }
      : chapter,
  ),
});
