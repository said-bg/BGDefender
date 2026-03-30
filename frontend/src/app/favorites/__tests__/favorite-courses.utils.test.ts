import type { Course } from '@/services/courseService';
import type { FavoriteSummary } from '@/services/favoriteService';
import type { CourseProgressSummary } from '@/services/progressService';
import { buildFavoriteCourses } from '../favorite-courses.utils';

const createCourse = (id: string, level: 'free' | 'premium' = 'free'): Course =>
  ({
    id,
    titleEn: `Course ${id}`,
    titleFi: `Kurssi ${id}`,
    descriptionEn: `Description ${id}`,
    descriptionFi: `Kuvaus ${id}`,
    level,
    status: 'published',
    estimatedDuration: 60,
    coverImage: '/assets/images/home-bg.png',
    authors: [],
    chapters: [
      {
        id: `${id}-chapter-1`,
        titleEn: 'Chapter',
        titleFi: 'Luku',
        descriptionEn: 'Description',
        descriptionFi: 'Kuvaus',
        orderIndex: 1,
        subChapters: [
          {
            id: `${id}-sub-1`,
            titleEn: 'Sub',
            titleFi: 'Ala',
            descriptionEn: 'Sub description',
            descriptionFi: 'Ala kuvaus',
            orderIndex: 1,
            pedagogicalContents: [],
          },
        ],
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as Course;

const createFavorite = (courseId: string, createdAt: string): FavoriteSummary => ({
  id: `favorite-${courseId}`,
  userId: 12,
  courseId,
  createdAt,
});

const createProgress = (
  courseId: string,
  completionPercentage: number,
  completed = false,
): CourseProgressSummary =>
  ({
    id: `progress-${courseId}`,
    userId: 12,
    courseId,
    completionPercentage,
    completed,
    completedAt: completed ? '2026-01-03T00:00:00.000Z' : null,
    lastAccessedAt: '2026-01-03T00:00:00.000Z',
    lastViewedType: 'chapter',
    lastChapterId: `${courseId}-chapter-1`,
    lastSubChapterId: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  }) as CourseProgressSummary;

describe('buildFavoriteCourses', () => {
  // Verifies that the favorites page merges favorite rows, course data, and progress into one stable card list.
  it('builds favorite cards with counts and progress data', () => {
    const courses = [createCourse('course-1')];
    const favorites = [createFavorite('course-1', '2026-01-02T00:00:00.000Z')];
    const progressRows = [createProgress('course-1', 40)];

    const result = buildFavoriteCourses(courses, favorites, progressRows);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'course-1',
      chapterCount: 1,
      itemCount: 1,
      progressPercentage: 40,
      completed: false,
    });
  });

  // Verifies that orphaned favorites are ignored when the linked course no longer exists.
  it('skips favorites that no longer map to a published course', () => {
    const result = buildFavoriteCourses(
      [],
      [createFavorite('missing-course', '2026-01-02T00:00:00.000Z')],
      [],
    );

    expect(result).toEqual([]);
  });

  // Verifies that favorites stay sorted by the freshest activity date once progress exists.
  it('sorts favorite courses by last access time when progress exists', () => {
    const courses = [createCourse('course-1'), createCourse('course-2', 'premium')];
    const favorites = [
      createFavorite('course-1', '2026-01-02T00:00:00.000Z'),
      createFavorite('course-2', '2026-01-01T00:00:00.000Z'),
    ];
    const progressRows = [
      createProgress('course-1', 10),
      createProgress('course-2', 100, true),
    ];

    const result = buildFavoriteCourses(courses, favorites, progressRows);

    expect(result.map((course) => course.id)).toEqual(['course-1', 'course-2']);
    expect(result[1].completed).toBe(true);
  });
});
