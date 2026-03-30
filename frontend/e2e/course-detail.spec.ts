import { expect, Page, test } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TOKEN_KEY = 'bg_defender_token';
const LOCAL_COVER_IMAGE = '/assets/images/home-bg.png';

type MockUser = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  plan: 'FREE' | 'PREMIUM';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type MockCourse = {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string;
  descriptionFi: string;
  level: 'free' | 'premium';
  status: string;
  estimatedDuration: number;
  coverImage: string;
  authors: Array<{
    id: string;
    name: string;
    roleEn?: string;
    roleFi?: string;
    photo?: string;
  }>;
  chapters: Array<{
    id: string;
    titleEn: string;
    titleFi: string;
    descriptionEn: string;
    descriptionFi: string;
    orderIndex: number;
    subChapters: Array<{
      id: string;
      titleEn: string;
      titleFi: string;
      descriptionEn: string;
      descriptionFi: string;
      orderIndex: number;
      pedagogicalContents: Array<{
        id: string;
        titleEn: string;
        titleFi: string;
        type: string;
        contentEn: string | null;
        contentFi: string | null;
        url: string | null;
        orderIndex: number;
      }>;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
};

const freeUser: MockUser = {
  id: 10,
  email: 'free@example.com',
  role: 'USER',
  plan: 'FREE',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const premiumUser: MockUser = {
  ...freeUser,
  id: 11,
  email: 'premium@example.com',
  plan: 'PREMIUM',
};

const createCourse = (level: 'free' | 'premium'): MockCourse => ({
  id: `course-${level}`,
  titleEn: level === 'free' ? 'Blue Team Basics' : 'Red Team Advanced',
  titleFi: level === 'free' ? 'Blue Team Perusteet' : 'Red Team Edistynyt',
  descriptionEn: `Public overview for the ${level} course.`,
  descriptionFi: `${level} kurssin yleiskuvaus.`,
  level,
  status: 'published',
  estimatedDuration: 120,
  coverImage: LOCAL_COVER_IMAGE,
  authors: [
    {
      id: 'author-1',
      name: 'Alex Johnson',
      roleEn: 'Cybersecurity Instructor',
      roleFi: 'Kyberturvallisuuden kouluttaja',
    },
  ],
  chapters: [
    {
      id: `chapter-${level}-1`,
      titleEn: 'Introduction',
      titleFi: 'Johdanto',
      descriptionEn: `${level} chapter description`,
      descriptionFi: `${level} luvun kuvaus`,
      orderIndex: 1,
      subChapters: [
        {
          id: `sub-${level}-1`,
          titleEn: 'First Lesson',
          titleFi: 'Ensimmainen oppitunti',
          descriptionEn: `${level} subchapter description`,
          descriptionFi: `${level} alaluvun kuvaus`,
          orderIndex: 1,
          pedagogicalContents: [
            {
              id: `content-${level}-1`,
              titleEn: 'Lesson Content',
              titleFi: 'Oppitunnin sisalto',
              type: 'text',
              contentEn: `${level} content paragraph 1.\n\n${level} content paragraph 2.`,
              contentFi: `${level} sisalto 1.\n\n${level} sisalto 2.`,
              url: null,
              orderIndex: 1,
            },
          ],
        },
      ],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

async function mockCourseDetail(
  page: Page,
  course: MockCourse,
  user?: MockUser,
  storedProgress: Record<string, unknown> | null = null,
) {
  await page.route(`${API_BASE}/courses/${course.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(course),
    });
  });

  await page.route(`${API_BASE}/auth/me`, async (route) => {
    if (!user) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  await page.route(`${API_BASE}/favorites/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(`${API_BASE}/progress/me/course/${course.id}`, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(storedProgress),
      });
      return;
    }

    if (method === 'PUT') {
      const requestBody = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'progress-1',
          userId: user?.id ?? 0,
          courseId: course.id,
          completed: requestBody.completionPercentage === 100,
          completedAt:
            requestBody.completionPercentage === 100
              ? '2026-01-02T00:00:00.000Z'
              : null,
          lastAccessedAt: '2026-01-02T00:00:00.000Z',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          ...requestBody,
        }),
      });
      return;
    }

    await route.fallback();
  });
}

async function setAuthenticatedUser(page: Page) {
  await page.addInitScript(([tokenKey]) => {
    window.localStorage.setItem(tokenKey, 'mock-token');
    window.localStorage.setItem('i18nextLng', 'en');
  }, [TOKEN_KEY]);
}

test.describe('Course detail - E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'en');
    });
  });

  // Verifies the public flow: overview stays visible, but opening the learning path requires login.
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
    ).toHaveAttribute('href', '/auth/login');
  });

  // Verifies that a free authenticated user can move through a free course and read its content.
  test('free user can access free course content and navigate with next', async ({
    page,
  }) => {
    const course = createCourse('free');
    await setAuthenticatedUser(page);
    await mockCourseDetail(page, course, freeUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('free chapter description').first(),
    ).toBeVisible();

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('free content paragraph 1.'),
    ).toBeVisible();
  });

  // Verifies that a free authenticated user can discover a premium course but still gets blocked on the detailed content.
  test('free user sees premium access message on premium course content', async ({
    page,
  }) => {
    const course = createCourse('premium');
    await setAuthenticatedUser(page);
    await mockCourseDetail(page, course, freeUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /introduction/i }).click();

    await expect(
      page.getByText(
        'This content is part of the premium plan. Please contact the team for access.',
      ),
    ).toBeVisible();
  });

  // Verifies that a premium authenticated user can open the same premium course and read the real learning content.
  test('premium user can access premium course content', async ({ page }) => {
    const course = createCourse('premium');
    await setAuthenticatedUser(page);
    await mockCourseDetail(page, course, premiumUser);

    await page.goto(`/courses/${course.id}`, { waitUntil: 'domcontentloaded' });

    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('main').getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'First Lesson' })).toBeVisible();
    await expect(
      page.getByRole('main').getByText('premium content paragraph 1.'),
    ).toBeVisible();
  });

  // Verifies that a saved progress row restores the course directly on the last viewed lesson.
  test('authenticated user resumes the course from saved progress', async ({
    page,
  }) => {
    const course = createCourse('free');
    await setAuthenticatedUser(page);
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
    await expect(
      page.getByRole('main').getByText('free content paragraph 1.'),
    ).toBeVisible();
  });

  // Verifies that reopening a completed course never pushes the saved percentage back below 100%.
  test('completed course keeps a full progress value while being reviewed again', async ({
    page,
  }) => {
    const course = createCourse('free');
    let lastSavedPayload: Record<string, unknown> | null = null;

    await setAuthenticatedUser(page);
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

    await page.unroute(`${API_BASE}/progress/me/course/${course.id}`);
    await page.route(`${API_BASE}/progress/me/course/${course.id}`, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
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
          response.url() === `${API_BASE}/progress/me/course/${course.id}` &&
          response.request().method() === 'PUT',
      ),
      page.getByRole('button', { name: /introduction/i }).click(),
    ]);

    expect(lastSavedPayload?.completionPercentage).toBe(100);
  });
});
