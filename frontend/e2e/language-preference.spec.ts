import { expect, test } from '@playwright/test';

import { buildApiPattern } from './support/courseFixtures';

test.describe('Language preference - E2E tests', () => {
  test('default language is Finnish and refresh keeps the selected language', async ({
    page,
  }) => {
    await page.context().clearCookies();

    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem('language-test-initialized')) {
        window.localStorage.removeItem('i18nextLng');
        document.cookie = 'bgd_locale=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.sessionStorage.setItem('language-test-initialized', 'true');
      }
    });

    await page.route(buildApiPattern('/courses'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/fi$/);

    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Etusivu' }),
    ).toBeVisible();

    await page.getByRole('button', { name: /select language|valitse kieli/i }).click();
    await page.getByRole('button', { name: /english|englanti/i }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Home' }),
    ).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/en$/);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Home' }),
    ).toBeVisible();

    await page.getByRole('button', { name: /select language|valitse kieli/i }).click();
    await page.getByRole('button', { name: /finnish|suomi/i }).click();
    await expect(page).toHaveURL(/\/fi$/);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Etusivu' }),
    ).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/fi$/);
    await expect(
      page.getByRole('navigation').getByRole('link', { name: 'Etusivu' }),
    ).toBeVisible();
  });
});
