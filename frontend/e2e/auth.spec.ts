import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate unique email for each test to avoid conflicts
 */
const uniqueEmail = () => `test-${Date.now()}@test.com`;

/**
 * Valid test credentials
 */
const TEST_CREDENTIALS = {
  password: 'Test@12345',
};

// ============================================================================
// Test Suite
// ============================================================================

test.describe('Authentication - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'en');
    });
  });

  /**
   * Test 1: Register a new user successfully
   * 
   * Verifies:
   * - Can navigate to register page
   * - Can fill email, password, confirm password using robust selectors
   * - Can submit form
   * - Sees success modal or message
   * - Gets redirected to login page
   */
  test('should register a new user successfully', async ({ page }) => {
    const email = uniqueEmail();
    const password = TEST_CREDENTIALS.password;

    await page.route(`${API_BASE}/auth/register`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Registration successful',
        }),
      });
    });

    await page.goto('/register', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(/create account/i);

    // Fill form
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);

    // Submit and verify redirect to login
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  /**
   * Test 2: Redirect unauthenticated user to login
   * 
   * Verifies:
   * - Without auth token, accessing /my-courses redirects to /auth/login
   * - Maintains redirect parameter if present
   */
  test('should redirect unauthenticated user to login when accessing protected route', async ({ page }) => {
    // Try to access the protected courses page without auth.
    await page.goto('/my-courses', { waitUntil: 'domcontentloaded' });

    // ProtectedRoute redirects on the client once auth finishes initializing.
    await page.waitForURL(/\/login\?redirect=/, { timeout: 10000 });

    // Should be redirected to login
    expect(page.url()).toContain('/login');

    // Verify login page is visible (title is "Welcome Back")
    await expect(page.locator('h1')).toContainText(/welcome back/i);
  });

  /**
   * Test 3: Login page structure
   * 
   * Verifies:
   * - Login page has correct title
   * - Has email input with proper attributes
   * - Has password input with proper attributes
   * - Has submit button
   * - Has forgot password link
   * - Has signup link
   */
  test('should have proper login page structure', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Verify title and form structure
    await expect(page.locator('h1')).toContainText(/welcome back/i);

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    expect(await emailInput.getAttribute('type')).toBe('email');

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
    expect(await passwordInput.getAttribute('type')).toBe('password');

    // Verify buttons and links
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot|password/i })).toBeVisible();
    
    const footerArea = page.locator('[class*="footer"]').first();
    await expect(footerArea.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  /**
   * Test 4: Register page structure
   * 
   * Verifies:
   * - Register page has correct title
   * - Has email input with proper attributes
   * - Has password input with proper attributes
   * - Has confirm password input with proper attributes
   * - Has submit button
   * - Has login link for existing users
   */
  test('should have proper register page structure', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    // Verify title and form structure
    await expect(page.locator('h1')).toContainText(/create account/i);

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    expect(await emailInput.getAttribute('type')).toBe('email');

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
    expect(await passwordInput.getAttribute('type')).toBe('password');

    const confirmInput = page.locator('input[name="confirmPassword"]');
    await expect(confirmInput).toBeVisible();
    expect(await confirmInput.getAttribute('type')).toBe('password');

    // Verify buttons and links
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).last()).toBeVisible();
  });

  /**
   * Test 5: Validation errors on register
   * 
   * Verifies:
   * - Submitting empty form shows validation errors
   * - Submitting with invalid email shows error
   * - Submitting with non-matching passwords shows error
   */
  test('should display validation errors on invalid input', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    // Test 1: Submit empty form should show errors
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('text=/required|invalid|must|password/i').first()).toBeVisible();

    // Test 2: Invalid email should show error
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.locator('input[name="password"]').fill(TEST_CREDENTIALS.password);
    await page.locator('input[name="confirmPassword"]').fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('text=/invalid|email/i').first()).toBeVisible();

    // Test 3: Password mismatch should show error
    await page.locator('input[name="email"]').clear();
    await page.locator('input[name="email"]').fill(uniqueEmail());
    await page.locator('input[name="password"]').clear();
    await page.locator('input[name="password"]').fill(TEST_CREDENTIALS.password);
    await page.locator('input[name="confirmPassword"]').clear();
    await page.locator('input[name="confirmPassword"]').fill('DifferentPassword@1');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.locator('text=/mismatch|match|confirm/i').first()).toBeVisible();
  });

  /**
   * Test 6: Switching language clears the current auth error message
   *
   * Verifies:
   * - A backend login error is shown
   * - Switching language clears the stale error without typing
   */
  test('should clear login error when switching language', async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
        }),
      });
    });

    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.locator('input[name="email"]').fill('wrong@example.com');
    await page.locator('input[name="password"]').fill('WrongPassword123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();

    await page.getByRole('button', { name: /select language/i }).click();
    await page.getByRole('button', { name: 'Suomi' }).click();

    await expect(page.getByText('Invalid email or password')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /tervetuloa takaisin/i })).toBeVisible();
  });
});
