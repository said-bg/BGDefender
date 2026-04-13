import { expect, test } from '@playwright/test';

import { buildApiPattern } from './support/courseFixtures';

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

    await page.route(buildApiPattern('/courses'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();

    const languageSwitcher = page
      .locator('[aria-label="Language switcher"], [aria-label="Kielen valitsin"]')
      .getByRole('button');

    await languageSwitcher.click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();

    await languageSwitcher.click();
    await page.getByRole('button', { name: 'Suomi' }).click();
    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Etusivu' })).toBeVisible();
  });
});
