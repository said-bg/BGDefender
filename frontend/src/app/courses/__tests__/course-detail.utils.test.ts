import {
  calculateCompletionPercentage,
  buildNavigationItems,
  getChapterProgressPercentage,
  getCourseProgressPercentage,
  getProgressPayloadFromView,
  preserveCompletedProgress,
  getAuthorRole,
  getChapterParagraphs,
  getLocalizedText,
  getPreviewText,
  getSelectedContent,
  getSubChapterParagraphs,
  getViewStateFromProgress,
  splitIntoParagraphs,
} from '../course-detail.utils';
import type { Course } from '@/services/courseService';

const createCourse = (): Course => ({
  id: 'course-1',
  titleEn: 'Course EN',
  titleFi: 'Course FI',
  descriptionEn: 'Overview paragraph 1.\n\nOverview paragraph 2.',
  descriptionFi: 'Yleiskuvaus 1.\n\nYleiskuvaus 2.',
  level: 'free',
  status: 'published',
  estimatedDuration: 90,
  coverImage: '/cover.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  authors: [
    {
      id: 'author-1',
      name: 'Alex',
      roleEn: 'Security Engineer',
      roleFi: 'Tietoturva-asiantuntija',
    },
  ],
  chapters: [
    {
      id: 'chapter-1',
      titleEn: 'Intro',
      titleFi: 'Johdanto',
      descriptionEn: '',
      descriptionFi: '',
      orderIndex: 1,
      subChapters: [
        {
          id: 'sub-1',
          titleEn: 'First Steps',
          titleFi: 'Ensimmäiset askeleet',
          descriptionEn: 'Fallback description',
          descriptionFi: 'Varakuvaus',
          orderIndex: 1,
          pedagogicalContents: [
            {
              id: 'content-1',
              titleEn: 'Lesson 1',
              titleFi: 'Oppitunti 1',
              type: 'text',
              contentEn: 'Paragraph 1.\n\nParagraph 2.',
              contentFi: 'Kappale 1.\n\nKappale 2.',
              url: null,
              orderIndex: 1,
            },
          ],
        },
      ],
    },
    {
      id: 'chapter-2',
      titleEn: 'Advanced',
      titleFi: 'Edistynyt',
      descriptionEn: 'Chapter description',
      descriptionFi: 'Luvun kuvaus',
      orderIndex: 2,
      subChapters: [],
    },
  ],
});

const t = (key: string) =>
  ({
    'detail.overview': 'Overview',
    'detail.courseDetail': 'Course detail',
  })[key] ?? key;

describe('course-detail.utils', () => {
  // Verifies that preview text is only shortened when it exceeds the given limit.
  it('truncates preview text only when needed', () => {
    expect(getPreviewText('short text', 20)).toBe('short text');
    expect(getPreviewText('This sentence is definitely too long', 10)).toBe(
      'This sente...',
    );
  });

  // Verifies that raw text is split into clean paragraphs and empty blocks are ignored.
  it('splits paragraphs and removes empty chunks', () => {
    expect(splitIntoParagraphs(undefined)).toEqual([]);
    expect(splitIntoParagraphs('One\n\nTwo\r\n\r\nThree')).toEqual([
      'One',
      'Two',
      'Three',
    ]);
  });

  // Verifies language selection and fallback behavior when one translation is missing.
  it('returns localized text with fallback', () => {
    expect(getLocalizedText('en', 'Hello', 'Moi')).toBe('Hello');
    expect(getLocalizedText('fi', 'Hello', 'Moi')).toBe('Moi');
    expect(getLocalizedText('fi', 'Hello', null)).toBe('Hello');
  });

  // Verifies that a subchapter prefers real pedagogical content over its fallback description.
  it('prefers pedagogical contents for subchapter paragraphs', () => {
    const course = createCourse();
    expect(getSubChapterParagraphs('en', course.chapters[0].subChapters[0])).toEqual([
      'Paragraph 1.',
      'Paragraph 2.',
    ]);
  });

  // Verifies that a chapter uses its own description first, then falls back to the first subchapter content.
  it('falls back to first subchapter when chapter description is empty', () => {
    const course = createCourse();
    expect(getChapterParagraphs('en', course.chapters[0])).toEqual([
      'Paragraph 1.',
      'Paragraph 2.',
    ]);
    expect(getChapterParagraphs('en', course.chapters[1])).toEqual([
      'Chapter description',
    ]);
  });

  // Verifies the linear navigation order used by Previous/Next.
  it('builds navigation items in overview-chapter-subchapter order', () => {
    const course = createCourse();
    expect(buildNavigationItems(course)).toEqual([
      { key: 'overview', view: { type: 'overview' } },
      {
        key: 'chapter:chapter-1',
        view: { type: 'chapter', chapterId: 'chapter-1' },
      },
      {
        key: 'subchapter:sub-1',
        view: {
          type: 'subchapter',
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
        },
      },
      {
        key: 'chapter:chapter-2',
        view: { type: 'chapter', chapterId: 'chapter-2' },
      },
    ]);
  });

  // Verifies the percentage calculation used to save a user's progression from the current step.
  it('calculates completion percentage from the selected view', () => {
    const course = createCourse();
    const navigationItems = buildNavigationItems(course);

    expect(
      calculateCompletionPercentage(navigationItems, { type: 'overview' }),
    ).toBe(0);
    expect(
      calculateCompletionPercentage(navigationItems, {
        type: 'chapter',
        chapterId: 'chapter-1',
      }),
    ).toBe(33);
    expect(
      calculateCompletionPercentage(navigationItems, {
        type: 'subchapter',
        chapterId: 'chapter-1',
        subChapterId: 'sub-1',
      }),
    ).toBe(67);
  });

  // Verifies the simplified sidebar progress values for the whole course and each chapter.
  it('builds sidebar progress values from the current position', () => {
    const course = createCourse();

    expect(getCourseProgressPercentage(course, { type: 'overview' })).toBe(0);
    expect(
      getChapterProgressPercentage(course, 'chapter-1', { type: 'overview' }),
    ).toBe(0);
    expect(
      getChapterProgressPercentage(course, 'chapter-1', {
        type: 'subchapter',
        chapterId: 'chapter-1',
        subChapterId: 'sub-1',
      }),
    ).toBe(100);
    expect(
      getChapterProgressPercentage(course, 'chapter-2', {
        type: 'subchapter',
        chapterId: 'chapter-1',
        subChapterId: 'sub-1',
      }),
    ).toBe(0);
  });

  // Verifies that stored progress can restore the matching view state on page load.
  it('restores the selected view from saved progress', () => {
    expect(
      getViewStateFromProgress({
        id: 'progress-1',
        userId: 1,
        courseId: 'course-1',
        completionPercentage: 50,
        completed: false,
        completedAt: null,
        lastAccessedAt: '2026-01-01T00:00:00.000Z',
        lastViewedType: 'chapter',
        lastChapterId: 'chapter-1',
        lastSubChapterId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({
      type: 'chapter',
      chapterId: 'chapter-1',
    });

    expect(getViewStateFromProgress(null)).toEqual({ type: 'overview' });
  });

  // Verifies that the saved payload contains the right completion percentage and navigation identifiers.
  it('builds a progress payload from the current view', () => {
    const course = createCourse();
    const navigationItems = buildNavigationItems(course);

    expect(
      getProgressPayloadFromView(navigationItems, {
        type: 'subchapter',
        chapterId: 'chapter-1',
        subChapterId: 'sub-1',
      }),
    ).toEqual({
      completionPercentage: 67,
      lastViewedType: 'subchapter',
      lastChapterId: 'chapter-1',
      lastSubChapterId: 'sub-1',
    });
  });

  // Verifies that reviewing a finished course never drops its saved completion back below 100%.
  it('preserves completed progress while still updating the latest viewed location', () => {
    expect(
      preserveCompletedProgress(
        {
          id: 'progress-1',
          userId: 1,
          courseId: 'course-1',
          completionPercentage: 100,
          completed: true,
          completedAt: '2026-01-02T00:00:00.000Z',
          lastAccessedAt: '2026-01-02T00:00:00.000Z',
          lastViewedType: 'subchapter',
          lastChapterId: 'chapter-1',
          lastSubChapterId: 'sub-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
          completionPercentage: 33,
          lastViewedType: 'chapter',
          lastChapterId: 'chapter-1',
        },
      ),
    ).toEqual({
      completionPercentage: 100,
      lastViewedType: 'chapter',
      lastChapterId: 'chapter-1',
    });
  });

  // Verifies that the page safely falls back to overview content when the requested chapter is missing.
  it('returns overview content when overview is selected or chapter is missing', () => {
    const course = createCourse();

    expect(
      getSelectedContent(course, { type: 'overview' }, 'en', t),
    ).toMatchObject({
      kind: 'overview',
      title: 'Overview',
      description: '',
      paragraphs: ['Overview paragraph 1.', 'Overview paragraph 2.'],
    });

    expect(
      getSelectedContent(
        course,
        { type: 'chapter', chapterId: 'missing' },
        'en',
        t,
      ),
    ).toMatchObject({
      kind: 'overview',
      title: 'Overview',
    });
  });

  // Verifies that subchapter content includes its localized title, paragraphs, and parent chapter title.
  it('returns subchapter content with parent chapter title', () => {
    const course = createCourse();

    expect(
      getSelectedContent(
        course,
        { type: 'subchapter', chapterId: 'chapter-1', subChapterId: 'sub-1' },
        'fi',
        t,
      ),
    ).toEqual({
      kind: 'subchapter',
      title: 'Ensimmäiset askeleet',
      description: 'Varakuvaus',
      paragraphs: ['Kappale 1.', 'Kappale 2.'],
      parentTitle: 'Johdanto',
    });
  });

  // Verifies fallback role text when an author has no translated role defined.
  it('returns author role fallback when author role is missing', () => {
    expect(
      getAuthorRole(
        'en',
        { id: 'author-2', name: 'Sam' },
        'Course author',
      ),
    ).toBe('Course author');
  });
});
