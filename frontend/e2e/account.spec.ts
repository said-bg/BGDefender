import { expect, test } from '@playwright/test';
import { buildApiPattern, mockCertificates, mockNotifications } from './support/courseFixtures';

const TOKEN_KEY = 'bg_defender_token';

const accountUser = {
  id: 21,
  email: 'said@example.com',
  firstName: 'Said',
  lastName: 'Ait',
  occupation: 'Security Analyst',
  role: 'USER',
  plan: 'PREMIUM',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
};

test.describe('Account page - E2E tests', () => {
  // Verifies that an authenticated user can open the dropdown and reach the account page.
  test('authenticated user can open the account page from the navbar', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
      window.localStorage.setItem('i18nextLng', 'en');
    }, [TOKEN_KEY]);

    await mockNotifications(page);
    await mockCertificates(page);

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accountUser),
      });
    });

    await page.route(buildApiPattern('/favorites/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    });

    await page.route(buildApiPattern('/progress/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
    });

    await page.route(buildApiPattern('/courses'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], count: 0 }),
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const profileButton = page.getByRole('button', { name: 'Profile' });
    await expect(profileButton).toBeVisible();
    await profileButton.click();
    await page.getByRole('menu').getByRole('link', { name: 'Profile' }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('heading', { name: 'Said Ait' })).toBeVisible();
    await expect(page.getByText('Account summary')).toBeVisible();
    await expect(page.locator('input[value="Security Analyst"]')).toBeVisible();
  });

  // Verifies that profile and password forms submit the expected payloads from the account page.
  test('authenticated user can update profile details and change password', async ({
    page,
  }) => {
    let currentUser = { ...accountUser };

    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
      window.localStorage.setItem('i18nextLng', 'en');
    }, [TOKEN_KEY]);

    await mockNotifications(page);
    await mockCertificates(page);

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentUser),
      });
    });

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }

      const body = route.request().postDataJSON() as {
        firstName: string;
        lastName: string;
        occupation: string;
      };

      currentUser = {
        ...currentUser,
        ...body,
        updatedAt: '2026-01-06T00:00:00.000Z',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentUser),
      });
    });

    await page.route(buildApiPattern('/auth/change-password'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password updated successfully',
        }),
      });
    });

    await page.goto('/account', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Said Ait' })).toBeVisible();

    await page.getByLabel('First name').fill('Said');
    await page.getByLabel('Last name').fill('Aitba');
    await page.getByLabel('Occupation').fill('Blue Team Lead');

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/auth/me') &&
          response.request().method() === 'PATCH',
      ),
      page.getByRole('button', { name: 'Save profile' }).click(),
    ]);

    await expect(page.getByText('Profile updated successfully.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Said Aitba' })).toBeVisible();

    await page.getByRole('button', { name: 'Security' }).click();

    await page.getByLabel('Current password', { exact: true }).fill('Password123');
    await page.getByLabel('New password', { exact: true }).fill('NewPassword123');
    await page.getByLabel('Confirm new password', { exact: true }).fill('NewPassword123');

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/auth/change-password') &&
          response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Update password' }).click(),
    ]);

    await expect(page.getByText('Password updated successfully')).toBeVisible();
  });

  // Verifies that client-side validation blocks invalid password changes before the API call.
  test('security form shows validation errors before submitting invalid passwords', async ({
    page,
  }) => {
    let changePasswordRequests = 0;

    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
      window.localStorage.setItem('i18nextLng', 'en');
    }, [TOKEN_KEY]);

    await mockNotifications(page);
    await mockCertificates(page);

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accountUser),
      });
    });

    await page.route(buildApiPattern('/auth/change-password'), async (route) => {
      changePasswordRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password updated successfully',
        }),
      });
    });

    await page.goto('/account', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Said Ait' })).toBeVisible();
    await page.getByRole('button', { name: 'Security' }).click();

    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Current password is required.')).toBeVisible();

    await page.getByPlaceholder('Enter your current password').fill('Password123');
    await page.getByPlaceholder('Enter a new password').fill('Short1');
    await page.getByPlaceholder('Confirm your new password').fill('Short1');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(
      page.getByText('Password must be at least 8 characters'),
    ).toBeVisible();

    await page.getByPlaceholder('Enter a new password').fill('Password123');
    await page.getByPlaceholder('Confirm your new password').fill('Password123');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(
      page.getByText('Your new password must be different from your current password.'),
    ).toBeVisible();

    expect(changePasswordRequests).toBe(0);
  });

  // Verifies that an incorrect current password stays on the account page and shows a field error.
  test('security form shows the current password error without logging the user out', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
      window.localStorage.setItem('i18nextLng', 'en');
    }, [TOKEN_KEY]);

    await mockNotifications(page);
    await mockCertificates(page);

    await page.route(buildApiPattern('/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(accountUser),
      });
    });

    await page.route(buildApiPattern('/auth/change-password'), async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 400,
          message: 'Current password is invalid',
          error: 'Bad Request',
        }),
      });
    });

    await page.goto('/account', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Said Ait' })).toBeVisible();
    await page.getByRole('button', { name: 'Security' }).click();

    await page.getByPlaceholder('Enter your current password').fill('WrongPassword123');
    await page.getByPlaceholder('Enter a new password').fill('NewPassword123');
    await page.getByPlaceholder('Confirm your new password').fill('NewPassword123');
    await page.getByRole('button', { name: 'Update password' }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText('Current password is invalid')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Said Ait' })).toBeVisible();
  });
});
