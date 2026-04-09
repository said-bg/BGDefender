import { expect, test } from '@playwright/test';
import {
  adminUser,
  createCourse,
  mockAuthMe,
  setAuthenticatedUser,
} from './support/courseFixtures';

const AUTHORS_ROUTE = /http:\/\/localhost:3001\/api\/authors(?:\?.*)?$/;
const COURSES_ROUTE = /http:\/\/localhost:3001\/api\/courses$/;
const ADMIN_COURSES_LIST_ROUTE =
  /http:\/\/localhost:3001\/api\/courses\/admin\/list(?:\?.*)?$/;
const ADMIN_COURSES_SUMMARY_ROUTE =
  /http:\/\/localhost:3001\/api\/courses\/admin\/summary$/;

const authors = [
  {
    id: 'author-1',
    name: 'Alex Johnson',
    roleEn: 'Cybersecurity Instructor',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Practical defensive security teacher.',
    biographyFi: 'Käytännön puolustavan tietoturvan kouluttaja.',
    photo: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

test.describe('Admin courses', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedUser(page);
    await mockAuthMe(page, adminUser);

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
          publishedCourses: 0,
          draftCourses: 1,
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

  // Verifies that the course list can load through the protected admin route.
  test('shows the admin course library', async ({ page }) => {
    await page.goto('/admin/courses', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /manage courses/i }),
    ).toBeVisible();
    await expect(page.getByText('Blue Team Basics')).toBeVisible();
    await expect(page.getByRole('link', { name: /create course/i })).toBeVisible();
  });

  // Verifies the create course form trims payloads and keeps selected authors attached.
  test('creates a course from the admin form', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;

    await page.route(COURSES_ROUTE, async (route) => {
      const request = route.request();

      if (request.method() === 'POST') {
        createdPayload = request.postDataJSON();

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...createCourse('premium'),
            id: 'course-created',
            ...createdPayload,
            authors,
            chapters: [],
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/admin/courses/new', { waitUntil: 'networkidle' });

    await page.getByLabel(/Title \(English\)/i).fill('  Threat Hunting Basics  ');
    await page.getByLabel(/Title \(Finnish\)/i).fill('  Uhkametsästyksen perusteet  ');
    await page
      .getByLabel(/Description \/ Overview \(English\)/i)
      .fill('  Learn a practical threat hunting workflow.  ');
    await page
      .getByLabel(/Description \/ Overview \(Finnish\)/i)
      .fill('  Opi käytännön uhkametsästyksen työnkulku.  ');
    await page.getByLabel(/Access level/i).selectOption('premium');
    await page.getByLabel(/Status/i).selectOption('published');
    await page.getByLabel(/Estimated duration/i).fill('45');
    await page
      .getByPlaceholder('https://example.com/course-cover.jpg')
      .fill('  /assets/images/home-bg.png  ');
    await page.getByRole('button', { name: /Alex Johnson/i }).click();
    await page.getByRole('button', { name: /^Create course$/i }).click();

    await expect(
      page.getByText('Course created successfully. Redirecting to course management...'),
    ).toBeVisible();
    expect(createdPayload).toMatchObject({
      titleEn: 'Threat Hunting Basics',
      titleFi: 'Uhkametsästyksen perusteet',
      descriptionEn: 'Learn a practical threat hunting workflow.',
      descriptionFi: 'Opi käytännön uhkametsästyksen työnkulku.',
      level: 'premium',
      status: 'published',
      estimatedDuration: 45,
      coverImage: '/assets/images/home-bg.png',
      authorIds: ['author-1'],
    });
  });
});
