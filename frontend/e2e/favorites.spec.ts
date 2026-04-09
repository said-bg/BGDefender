import { expect, test } from '@playwright/test';
import {
  API_BASE,
  createCourse,
  freeUser,
  setAuthenticatedUser,
  setEnglishLanguage,
} from './support/courseFixtures';

const favoriteCourse = {
  ...createCourse('free'),
  id: 'favorite-course',
  titleEn: 'Malware Analysis Starter',
  titleFi: 'Haittaohjelma-analyysin alkeet',
  descriptionEn: 'A compact course to sharpen practical analysis habits.',
  descriptionFi: 'Tiivis kurssi kaytannon analyysitaitojen vahvistamiseen.',
};

const publishedCourses = {
  data: [favoriteCourse],
  count: 1,
};

const favoriteRow = {
  id: 'favorite-1',
  userId: freeUser.id,
  courseId: 'favorite-course',
  createdAt: '2026-01-03T00:00:00.000Z',
};

test.describe('Favorites - E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLanguage(page);
  });

  test('authenticated user can review and remove a favorite course', async ({ page }) => {
    await setAuthenticatedUser(page);

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
        body: JSON.stringify([favoriteRow]),
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
            lastChapterId: 'chapter-free-1',
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
        body: JSON.stringify(favoriteRow),
      });
    });

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
    await expect(page.getByText('Malware Analysis Starter')).toBeVisible();
    await expect(page.getByText('1 Favorite courses')).toBeVisible();

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect(page.getByRole('heading', { name: 'No favorites yet' })).toBeVisible();
  });

  test('authenticated user can add a course to favorites from the course page', async ({
    page,
  }) => {
    let favorites = [] as typeof favoriteRow[];

    await setAuthenticatedUser(page);

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
        body: JSON.stringify(favoriteCourse),
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body:
          route.request().method() === 'GET'
            ? 'null'
            : JSON.stringify({
                id: 'progress-1',
                userId: freeUser.id,
                courseId: 'favorite-course',
                completionPercentage: 33,
                completed: false,
                completedAt: null,
                lastAccessedAt: '2026-01-03T00:00:00.000Z',
                lastViewedType: 'chapter',
                lastChapterId: 'chapter-free-1',
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
            lastChapterId: 'chapter-free-1',
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
        favorites = [favoriteRow];

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(favoriteRow),
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

    await expect(page.getByRole('heading', { name: 'Malware Analysis Starter' })).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url() === `${API_BASE}/favorites/me/course/favorite-course` &&
          response.request().method() === 'PUT',
      ),
      page.getByRole('button', { name: 'Add to favorites' }).click(),
    ]);

    await page.goto('/favorites', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Favorites', exact: true })).toBeVisible();
    await expect(page.getByText('Malware Analysis Starter')).toBeVisible();
    await expect(page.getByText('1 Favorite courses')).toBeVisible();
  });
});
