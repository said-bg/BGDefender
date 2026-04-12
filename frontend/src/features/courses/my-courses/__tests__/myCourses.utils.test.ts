import type { Course } from '@/services/course';
import type { CourseProgressSummary } from '@/services/progress';
import {
  buildStartedCourses,
  filterMyCourses,
  getChapterAndItemCounts,
  getMyCoursesSummary,
} from '../myCourses.utils';

const createCourse = (
  overrides: Partial<Course> = {},
): Course => ({
  id: 'course-1',
  titleEn: 'Course EN',
  titleFi: 'Course FI',
  descriptionEn: 'Course description',
  descriptionFi: 'Kurssin kuvaus',
  level: 'free',
  status: 'published',
  estimatedDuration: 90,
  coverImage: '/assets/images/home-bg.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  authors: [],
  chapters: [
    {
      id: 'chapter-1',
      titleEn: 'Intro',
      titleFi: 'Johdanto',
      descriptionEn: 'Intro description',
      descriptionFi: 'Johdannon kuvaus',
      orderIndex: 1,
      subChapters: [
        {
          id: 'sub-1',
          titleEn: 'First lesson',
          titleFi: 'Ensimmainen oppitunti',
          descriptionEn: 'Subchapter description',
          descriptionFi: 'Alaluvun kuvaus',
          orderIndex: 1,
          pedagogicalContents: [],
        },
        {
          id: 'sub-2',
          titleEn: 'Second lesson',
          titleFi: 'Toinen oppitunti',
          descriptionEn: 'Another description',
          descriptionFi: 'Toinen kuvaus',
          orderIndex: 2,
          pedagogicalContents: [],
        },
      ],
    },
  ],
  ...overrides,
});

const createProgress = (
  overrides: Partial<CourseProgressSummary> = {},
): CourseProgressSummary => ({
  id: 'progress-1',
  userId: 12,
  courseId: 'course-1',
  completionPercentage: 45,
  completed: false,
  completedAt: null,
  lastAccessedAt: '2026-01-03T00:00:00.000Z',
  lastViewedType: 'subchapter',
  lastChapterId: 'chapter-1',
  lastSubChapterId: 'sub-1',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
  ...overrides,
});

describe('my-courses.utils', () => {
  // Verifies that the page metrics count chapter groups and visible learning items correctly.
  it('counts chapters and items for a course', () => {
    const course = createCourse();

    expect(getChapterAndItemCounts(course)).toEqual({
      chapters: 1,
      items: 2,
    });
  });

  // Verifies that progress rows are merged with published courses and sorted by latest activity.
  it('builds started courses from published courses and progress rows', () => {
    const olderCourse = createCourse({
      id: 'course-older',
      titleEn: 'Older Course',
      titleFi: 'Vanhempi kurssi',
    });
    const newerCourse = createCourse({
      id: 'course-newer',
      titleEn: 'Newer Course',
      titleFi: 'Uudempi kurssi',
      chapters: [],
    });

    const courses = buildStartedCourses(
      [olderCourse, newerCourse],
      [
        createProgress({
          courseId: 'course-older',
          completionPercentage: 45,
          completed: false,
          lastAccessedAt: '2026-01-01T00:00:00.000Z',
        }),
        createProgress({
          id: 'progress-2',
          courseId: 'course-newer',
          completionPercentage: 100,
          completed: false,
          lastAccessedAt: '2026-01-04T00:00:00.000Z',
        }),
        createProgress({
          id: 'progress-missing',
          courseId: 'missing-course',
        }),
      ],
    );

    expect(courses).toHaveLength(2);
    expect(courses[0]).toMatchObject({
      id: 'course-newer',
      chapterCount: 0,
      itemCount: 0,
      progressPercentage: 100,
      completed: true,
    });
    expect(courses[1]).toMatchObject({
      id: 'course-older',
      chapterCount: 1,
      itemCount: 2,
      progressPercentage: 45,
      completed: false,
    });
  });

  // Verifies that the tab filters only return the expected slice of the course list.
  it('filters courses by all, in progress, and completed', () => {
    const courses = [
      {
        ...createCourse({ id: 'course-in-progress' }),
        chapterCount: 1,
        itemCount: 2,
        progressPercentage: 40,
        completed: false,
      },
      {
        ...createCourse({ id: 'course-completed' }),
        chapterCount: 1,
        itemCount: 2,
        progressPercentage: 100,
        completed: true,
      },
    ];

    expect(filterMyCourses(courses, 'all')).toHaveLength(2);
    expect(filterMyCourses(courses, 'in_progress')).toEqual([courses[0]]);
    expect(filterMyCourses(courses, 'completed')).toEqual([courses[1]]);
  });

  // Verifies that the header summary stays consistent with the visible source list.
  it('builds summary counts for all, in-progress, and completed courses', () => {
    const courses = [
      {
        ...createCourse({ id: 'course-1' }),
        chapterCount: 1,
        itemCount: 2,
        progressPercentage: 25,
        completed: false,
      },
      {
        ...createCourse({ id: 'course-2' }),
        chapterCount: 1,
        itemCount: 2,
        progressPercentage: 100,
        completed: true,
      },
      {
        ...createCourse({ id: 'course-3' }),
        chapterCount: 1,
        itemCount: 2,
        progressPercentage: 100,
        completed: true,
      },
    ];

    expect(getMyCoursesSummary(courses)).toEqual({
      all: 3,
      inProgress: 1,
      completed: 2,
    });
  });
});

