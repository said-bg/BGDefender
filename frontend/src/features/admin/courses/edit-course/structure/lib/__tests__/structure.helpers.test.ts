import type { Chapter, Course, SubChapter } from '@/services/course';
import {
  buildChapterPayload,
  buildDefaultChapterFormState,
  buildDefaultSubChapterFormState,
  getNextSiblingOrderIndex,
  buildSubChapterPayload,
  normalizeStructureCourse,
  validateChapterForm,
  validateSubChapterForm,
} from '../structure.helpers';

const t = (key: string, options?: Record<string, unknown>) =>
  String(options?.defaultValue ?? key);

const createSubChapter = (overrides: Partial<SubChapter> = {}): SubChapter => ({
  id: 'sub-1',
  titleEn: 'Subchapter EN',
  titleFi: 'Subchapter FI',
  descriptionEn: 'Subchapter description EN',
  descriptionFi: 'Subchapter description FI',
  orderIndex: 1,
  pedagogicalContents: [],
  ...overrides,
});

const createChapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: 'chapter-1',
  titleEn: 'Chapter EN',
  titleFi: 'Chapter FI',
  descriptionEn: 'Chapter description EN',
  descriptionFi: 'Chapter description FI',
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

describe('structure.helpers', () => {
  // Protects the structure page from API responses where chapters arrive out of order or incomplete.
  it('normalizes chapters and subchapters into safe sorted arrays', () => {
    const course = createCourse({
      chapters: [
        createChapter({
          id: 'chapter-2',
          orderIndex: 2,
          subChapters: [
            createSubChapter({ id: 'sub-2', orderIndex: 2 }),
            createSubChapter({ id: 'sub-3', orderIndex: 2 }),
          ],
        }),
        createChapter({
          id: 'chapter-1',
          orderIndex: 1,
          subChapters: undefined as unknown as SubChapter[],
        }),
      ],
    });

    expect(normalizeStructureCourse(course).chapters).toMatchObject([
      { id: 'chapter-1', subChapters: [] },
      {
        id: 'chapter-2',
        subChapters: [
          { id: 'sub-2', orderIndex: 1 },
          { id: 'sub-3', orderIndex: 2 },
        ],
      },
    ]);
  });

  // Keeps the chapter form validation aligned with backend-required translated fields.
  it('validates chapter form required fields and order', () => {
    expect(
      validateChapterForm(
        {
          titleEn: '',
          titleFi: 'FI',
          descriptionEn: 'EN',
          descriptionFi: 'FI',
          orderIndex: '1',
        },
        t,
      ),
    ).toBe('Both English and Finnish chapter titles are required.');

    expect(
      validateChapterForm(
        {
          titleEn: 'EN',
          titleFi: 'FI',
          descriptionEn: 'EN',
          descriptionFi: 'FI',
          orderIndex: '0',
        },
        t,
      ),
    ).toBe('Chapter order must be a number greater than zero.');
  });

  // Ensures the chapter payload is the trimmed shape expected by the API.
  it('builds a trimmed chapter payload', () => {
    expect(
      buildChapterPayload({
        titleEn: ' Chapter EN ',
        titleFi: ' Chapter FI ',
        descriptionEn: ' Description EN ',
        descriptionFi: ' Description FI ',
        orderIndex: '2',
      }),
    ).toEqual({
      titleEn: 'Chapter EN',
      titleFi: 'Chapter FI',
      descriptionEn: 'Description EN',
      descriptionFi: 'Description FI',
      orderIndex: 2,
    });
  });

  // Keeps subchapter creation from running without a parent chapter and valid translated content.
  it('validates subchapter form parent, required fields, and order', () => {
    expect(
      validateSubChapterForm(
        {
          chapterId: '',
          titleEn: 'EN',
          titleFi: 'FI',
          descriptionEn: 'EN',
          descriptionFi: 'FI',
          orderIndex: '1',
        },
        t,
      ),
    ).toBe('Choose a chapter before creating a subchapter.');

    expect(
      validateSubChapterForm(
        {
          chapterId: 'chapter-1',
          titleEn: 'EN',
          titleFi: 'FI',
          descriptionEn: 'EN',
          descriptionFi: 'FI',
          orderIndex: '-1',
        },
        t,
      ),
    ).toBe('Subchapter order must be a number greater than zero.');
  });

  // Ensures subchapter payloads are trimmed before they hit the mutation layer.
  it('builds a trimmed subchapter payload', () => {
    expect(
      buildSubChapterPayload({
        chapterId: 'chapter-1',
        titleEn: ' Sub EN ',
        titleFi: ' Sub FI ',
        descriptionEn: ' Description EN ',
        descriptionFi: ' Description FI ',
        orderIndex: '3',
      }),
    ).toEqual({
      titleEn: 'Sub EN',
      titleFi: 'Sub FI',
      descriptionEn: 'Description EN',
      descriptionFi: 'Description FI',
      orderIndex: 3,
    });
  });

  // Uses the current sibling count, not a stale or sparse orderIndex, for the next append position.
  it('builds default chapter order from the current normalized sibling count', () => {
    expect(
      getNextSiblingOrderIndex([
        { orderIndex: 1 },
        { orderIndex: 4 },
      ]),
    ).toBe('3');

    expect(
      buildDefaultChapterFormState([
        createChapter({ id: 'chapter-1', orderIndex: 1 }),
        createChapter({ id: 'chapter-2', orderIndex: 4 }),
      ]),
    ).toEqual({ orderIndex: '3' });
  });

  // Keeps the default order safe when an API chapter is missing its subchapter list.
  it('builds default subchapter form state from the parent chapter', () => {
    expect(
      buildDefaultSubChapterFormState(
        createChapter({ subChapters: undefined as unknown as SubChapter[] }),
      ),
    ).toEqual({
      chapterId: 'chapter-1',
      orderIndex: '1',
    });

    expect(
      buildDefaultSubChapterFormState(
        createChapter({
          subChapters: [
            createSubChapter({ id: 'sub-1', orderIndex: 1 }),
            createSubChapter({ id: 'sub-2', orderIndex: 9 }),
          ],
        }),
      ),
    ).toEqual({
      chapterId: 'chapter-1',
      orderIndex: '3',
    });
  });
});
