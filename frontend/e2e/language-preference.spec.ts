import { expect, test } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TOKEN_KEY = 'bg_defender_token';

test.describe('Language preference - E2E tests', () => {
  test('default language is Finnish and refresh keeps the selected language', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      if (!window.sessionStorage.getItem('language-test-initialized')) {
        window.localStorage.removeItem(tokenKey);
        window.localStorage.removeItem('i18nextLng');
        window.sessionStorage.setItem('language-test-initialized', 'true');
      }
    }, [TOKEN_KEY]);

    await page.route(`${API_BASE}/courses*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();

    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

    await page.getByRole('button', { name: 'FI' }).click();
    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();
  });
});
