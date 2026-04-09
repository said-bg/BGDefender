import { expect, test } from '@playwright/test';
import {
  adminUser,
  createCourse,
  mockAuthMe,
  setAuthenticatedUser,
  type MockCourse,
} from './support/courseFixtures';

const COURSE_ID = 'course-structure';
const COURSE_ROUTE = new RegExp(
  `http://localhost:3001/api/courses/${COURSE_ID}$`,
);
const CHAPTERS_ROUTE = new RegExp(
  `http://localhost:3001/api/courses/${COURSE_ID}/chapters$`,
);
const SUB_CHAPTERS_ROUTE = new RegExp(
  `http://localhost:3001/api/courses/${COURSE_ID}/chapters/chapter-1/sub-chapters$`,
);

const buildCourse = (overrides: Partial<MockCourse> = {}): MockCourse => ({
  ...createCourse('free'),
  id: COURSE_ID,
  titleEn: 'Admin Structure Course',
  titleFi: 'Admin Structure Kurssi',
  chapters: [],
  ...overrides,
});

const chapter = {
  id: 'chapter-1',
  titleEn: 'Understanding Risk',
  titleFi: 'Riskin ymmärtäminen',
  descriptionEn: 'Risk chapter description',
  descriptionFi: 'Riskin luvun kuvaus',
  orderIndex: 1,
  subChapters: [],
};

test.describe('Admin course structure', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedUser(page);
    await mockAuthMe(page, adminUser);
  });

  // Verifies chapter creation from an empty structure and covers partial API responses.
  test('creates a chapter from the structure editor', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;

    await page.route(COURSE_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildCourse()),
      });
    });

    await page.route(CHAPTERS_ROUTE, async (route) => {
      createdPayload = route.request().postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...chapter,
          subChapters: undefined,
        }),
      });
    });

    await page.goto(`/admin/courses/${COURSE_ID}/edit/structure`, {
      waitUntil: 'networkidle',
    });

    await page
      .getByPlaceholder('Enter the English chapter title')
      .fill('  Understanding Risk  ');
    await page
      .getByPlaceholder('Enter the Finnish chapter title')
      .fill('  Riskin ymmärtäminen  ');
    await page
      .getByPlaceholder('Write the English chapter description.')
      .fill('  Risk chapter description  ');
    await page
      .getByPlaceholder('Write the Finnish chapter description.')
      .fill('  Riskin luvun kuvaus  ');
    await page.locator('form').getByRole('button', { name: /^Create chapter$/i }).click();

    await expect(page.getByText('Chapter created successfully.')).toBeVisible();
    await expect(page.getByText('Understanding Risk')).toBeVisible();
    expect(createdPayload).toMatchObject({
      titleEn: 'Understanding Risk',
      titleFi: 'Riskin ymmärtäminen',
      descriptionEn: 'Risk chapter description',
      descriptionFi: 'Riskin luvun kuvaus',
      orderIndex: 1,
    });
  });

  // Verifies subchapter creation inside an existing chapter without relying on a real backend.
  test('creates a subchapter from the structure editor', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;

    await page.route(COURSE_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildCourse({ chapters: [chapter] })),
      });
    });

    await page.route(SUB_CHAPTERS_ROUTE, async (route) => {
      createdPayload = route.request().postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'sub-1',
          titleEn: 'Risk Signals',
          titleFi: 'Riskisignaalit',
          descriptionEn: 'Risk signals description',
          descriptionFi: 'Riskisignaalien kuvaus',
          orderIndex: 1,
          pedagogicalContents: [],
        }),
      });
    });

    await page.goto(`/admin/courses/${COURSE_ID}/edit/structure`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('button', { name: /^Create subchapter$/i }).click();
    await page
      .getByPlaceholder('Enter the English subchapter title')
      .fill('  Risk Signals  ');
    await page
      .getByPlaceholder('Enter the Finnish subchapter title')
      .fill('  Riskisignaalit  ');
    await page
      .getByPlaceholder('Write the English subchapter description.')
      .fill('  Risk signals description  ');
    await page
      .getByPlaceholder('Write the Finnish subchapter description.')
      .fill('  Riskisignaalien kuvaus  ');
    await page.getByRole('button', { name: /^Create subchapter$/i }).last().click();

    await expect(page.getByText('Subchapter created successfully.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Risk Signals' })).toBeVisible();
    expect(createdPayload).toMatchObject({
      titleEn: 'Risk Signals',
      titleFi: 'Riskisignaalit',
      descriptionEn: 'Risk signals description',
      descriptionFi: 'Riskisignaalien kuvaus',
      orderIndex: 1,
    });
  });
});
