import type { Page } from '@playwright/test';

export const API_BASE = 'http://localhost:3001/api';
export const TOKEN_KEY = 'bg_defender_token';
export const LOCAL_COVER_IMAGE = '/assets/images/home-bg.png';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const buildApiPattern = (path: string) =>
  new RegExp(`(?:https?:\\/\\/[^/]+)?\\/api${escapeRegex(path)}(?:\\?.*)?$`);
const buildApiRoute = buildApiPattern;

export type MockUser = {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  plan: 'FREE' | 'PREMIUM';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MockCourse = {
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

export const freeUser: MockUser = {
  id: 10,
  email: 'free@example.com',
  role: 'USER',
  plan: 'FREE',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const premiumUser: MockUser = {
  ...freeUser,
  id: 11,
  email: 'premium@example.com',
  plan: 'PREMIUM',
};

export const adminUser: MockUser = {
  ...premiumUser,
  id: 12,
  email: 'admin@example.com',
  role: 'ADMIN',
};

export const createCourse = (level: 'free' | 'premium'): MockCourse => ({
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

export async function setEnglishLanguage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'en');
  });
}

export async function setAuthenticatedUser(page: Page) {
  await page.addInitScript(([tokenKey]) => {
    window.localStorage.setItem(tokenKey, 'mock-token');
    window.localStorage.setItem('i18nextLng', 'en');
  }, [TOKEN_KEY]);
}

export async function mockNotifications(page: Page, notifications: Record<string, unknown>[] = []) {
  await page.route(buildApiRoute('/notifications/me'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: notifications,
        unreadCount: notifications.filter((notification) => !notification.isRead).length,
      }),
    });
  });
}

export async function mockCertificates(page: Page, certificates: Record<string, unknown>[] = []) {
  await page.route(buildApiRoute('/certificates/me'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(certificates),
    });
  });
}

export async function mockAuthenticatedSession(page: Page, user?: MockUser) {
  await setAuthenticatedUser(page);
  await mockAuthMe(page, user);
  await mockNotifications(page);
  await mockCertificates(page);
}

export async function mockAuthMe(page: Page, user?: MockUser) {
  await page.route(buildApiRoute('/auth/me'), async (route) => {
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
}

export async function mockCourseDetail(
  page: Page,
  course: MockCourse,
  user?: MockUser,
  storedProgress: Record<string, unknown> | null = null,
) {
  await page.route(buildApiRoute(`/courses/${course.id}`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(course),
    });
  });

  await mockAuthMe(page, user);

  await page.route(buildApiRoute('/favorites/me'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(buildApiRoute(`/progress/me/course/${course.id}`), async (route) => {
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
