import type {
  Chapter,
  Course,
  PedagogicalContent,
  SubChapter,
} from '@/services/courseService';
import {
  removePedagogicalContent,
  sortByOrderIndex,
  upsertChapter,
  upsertPedagogicalContent,
  upsertSubChapter,
} from '../EditCourseState.utils';

const createContent = (
  overrides: Partial<PedagogicalContent> = {},
): PedagogicalContent => ({
  id: 'content-1',
  titleEn: 'Content EN',
  titleFi: 'Content FI',
  type: 'text',
  contentEn: 'English content',
  contentFi: 'Finnish content',
  url: null,
  orderIndex: 1,
  ...overrides,
});

const createSubChapter = (
  overrides: Partial<SubChapter> = {},
): SubChapter => ({
  id: 'sub-1',
  titleEn: 'Subchapter EN',
  titleFi: 'Subchapter FI',
  descriptionEn: '',
  descriptionFi: '',
  orderIndex: 1,
  pedagogicalContents: [],
  ...overrides,
});

const createChapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: 'chapter-1',
  titleEn: 'Chapter EN',
  titleFi: 'Chapter FI',
  descriptionEn: '',
  descriptionFi: '',
  orderIndex: 1,
  subChapters: [],
  ...overrides,
});

const createCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
  titleEn: 'Course EN',
  titleFi: 'Course FI',
  descriptionEn: '',
  descriptionFi: '',
  level: 'free',
  status: 'draft',
  estimatedDuration: 60,
  coverImage: '',
  authors: [],
  chapters: [createChapter()],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('EditCourseState.utils', () => {
  // Keeps visual ordering stable without mutating the original array.
  it('sorts by order index immutably', () => {
    const items = [{ orderIndex: 2 }, { orderIndex: 1 }];

    expect(sortByOrderIndex(items)).toEqual([
      { orderIndex: 1 },
      { orderIndex: 2 },
    ]);
    expect(items).toEqual([{ orderIndex: 2 }, { orderIndex: 1 }]);
  });

  // Normalizes partial chapter responses so the structure UI never crashes on subChapters.length.
  it('upserts a chapter and defaults missing subchapters to an empty list', () => {
    const course = createCourse({ chapters: [] });
    const chapter = createChapter({
      subChapters: undefined as unknown as SubChapter[],
    });

    expect(upsertChapter(course, chapter).chapters[0].subChapters).toEqual([]);
  });

  // Handles the exact API edge case where an existing chapter has no subChapters field.
  it('upserts a subchapter when the parent chapter has missing subchapters', () => {
    const course = createCourse({
      chapters: [
        createChapter({
          subChapters: undefined as unknown as SubChapter[],
        }),
      ],
    });

    expect(upsertSubChapter(course, 'chapter-1', createSubChapter()).chapters[0])
      .toMatchObject({
        subChapters: [expect.objectContaining({ id: 'sub-1' })],
      });
  });

  // Keeps lessons sorted when a new content block is added to a subchapter.
  it('upserts pedagogical content in order', () => {
    const course = createCourse({
      chapters: [
        createChapter({
          subChapters: [
            createSubChapter({
              pedagogicalContents: [createContent({ id: 'content-2', orderIndex: 2 })],
            }),
          ],
        }),
      ],
    });

    const nextCourse = upsertPedagogicalContent(
      course,
      'chapter-1',
      'sub-1',
      createContent({ id: 'content-1', orderIndex: 1 }),
    );

    expect(
      nextCourse.chapters[0].subChapters[0].pedagogicalContents.map(
        (content) => content.id,
      ),
    ).toEqual(['content-1', 'content-2']);
  });

  // Normalizes partial subchapter responses before removing nested content.
  it('removes pedagogical content safely when contents are missing', () => {
    const course = createCourse({
      chapters: [
        createChapter({
          subChapters: [
            createSubChapter({
              pedagogicalContents: undefined as unknown as PedagogicalContent[],
            }),
          ],
        }),
      ],
    });

    expect(
      removePedagogicalContent(course, 'chapter-1', 'sub-1', 'missing').chapters[0]
        .subChapters[0].pedagogicalContents,
    ).toEqual([]);
  });
});
