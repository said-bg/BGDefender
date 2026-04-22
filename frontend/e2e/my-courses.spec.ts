import { expect, test } from '@playwright/test';
import {
  buildApiPattern,
  createCourse,
  freeUser,
  mockCertificates,
  mockNotifications,
  setAuthenticatedUser,
} from './support/courseFixtures';

const inProgressCourse = {
  ...createCourse('free'),
  id: 'course-in-progress',
  titleEn: 'Blue Team Basics',
  descriptionEn: 'Free overview',
  descriptionFi: 'Ilmainen yleiskuva',
};

const completedCourse = {
  ...createCourse('premium'),
  id: 'course-completed',
  titleEn: 'Cloud Security Essentials',
  descriptionEn: 'Premium overview',
  descriptionFi: 'Premium yleiskuva',
};

const publishedCourses = {
  data: [inProgressCourse, completedCourse],
  count: 2,
};

test.describe('My Courses - E2E tests', () => {
  test('authenticated user can filter started and completed courses', async ({ page }) => {
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeUser),
      });
    });

    await page.route(buildApiPattern('/courses'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedCourses),
      });
    });

    await page.route(buildApiPattern('/progress/me'), async (route) => {
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
            lastChapterId: 'chapter-free-1',
            lastSubChapterId: 'sub-free-1',
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
            lastChapterId: 'chapter-premium-1',
            lastSubChapterId: 'sub-premium-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
        ]),
      });
    });

    await page.route(buildApiPattern('/favorites/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/my-courses', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'My Courses' })).toBeVisible();
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
