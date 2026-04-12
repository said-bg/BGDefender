import type { AdminCourseSummary, Course } from '@/services/course';
import {
  toLocalizedCourse,
  updateSummaryForDelete,
  updateSummaryForStatusChange,
} from '../courseAdmin.utils';

const createCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 'course-1',
  titleEn: 'English title',
  titleFi: 'Finnish title',
  descriptionEn: 'English description',
  descriptionFi: 'Finnish description',
  level: 'free',
  status: 'draft',
  estimatedDuration: 60,
  coverImage: '/cover.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  authors: [
    {
      id: 'author-1',
      name: 'Alex Morgan',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'author-2',
      name: 'Sam Lee',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
          titleEn: 'First lesson',
          titleFi: 'Ensimmainen oppitunti',
          descriptionEn: '',
          descriptionFi: '',
          orderIndex: 1,
          pedagogicalContents: [],
        },
        {
          id: 'sub-2',
          titleEn: 'Second lesson',
          titleFi: 'Toinen oppitunti',
          descriptionEn: '',
          descriptionFi: '',
          orderIndex: 2,
          pedagogicalContents: [],
        },
      ],
    },
  ],
  ...overrides,
});

const createSummary = (
  overrides: Partial<AdminCourseSummary> = {},
): AdminCourseSummary => ({
  totalCourses: 4,
  publishedCourses: 1,
  draftCourses: 2,
  archivedCourses: 1,
  ...overrides,
});

describe('courseAdmin.utils', () => {
  // Verifies the admin card view gets localized labels and derived counts from API data.
  it('builds a localized admin course with chapter and lesson counts', () => {
    expect(toLocalizedCourse(createCourse(), 'fi')).toMatchObject({
      title: 'Finnish title',
      description: 'Finnish description',
      chapterCount: 1,
      lessonCount: 2,
      authorNames: 'Alex Morgan, Sam Lee',
    });
  });

  // Keeps the dashboard counters in sync when a course status changes in-place.
  it('updates summary counters for a status change', () => {
    expect(
      updateSummaryForStatusChange(createSummary(), 'draft', 'published'),
    ).toEqual({
      totalCourses: 4,
      publishedCourses: 2,
      draftCourses: 1,
      archivedCourses: 1,
    });
  });

  // Avoids unnecessary state churn when the summary is missing or the status did not change.
  it('returns the same summary for no-op status changes', () => {
    const summary = createSummary();

    expect(updateSummaryForStatusChange(summary, 'draft', 'draft')).toBe(summary);
    expect(updateSummaryForStatusChange(null, 'draft', 'published')).toBeNull();
  });

  // Prevents counters from becoming negative after repeated delete refreshes.
  it('updates delete counters without dropping below zero', () => {
    expect(
      updateSummaryForDelete(
        createSummary({ totalCourses: 0, archivedCourses: 0 }),
        'archived',
      ),
    ).toEqual({
      totalCourses: 0,
      publishedCourses: 1,
      draftCourses: 2,
      archivedCourses: 0,
    });
  });
});

