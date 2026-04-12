import type {
  Chapter,
  Course,
  PedagogicalContent,
  SubChapter,
} from '@/services/course';
import {
  buildFreshContentForm,
  normalizeCourseForContentStudio,
  validateContentForm,
} from '../content.utils';

const t = (key: string, options?: Record<string, unknown>) =>
  String(options?.defaultValue ?? key);

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
  chapters: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('content.utils', () => {
  // Protects the content editor from partial API data and keeps nested items sorted.
  it('normalizes course content studio data into safe sorted arrays', () => {
    const course = createCourse({
      chapters: [
        createChapter({
          id: 'chapter-2',
          orderIndex: 2,
          subChapters: undefined as unknown as SubChapter[],
        }),
        createChapter({
          id: 'chapter-1',
          orderIndex: 1,
          subChapters: [
            createSubChapter({
              id: 'sub-2',
              orderIndex: 2,
              pedagogicalContents: [createContent({ id: 'content-2', orderIndex: 2 })],
            }),
            createSubChapter({
              id: 'sub-1',
              orderIndex: 1,
              pedagogicalContents: undefined as unknown as PedagogicalContent[],
            }),
          ],
        }),
      ],
    });

    expect(normalizeCourseForContentStudio(course).chapters).toMatchObject([
      {
        id: 'chapter-1',
        subChapters: [
          { id: 'sub-1', pedagogicalContents: [] },
          { id: 'sub-2', pedagogicalContents: [{ id: 'content-2' }] },
        ],
      },
      { id: 'chapter-2', subChapters: [] },
    ]);
  });

  // Keeps the next content order stable when a subchapter has no content array yet.
  it('builds a fresh content form from selected chapter and subchapter', () => {
    expect(
      buildFreshContentForm(
        createChapter(),
        createSubChapter({
          pedagogicalContents: undefined as unknown as PedagogicalContent[],
        }),
      ),
    ).toMatchObject({
      chapterId: 'chapter-1',
      subChapterId: 'sub-1',
      orderIndex: '1',
    });
  });

  // Validates that content blocks are tied to a course and a selected subchapter.
  it('validates missing course and parent selection', () => {
    expect(
      validateContentForm(
        {
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
          titleEn: 'EN',
          titleFi: 'FI',
          contentEn: 'EN',
          contentFi: 'FI',
          orderIndex: '1',
        },
        undefined,
        t,
      ),
    ).toBe('Missing course id.');

    expect(
      validateContentForm(
        {
          chapterId: '',
          subChapterId: '',
          titleEn: 'EN',
          titleFi: 'FI',
          contentEn: 'EN',
          contentFi: 'FI',
          orderIndex: '1',
        },
        'course-1',
        t,
      ),
    ).toBe('Choose a subchapter before creating a content block.');
  });

  // Keeps rich text blocks from saving without translated titles and body content.
  it('validates required translated content and order', () => {
    expect(
      validateContentForm(
        {
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
          titleEn: '',
          titleFi: 'FI',
          contentEn: 'EN',
          contentFi: 'FI',
          orderIndex: '1',
        },
        'course-1',
        t,
      ),
    ).toBe('Both English and Finnish block titles are required.');

    expect(
      validateContentForm(
        {
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
          titleEn: 'EN',
          titleFi: 'FI',
          contentEn: 'EN',
          contentFi: '',
          orderIndex: '1',
        },
        'course-1',
        t,
      ),
    ).toBe('Both English and Finnish block contents are required.');

    expect(
      validateContentForm(
        {
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
          titleEn: 'EN',
          titleFi: 'FI',
          contentEn: 'EN',
          contentFi: 'FI',
          orderIndex: '0',
        },
        'course-1',
        t,
      ),
    ).toBe('Block order must be a number greater than zero.');
  });
});
