import { expect, test } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';
const TOKEN_KEY = 'bg_defender_token';
const LOCAL_COVER_IMAGE = '/assets/images/home-bg.png';

const freeUser = {
  id: 10,
  email: 'free@example.com',
  role: 'USER',
  plan: 'FREE',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const publishedCourses = {
  data: [
    {
      id: 'course-free',
      titleEn: 'Blue Team Basics',
      titleFi: 'Blue Team Perusteet',
      descriptionEn: 'Free overview',
      descriptionFi: 'Ilmainen yleiskuva',
      level: 'free',
      status: 'published',
      estimatedDuration: 120,
      coverImage: LOCAL_COVER_IMAGE,
      authors: [],
      chapters: [
        {
          id: 'chapter-1',
          titleEn: 'Introduction',
          titleFi: 'Johdanto',
          descriptionEn: 'Intro',
          descriptionFi: 'Johdanto',
          orderIndex: 1,
          subChapters: [
            {
              id: 'sub-1',
              titleEn: 'First Lesson',
              titleFi: 'Ensimmäinen oppitunti',
              descriptionEn: 'Lesson',
              descriptionFi: 'Oppitunti',
              orderIndex: 1,
              pedagogicalContents: [],
            },
          ],
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'course-premium',
      titleEn: 'Red Team Advanced',
      titleFi: 'Red Team Edistynyt',
      descriptionEn: 'Premium overview',
      descriptionFi: 'Premium yleiskuva',
      level: 'premium',
      status: 'published',
      estimatedDuration: 180,
      coverImage: LOCAL_COVER_IMAGE,
      authors: [],
      chapters: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  count: 2,
};

test.describe('Home progression - E2E tests', () => {
  // Verifies that the authenticated home page surfaces started courses first and uses the resume CTA.
  test('authenticated user sees continue learning with saved progress', async ({
    page,
  }) => {
    await page.addInitScript(([tokenKey]) => {
      window.localStorage.setItem(tokenKey, 'mock-token');
    }, [TOKEN_KEY]);

    await page.route(`${API_BASE}/auth/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(freeUser),
      });
    });

    await page.route(`${API_BASE}/courses*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedCourses),
      });
    });

    await page.route(`${API_BASE}/progress/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'progress-1',
            userId: freeUser.id,
            courseId: 'course-free',
            completionPercentage: 67,
            completed: false,
            completedAt: null,
            lastAccessedAt: '2026-01-03T00:00:00.000Z',
            lastViewedType: 'subchapter',
            lastChapterId: 'chapter-1',
            lastSubChapterId: 'sub-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
        ]),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const continueSection = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Continue Learning' }) });

    await expect(
      continueSection.getByRole('heading', { name: 'Continue Learning' }),
    ).toBeVisible();
    await expect(continueSection.getByText('Blue Team Basics')).toBeVisible();
    await expect(continueSection.getByText('67%')).toBeVisible();
    await expect(continueSection.getByRole('link', { name: 'Resume' })).toBeVisible();
  });
});
