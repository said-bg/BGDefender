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
      id: 'favorite-course',
      titleEn: 'Malware Analysis Starter',
      titleFi: 'Haittaohjelma-analyysin alkeet',
      descriptionEn: 'A compact course to sharpen practical analysis habits.',
      descriptionFi: 'Tiivis kurssi kaytannon analyysitaitojen vahvistamiseen.',
      level: 'free',
      status: 'published',
      estimatedDuration: 120,
      coverImage: LOCAL_COVER_IMAGE,
      authors: [],
      chapters: [
        {
          id: 'chapter-1',
          titleEn: 'Foundations',
          titleFi: 'Perusteet',
          descriptionEn: 'Foundations',
          descriptionFi: 'Perusteet',
          orderIndex: 1,
          subChapters: [
            {
              id: 'sub-1',
              titleEn: 'Tooling',
              titleFi: 'Tyokalut',
              descriptionEn: 'Tooling',
              descriptionFi: 'Tyokalut',
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
  count: 1,
};

test.describe('Favorites - E2E tests', () => {
  // Verifies that the authenticated user can open the favorites page and remove a starred course.
  test('authenticated user can review and remove a favorite course', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
    }, [TOKEN_KEY]);

    await page.route(`${API_BASE}/auth/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeUser),
      });
    });

    await page.route(`${API_BASE}/favorites/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'favorite-1',
            userId: freeUser.id,
            courseId: 'favorite-course',
            createdAt: '2026-01-03T00:00:00.000Z',
          },
        ]),
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
            courseId: 'favorite-course',
            completionPercentage: 25,
            completed: false,
            completedAt: null,
            lastAccessedAt: '2026-01-03T00:00:00.000Z',
            lastViewedType: 'chapter',
            lastChapterId: 'chapter-1',
            lastSubChapterId: null,
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
        ]),
      });
    });

    await page.route(`${API_BASE}/favorites/me/course/favorite-course`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'favorite-1',
          userId: freeUser.id,
          courseId: 'favorite-course',
          createdAt: '2026-01-03T00:00:00.000Z',
        }),
      });
    });

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
    await expect(page.getByText('Malware Analysis Starter')).toBeVisible();
    await expect(page.getByText('1 Favorite courses')).toBeVisible();

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect(page.getByRole('heading', { name: 'No favorites yet' })).toBeVisible();
  });

  // Verifies the main favorite flow: star a course from its detail page, open the dedicated
  // favorites page, and confirm the same course appears there.
  test('authenticated user can add a course to favorites from the course page', async ({
    page,
  }) => {
    let favorites = [] as Array<{
      id: string;
      userId: number;
      courseId: string;
      createdAt: string;
    }>;

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

    await page.route(`${API_BASE}/courses/favorite-course`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedCourses.data[0]),
      });
    });

    await page.route(`${API_BASE}/courses*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedCourses),
      });
    });

    await page.route(`${API_BASE}/progress/me/course/favorite-course`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'null',
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'progress-1',
          userId: freeUser.id,
          courseId: 'favorite-course',
          completionPercentage: 33,
          completed: false,
          completedAt: null,
          lastAccessedAt: '2026-01-03T00:00:00.000Z',
          lastViewedType: 'chapter',
          lastChapterId: 'chapter-1',
          lastSubChapterId: null,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        }),
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
            courseId: 'favorite-course',
            completionPercentage: 33,
            completed: false,
            completedAt: null,
            lastAccessedAt: '2026-01-03T00:00:00.000Z',
            lastViewedType: 'chapter',
            lastChapterId: 'chapter-1',
            lastSubChapterId: null,
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
        body: JSON.stringify(favorites),
      });
    });

    await page.route(`${API_BASE}/favorites/me/course/favorite-course`, async (route) => {
      if (route.request().method() === 'PUT') {
        favorites = [
          {
            id: 'favorite-1',
            userId: freeUser.id,
            courseId: 'favorite-course',
            createdAt: '2026-01-03T00:00:00.000Z',
          },
        ];

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(favorites[0]),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(favorites[0] ?? null),
      });
    });

    await page.goto('/courses/favorite-course', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: 'Malware Analysis Starter' }),
    ).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url() === `${API_BASE}/favorites/me/course/favorite-course` &&
          response.request().method() === 'PUT',
      ),
      page.getByRole('button', { name: 'Add to favorites' }).click(),
    ]);

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Favorites', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Malware Analysis Starter')).toBeVisible();
    await expect(page.getByText('1 Favorite courses')).toBeVisible();
  });
});
