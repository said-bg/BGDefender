import { expect, test } from '@playwright/test';
import {
  adminUser,
  createCourse,
  mockAuthenticatedSession,
} from './support/courseFixtures';

const ADMIN_COURSES_LIST_ROUTE = /\/api\/courses\/admin\/list(?:\?.*)?$/;
const ADMIN_COURSES_SUMMARY_ROUTE = /\/api\/courses\/admin\/summary$/;

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, adminUser);

    await page.route(ADMIN_COURSES_SUMMARY_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCourses: 1,
          publishedCourses: 1,
          draftCourses: 0,
          archivedCourses: 0,
        }),
      });
    });

    await page.route(ADMIN_COURSES_LIST_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [createCourse('free')], count: 1 }),
      });
    });
  });

  test('admin lands on the dashboard instead of learner navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /welcome, /i })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'Home' })).toHaveCount(0);
    await expect(page.locator('nav').getByRole('link', { name: 'Courses' })).toHaveCount(0);
    await expect(page.locator('nav').getByRole('link', { name: 'Favorites' })).toHaveCount(0);
  });
});
