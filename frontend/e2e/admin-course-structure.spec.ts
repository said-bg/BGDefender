import { expect, test } from '@playwright/test';
import {
  adminUser,
  buildApiPattern,
  createCourse,
  mockAuthenticatedSession,
  type MockCourse,
} from './support/courseFixtures';

const COURSE_ID = 'course-structure';
const COURSE_ROUTE = buildApiPattern(`/courses/admin/${COURSE_ID}`);
const CHAPTERS_ROUTE = buildApiPattern(`/courses/${COURSE_ID}/chapters`);
const SUB_CHAPTERS_ROUTE = buildApiPattern(
  `/courses/${COURSE_ID}/chapters/chapter-1/sub-chapters`,
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
  titleFi: 'Riskin ymmartaminen',
  descriptionEn: 'Risk chapter description',
  descriptionFi: 'Riskin luvun kuvaus',
  orderIndex: 1,
  subChapters: [],
};

test.describe('Admin course structure', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page, adminUser);
  });

  test('creates a chapter from the structure editor', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;
    let course = buildCourse();

    await page.route(COURSE_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(course),
      });
    });

    await page.route(CHAPTERS_ROUTE, async (route) => {
      createdPayload = route.request().postDataJSON();
      const createdChapter = {
        ...chapter,
        subChapters: [],
      };
      course = buildCourse({ chapters: [createdChapter] });

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...createdChapter,
          subChapters: undefined,
        }),
      });
    });

    await page.goto(`/admin/courses/${COURSE_ID}/edit/structure`, {
      waitUntil: 'networkidle',
    });

    await page
      .getByPlaceholder(/Enter the English chapter title|Syot[aä] luvun englanninkielinen otsikko/i)
      .fill('  Understanding Risk  ');
    await page
      .getByPlaceholder(/Enter the Finnish chapter title|Syot[aä] luvun suomenkielinen otsikko/i)
      .fill('  Riskin ymmartaminen  ');
    await page
      .getByPlaceholder(/Write the English chapter description\.|Kirjoita luvun englanninkielinen kuvaus\./i)
      .fill('  Risk chapter description  ');
    await page
      .getByPlaceholder(/Write the Finnish chapter description\.|Kirjoita luvun suomenkielinen kuvaus\./i)
      .fill('  Riskin luvun kuvaus  ');
    await page
      .locator('form')
      .getByRole('button', { name: /Create chapter|Luo luku/i })
      .click();

    await expect(
      page.getByText(/Chapter created successfully\.|Luku luotiin onnistuneesti\./i),
    ).toBeVisible();
    await expect(page.getByText('Understanding Risk')).toBeVisible();
    expect(createdPayload).toMatchObject({
      titleEn: 'Understanding Risk',
      titleFi: 'Riskin ymmartaminen',
      descriptionEn: 'Risk chapter description',
      descriptionFi: 'Riskin luvun kuvaus',
      orderIndex: 1,
    });
  });

  test('creates a subchapter from the structure editor', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;
    let course = buildCourse({ chapters: [chapter] });

    await page.route(COURSE_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(course),
      });
    });

    await page.route(SUB_CHAPTERS_ROUTE, async (route) => {
      createdPayload = route.request().postDataJSON();
      const createdSubChapter = {
        id: 'sub-1',
        titleEn: 'Risk Signals',
        titleFi: 'Riskisignaalit',
        descriptionEn: 'Risk signals description',
        descriptionFi: 'Riskisignaalien kuvaus',
        orderIndex: 1,
        pedagogicalContents: [],
      };
      course = buildCourse({
        chapters: [
          {
            ...chapter,
            subChapters: [createdSubChapter],
          },
        ],
      });

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createdSubChapter),
      });
    });

    await page.goto(`/admin/courses/${COURSE_ID}/edit/structure`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('button', { name: /Create subchapter|Luo alaluku/i }).click();
    await page
      .getByPlaceholder(/Enter the English subchapter title|Syot[aä] alaluvun englanninkielinen otsikko/i)
      .fill('  Risk Signals  ');
    await page
      .getByPlaceholder(/Enter the Finnish subchapter title|Syot[aä] alaluvun suomenkielinen otsikko/i)
      .fill('  Riskisignaalit  ');
    await page
      .getByPlaceholder(/Write the English subchapter description\.|Kirjoita alaluvun englanninkielinen kuvaus\./i)
      .fill('  Risk signals description  ');
    await page
      .getByPlaceholder(/Write the Finnish subchapter description\.|Kirjoita alaluvun suomenkielinen kuvaus\./i)
      .fill('  Riskisignaalien kuvaus  ');
    await page.getByRole('button', { name: /Create subchapter|Luo alaluku/i }).last().click();

    await expect(
      page.getByText(/Subchapter created successfully\.|Alaluku luotiin onnistuneesti\./i),
    ).toBeVisible();
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
