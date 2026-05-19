import { expect, test } from '@playwright/test';
import {
  createCourse,
  creatorUser,
  mockAuthenticatedSession,
} from './support/courseFixtures';

const AUTHORS_ROUTE = /\/api\/authors(?:\?.*)?$/;
const ADMIN_COURSES_LIST_ROUTE = /\/api\/courses\/admin\/list(?:\?.*)?$/;
const ADMIN_COURSES_SUMMARY_ROUTE = /\/api\/courses\/admin\/summary(?:\?.*)?$/;

const authors = [
  {
    id: 'author-1',
    name: 'Creator Author',
    roleEn: 'Security Researcher',
    roleFi: 'Tietoturvatutkija',
    biographyEn: 'Builds creator-owned learning content.',
    biographyFi: 'Rakentaa creatorin omistamaa oppimissisaltoa.',
    photo: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

test.describe('Creator access', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, creatorUser);

    await page.route(AUTHORS_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: authors, count: authors.length }),
      });
    });

    await page.route(ADMIN_COURSES_SUMMARY_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalCourses: 1,
          publishedCourses: 1,
          draftCourses: 0,
        }),
      });
    });

    await page.route(ADMIN_COURSES_LIST_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [createCourse('premium')], count: 1 }),
      });
    });
  });

  test('lets creators access their studio and shared management pages', async ({
    page,
  }) => {
    await page.goto('/creator', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /welcome back, creator/i }),
    ).toBeVisible();

    await page.goto('/admin/courses', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /my courses/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /review courses/i }),
    ).toHaveCount(0);
    await expect(page.getByText('Red Team Advanced')).toBeVisible();

    await page.goto('/admin/authors', { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: /manage authors/i }),
    ).toBeVisible();
    await expect(page.getByText('Creator Author')).toBeVisible();
  });

  test('blocks creators from admin-only surfaces', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();

    await page.goto('/admin/users', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
  });
});
