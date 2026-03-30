import { expect, test } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TOKEN_KEY = 'bg_defender_token';
const LOCAL_COVER_IMAGE = '/assets/images/home-bg.png';

const freeUser = {
  id: 10,
  email: 'free@example.com',
  role: 'USER',
  plan: 'FREE',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const publishedCourses = {
  data: [
    {
      id: 'course-in-progress',
      titleEn: 'Blue Team Basics',
      titleFi: 'Blue Team Perusteet',
      descriptionEn: 'Free overview',
      descriptionFi: 'Ilmainen yleiskuva',
      level: 'free',
      status: 'published',
      estimatedDuration: 120,
      coverImage: LOCAL_COVER_IMAGE,
      authors: [],
      chapters: [
        {
          id: 'chapter-1',
          titleEn: 'Introduction',
          titleFi: 'Johdanto',
          descriptionEn: 'Intro',
          descriptionFi: 'Johdanto',
          orderIndex: 1,
          subChapters: [
            {
              id: 'sub-1',
              titleEn: 'First Lesson',
              titleFi: 'Ensimmäinen oppitunti',
              descriptionEn: 'Lesson',
              descriptionFi: 'Oppitunti',
              orderIndex: 1,
              pedagogicalContents: [],
            },
          ],
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'course-completed',
      titleEn: 'Cloud Security Essentials',
      titleFi: 'Pilviturvallisuuden perusteet',
      descriptionEn: 'Premium overview',
      descriptionFi: 'Premium yleiskuva',
      level: 'premium',
      status: 'published',
      estimatedDuration: 180,
      coverImage: LOCAL_COVER_IMAGE,
      authors: [],
      chapters: [
        {
          id: 'chapter-2',
          titleEn: 'Foundations',
          titleFi: 'Perusteet',
          descriptionEn: 'Foundations',
          descriptionFi: 'Perusteet',
          orderIndex: 1,
          subChapters: [
            {
              id: 'sub-2',
              titleEn: 'Secure Setup',
              titleFi: 'Turvallinen käyttöönotto',
              descriptionEn: 'Setup',
              descriptionFi: 'Käyttöönotto',
              orderIndex: 1,
              pedagogicalContents: [],
            },
          ],
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  count: 2,
};

test.describe('My Courses - E2E tests', () => {
  // Verifies that the authenticated user can browse their started courses,
  // switch between filters, and use the right CTA for each state.
  test('authenticated user can filter started and completed courses', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
      window.localStorage.setItem('i18nextLng', 'en');
    }, [TOKEN_KEY]);

    await page.route(`${API_BASE}/auth/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeUser),
      });
    });

    await page.route(`${API_BASE}/courses*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedCourses),
      });
    });

    await page.route(`${API_BASE}/progress/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'progress-1',
            userId: freeUser.id,
            courseId: 'course-in-progress',
            completionPercentage: 67,
            completed: false,
            completedAt: null,
            lastAccessedAt: '2026-01-03T00:00:00.000Z',
            lastViewedType: 'subchapter',
            lastChapterId: 'chapter-1',
            lastSubChapterId: 'sub-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
          {
            id: 'progress-2',
            userId: freeUser.id,
            courseId: 'course-completed',
            completionPercentage: 100,
            completed: true,
            completedAt: '2026-01-03T00:00:00.000Z',
            lastAccessedAt: '2026-01-02T00:00:00.000Z',
            lastViewedType: 'subchapter',
            lastChapterId: 'chapter-2',
            lastSubChapterId: 'sub-2',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
        ]),
      });
    });

    await page.route(`${API_BASE}/favorites/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/my-courses', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'My Courses' }),
    ).toBeVisible();
    await expect(page.getByText('2 Started courses')).toBeVisible();
    await expect(page.getByText('Blue Team Basics')).toBeVisible();
    await expect(page.getByText('Cloud Security Essentials')).toBeVisible();

    await page.getByRole('button', { name: 'In Progress' }).click();
    await expect(page.getByText('Blue Team Basics')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Resume' })).toBeVisible();
    await expect(page.getByText('Cloud Security Essentials')).not.toBeVisible();

    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.getByText('Cloud Security Essentials')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Review' })).toBeVisible();
    await expect(page.getByText('Blue Team Basics')).not.toBeVisible();

    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.getByText('Blue Team Basics')).toBeVisible();
    await expect(page.getByText('Cloud Security Essentials')).toBeVisible();
  });
});
