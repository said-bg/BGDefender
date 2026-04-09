import { expect, test } from '@playwright/test';
import {
  adminUser,
  mockAuthMe,
  setAuthenticatedUser,
} from './support/courseFixtures';

const authors = [
  {
    id: 'author-1',
    name: 'Alex Johnson',
    roleEn: 'Cybersecurity Instructor',
    roleFi: 'Kyberturvallisuuden kouluttaja',
    biographyEn: 'Teaches defensive security with practical examples.',
    biographyFi: 'Opettaa puolustavaa kyberturvallisuutta.',
    photo: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

const AUTHORS_ROUTE = /http:\/\/localhost:3001\/api\/authors(?:\?.*)?$/;

test.describe('Admin authors', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedUser(page);
    await mockAuthMe(page, adminUser);
  });

  // Verifies that an authenticated admin can load the author management surface.
  test('shows the author library to admins', async ({ page }) => {
    await page.route(AUTHORS_ROUTE, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: authors, count: authors.length }),
      });
    });

    await page.goto('/admin/authors', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: /manage authors/i }),
    ).toBeVisible();
    await expect(page.getByText('Alex Johnson')).toBeVisible();
    await expect(page.getByText('Cybersecurity Instructor')).toBeVisible();
  });

  // Verifies the create form sends trimmed author data and refreshes local UI state.
  test('creates an author from the admin form', async ({ page }) => {
    let createdPayload: Record<string, unknown> | null = null;

    await page.route(AUTHORS_ROUTE, async (route) => {
      const request = route.request();

      if (request.method() === 'POST') {
        createdPayload = request.postDataJSON();

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'author-2',
            createdAt: '2026-01-04T00:00:00.000Z',
            updatedAt: '2026-01-04T00:00:00.000Z',
            ...createdPayload,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: authors, count: authors.length }),
      });
    });

    await page.goto('/admin/authors', { waitUntil: 'networkidle' });

    await page.getByLabel('Name').fill('  Dana Scully  ');
    await page.getByLabel(/Role \(English\)/i).fill('  Incident Responder  ');
    await page.getByLabel(/Biography \(English\)/i).fill('  Handles cyber incident triage.  ');
    await page.getByRole('button', { name: /create author/i }).click();

    await expect(page.getByText('Author created successfully.')).toBeVisible();
    await expect(page.getByText('Dana Scully')).toBeVisible();
    expect(createdPayload).toMatchObject({
      name: 'Dana Scully',
      roleEn: 'Incident Responder',
      biographyEn: 'Handles cyber incident triage.',
    });
  });
});
