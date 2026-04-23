import { expect, test } from '@playwright/test';
import {
  buildApiPattern,
  createCourse,
  freeUser,
  mockCertificates,
  mockCourseDetail,
  mockNotifications,
  premiumUser,
  setAuthenticatedUser,
  setEnglishLanguage,
} from './support/courseFixtures';

test.describe('Course detail - E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLanguage(page);
  });

  test('visitor can view the overview but gets a login prompt on locked content', async ({
    page,
  }) => {
    const course = createCourse('free');
    await mockCourseDetail(page, course);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: course.titleEn })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('Public overview for the free course.'),
    ).toBeVisible();

    await page.getByRole('button', { name: /introduction/i }).click();

    await expect(
      page.getByText('Please login to open the detailed learning content.'),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('link', { name: 'login', exact: true }),
    ).toHaveAttribute('href', `/login?redirect=%2Fcourses%2F${course.id}`);
  });

  test('free user can access free course content and navigate with next', async ({ page }) => {
    const course = createCourse('free');
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, freeUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();
    await expect(page.getByRole('main').getByText('free chapter description').first()).toBeVisible();

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();
    await expect(page.getByRole('main').getByText('free content paragraph 1.')).toBeVisible();
  });

  test('reader can hide and restore the course outline', async ({ page }) => {
    const course = createCourse('free');
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, freeUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    // The outline can be hidden to give long lessons more reading space.
    await page.getByRole('button', { name: /hide course outline/i }).click();
    await expect(page.getByRole('button', { name: /introduction/i })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    await page.getByRole('button', { name: /show course outline/i }).click();
    await expect(page.getByRole('button', { name: /introduction/i })).toBeVisible();
  });

  test('free user sees premium access message on premium course content', async ({ page }) => {
    const course = createCourse('premium');
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, freeUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /introduction/i }).click();

    await expect(
      page.getByText(
        'This content is part of the premium plan. Please contact the team for access.',
      ),
    ).toBeVisible();
  });

  test('premium user can access premium course content', async ({ page }) => {
    const course = createCourse('premium');
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, premiumUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();
    await expect(page.getByRole('main').getByText('premium content paragraph 1.')).toBeVisible();
  });

  test('authenticated user resumes the course from saved progress', async ({ page }) => {
    const course = createCourse('free');
    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, freeUser, {
      id: 'progress-restore',
      userId: freeUser.id,
      courseId: course.id,
      completionPercentage: 67,
      completed: false,
      completedAt: null,
      lastAccessedAt: '2026-01-02T00:00:00.000Z',
      lastViewedType: 'subchapter',
      lastChapterId: 'chapter-free-1',
      lastSubChapterId: 'sub-free-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();
    await expect(page.getByRole('main').getByText('free content paragraph 1.')).toBeVisible();
  });

  test('completed course keeps a full progress value while being reviewed again', async ({
    page,
  }) => {
    const course = createCourse('free');
    let lastSavedPayload: Record<string, unknown> | null = null;

    await setAuthenticatedUser(page);
    await mockNotifications(page);
    await mockCertificates(page);
    await mockCourseDetail(page, course, freeUser, {
      id: 'progress-complete',
      userId: freeUser.id,
      courseId: course.id,
      completionPercentage: 100,
      completed: true,
      completedAt: '2026-01-02T00:00:00.000Z',
      lastAccessedAt: '2026-01-02T00:00:00.000Z',
      lastViewedType: 'subchapter',
      lastChapterId: 'chapter-free-1',
      lastSubChapterId: 'sub-free-1',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    await page.unroute(buildApiPattern(`/progress/me/course/${course.id}`));
    await page.route(buildApiPattern(`/progress/me/course/${course.id}`), async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'progress-complete',
            userId: freeUser.id,
            courseId: course.id,
            completionPercentage: 100,
            completed: true,
            completedAt: '2026-01-02T00:00:00.000Z',
            lastAccessedAt: '2026-01-02T00:00:00.000Z',
            lastViewedType: 'subchapter',
            lastChapterId: 'chapter-free-1',
            lastSubChapterId: 'sub-free-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          }),
        });
        return;
      }

      lastSavedPayload = route.request().postDataJSON() as Record<string, unknown>;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'progress-complete',
          userId: freeUser.id,
          courseId: course.id,
          completed: true,
          completedAt: '2026-01-02T00:00:00.000Z',
          lastAccessedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
          ...lastSavedPayload,
        }),
      });
    });

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/progress/me/course/${course.id}`) &&
          response.request().method() === 'PUT',
      ),
      page.getByRole('button', { name: /introduction/i }).click(),
    ]);

    expect(lastSavedPayload?.completionPercentage).toBe(100);
  });
});
