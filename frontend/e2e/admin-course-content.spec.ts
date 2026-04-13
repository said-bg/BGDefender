import { expect, test } from '@playwright/test';
import {
  adminUser,
  createCourse,
  mockAuthenticatedSession,
  type MockCourse,
} from './support/courseFixtures';

const COURSE_ID = 'course-content';
const COURSE_ROUTE = new RegExp(`/api/courses/${COURSE_ID}$`);
const CONTENT_ROUTE = new RegExp(
  `/api/courses/${COURSE_ID}/chapters/chapter-1/sub-chapters/sub-1/pedagogical-contents$`,
);

const courseWithSubchapter: MockCourse = {
  ...createCourse('free'),
  id: COURSE_ID,
  titleEn: 'Admin Content Course',
  titleFi: 'Admin Content Kurssi',
  chapters: [
    {
      id: 'chapter-1',
      titleEn: 'Content Chapter',
      titleFi: 'Sisältöluku',
      descriptionEn: 'Content chapter description',
      descriptionFi: 'Sisältöluvun kuvaus',
      orderIndex: 1,
      subChapters: [
        {
          id: 'sub-1',
          titleEn: 'Content Subchapter',
          titleFi: 'Sisältöalaluku',
          descriptionEn: 'Content subchapter description',
          descriptionFi: 'Sisältöalaluvun kuvaus',
          orderIndex: 1,
          pedagogicalContents: [],
        },
      ],
    },
  ],
};

test.describe('Admin course content', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, adminUser);

    await page.route(COURSE_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(courseWithSubchapter),
      });
    });
  });

  // Verifies the content editor can open a course with an existing chapter/subchapter.
  test('shows the content editor for the selected subchapter', async ({ page }) => {
    await page.goto(`/admin/courses/${COURSE_ID}/edit/content`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { name: 'Content', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Content Subchapter' })).toBeVisible();
    await expect(page.getByText('No content blocks in this subchapter yet.')).toBeVisible();
  });

  // Verifies a rich text block can be saved with both EN and FI content.
  test('creates a rich text content block', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;

    await page.route(CONTENT_ROUTE, async (route) => {
      createdPayload = route.request().postDataJSON();

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'content-1',
          url: null,
          ...createdPayload,
        }),
      });
    });

    await page.goto(`/admin/courses/${COURSE_ID}/edit/content`, {
      waitUntil: 'networkidle',
    });

    await page.getByLabel(/Title \(English\)/i).fill('Incident checklist');
    await page.getByLabel(/Title \(Finnish\)/i).fill('Poikkeamalista');

    const editor = page.locator('.ProseMirror').first();
    await expect(editor).toBeVisible();
    await editor.fill('English incident response checklist.');

    await page.locator('form').getByRole('button', { name: 'FI' }).click();
    const finnishEditor = page.locator('.ProseMirror').first();
    await expect(finnishEditor).toBeVisible();
    await finnishEditor.fill('Suomenkielinen poikkeamalista.');

    await page.getByRole('button', { name: /save block/i }).click();

    await expect(page.getByText('Content block created successfully.')).toBeVisible();
    expect(createdPayload).toMatchObject({
      titleEn: 'Incident checklist',
      titleFi: 'Poikkeamalista',
      type: 'text',
      orderIndex: 1,
    });
    expect(String(createdPayload?.contentEn)).toContain('English incident response checklist.');
    expect(String(createdPayload?.contentFi)).toContain('Suomenkielinen poikkeamalista.');
  });
});
