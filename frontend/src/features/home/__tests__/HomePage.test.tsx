import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import HomePage from '../HomePage';
import { getLearnerHomeStorageKey } from '../lib/home.utils';

const mockUseHomeCourses = jest.fn();

jest.mock('../hooks/useHomeCourses', () => ({
  __esModule: true,
  default: () => mockUseHomeCourses(),
}));

jest.mock('../components/HomeHero', () => ({
  __esModule: true,
  default: ({
    actions,
    description,
    heroTitle,
    highlights,
  }: {
    actions?: { href: string; label: string; secondary?: boolean }[];
    description?: string;
    heroTitle: string;
    highlights?: string[];
  }) => (
    <section data-testid="home-hero">
      <h1>{heroTitle}</h1>
      {description ? <p>{description}</p> : null}
      {actions?.map((action) => (
        <a key={action.href} href={action.href}>
          {action.label}
        </a>
      ))}
      {highlights?.map((highlight) => (
        <span key={highlight}>{highlight}</span>
      ))}
    </section>
  ),
}));

jest.mock('../components/HomeCourseRail', () => ({
  __esModule: true,
  default: ({
    description,
    title,
    children,
  }: {
    description?: string;
    title: string;
    children?: ReactNode;
  }) => (
    <section data-testid={`rail-${title}`}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

jest.mock('../components/HomeCollectionsSection', () => ({
  __esModule: true,
  default: ({
    collections,
    description,
    getCollectionTitle,
    title,
  }: {
    collections: { id: string }[];
    description?: string;
    getCollectionTitle: (collection: { id: string }) => string;
    title: string;
  }) => (
    <section data-testid="collections-section">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {collections.map((collection) => (
        <span key={collection.id}>{getCollectionTitle(collection)}</span>
      ))}
    </section>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) => {
      const values: Record<string, string> = {
        'page.heroTitle': 'Master Cybersecurity Skills for the Real World',
        'page.heroDescription':
          'Learn incident response, cloud security, pentesting, and digital forensics.',
        'page.exploreCourses': 'Explore Courses',
        'page.resumeLearning': 'Resume learning',
        'page.viewPremium': 'View Premium Plans',
        'page.completeProfileCta': 'Complete profile',
        'page.viewCertificatesCta': 'View certificates',
        'page.welcomeEyebrow': 'Your learning space',
        'page.welcomeFirstTitle': `Welcome, ${options?.name ?? ''}`,
        'page.welcomeTitle': `Welcome back, ${options?.name ?? ''}`,
        'page.welcomeFirstDescription': 'Let’s get your learning space ready.',
        'page.welcomeDescription': 'Pick up where you left off.',
        'page.welcomeDescriptionIncomplete': 'Complete your profile to unlock certificates.',
        'page.continueLearning': 'Continue Learning',
        'page.continueLearningDescription': 'Pick up where you left off.',
        'page.noCoursesAvailable': 'No courses available',
        'page.viewAllMyCourses': 'View all my courses',
        'page.collections': 'Collections',
        'page.collectionsDescription':
          'Open themed collections that group related courses into clear learning paths.',
        'page.free': 'Free courses',
        'page.freeDescription': 'Start with free tracks.',
        'page.premium': 'Premium courses',
        'page.premiumDescription': 'Unlock premium tracks.',
        'page.loadingCourses': 'Loading...',
      };

      return values[key] ?? key;
    },
  }),
}));

const createHomeState = (overrides?: Record<string, unknown>) => ({
  courses: {
    inProgress: [],
    free: [],
    premium: [],
    collections: [],
    issuedCertificates: 0,
    pendingCertificates: 0,
    loading: false,
    error: null,
  },
  getCollectionDescription: jest.fn(),
  getCollectionTitle: jest.fn(),
  getCardDescription: jest.fn(),
  getTitle: jest.fn(),
  hasIncompleteProfile: false,
  isAuthenticated: true,
  isLearnerHome: true,
  learnerHomeStorageKey: 'bgd:learner-home-seen:42:2026-04-13T08:00:00.000Z',
  user: {
    id: 42,
    createdAt: '2026-04-13T08:00:00.000Z',
  },
  visibleInProgressCourses: [],
  welcomeName: 'Ait',
  ...overrides,
});

describe('HomePage', () => {
  beforeEach(() => {
    mockUseHomeCourses.mockReset();
    window.localStorage.clear();
  });

  it('shows Welcome on the first learner visit and stores the visit flag', () => {
    const state = createHomeState();
    mockUseHomeCourses.mockReturnValue(state);

    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Welcome, Ait' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(state.learnerHomeStorageKey)).toBe('1');
  });

  it('keeps Welcome on rerender during the first learner visit', () => {
    const state = createHomeState();
    mockUseHomeCourses.mockReturnValue(state);

    const { rerender } = render(<HomePage />);

    rerender(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Welcome, Ait' }),
    ).toBeInTheDocument();
  });

  it('shows Welcome back after the learner home has already been seen', () => {
    const state = createHomeState();
    window.localStorage.setItem(state.learnerHomeStorageKey, '1');
    mockUseHomeCourses.mockReturnValue(state);

    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: 'Welcome back, Ait' }),
    ).toBeInTheDocument();
  });

  it('uses a created-at aware visit key so recreated accounts do not look like returning users', () => {
    expect(
      getLearnerHomeStorageKey({
        id: 42,
        createdAt: '2026-04-13T08:00:00.000Z',
      }),
    ).toBe('bgd:learner-home-seen:42:2026-04-13T08:00:00.000Z');
  });

  it('keeps the learner intro clean without the removed status cards', () => {
    mockUseHomeCourses.mockReturnValue(createHomeState());

    render(<HomePage />);

    expect(screen.queryByText('Courses in progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Certificates earned')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile status')).not.toBeInTheDocument();
  });

  it('renders a single collections section on the learner home', () => {
    const getCollectionTitle = jest.fn(() => 'Incident Response Track');
    const getCollectionDescription = jest.fn(
      () => 'Hand-picked courses from your admin team.',
    );

    mockUseHomeCourses.mockReturnValue(
      createHomeState({
        courses: {
          inProgress: [],
          free: [],
          premium: [],
          collections: [
            {
              id: 'collection-1',
              titleEn: 'Incident Response Track',
              titleFi: 'Incident Response Track',
              descriptionEn: 'Hand-picked courses from your admin team.',
              descriptionFi: 'Hand-picked courses from your admin team.',
              coverImage: null,
              orderIndex: 1,
              isPublished: true,
              courses: [],
              createdAt: '2026-04-10T00:00:00.000Z',
              updatedAt: '2026-04-10T00:00:00.000Z',
            },
          ],
          issuedCertificates: 0,
          pendingCertificates: 0,
          loading: false,
          error: null,
        },
        getCollectionTitle,
        getCollectionDescription,
      }),
    );

    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Collections' })).toBeInTheDocument();
    expect(screen.getByText('Incident Response Track')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Open themed collections that group related courses into clear learning paths.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps free and premium rails visible even when collections exist', () => {
    mockUseHomeCourses.mockReturnValue(
      createHomeState({
        courses: {
          inProgress: [],
          free: [
            {
              id: 'course-free-1',
            },
          ],
          premium: [
            {
              id: 'course-premium-1',
            },
          ],
          collections: [
            {
              id: 'collection-1',
              titleEn: 'Cybersecurity Track',
              titleFi: 'Cybersecurity Track',
              descriptionEn: 'Grouped courses.',
              descriptionFi: 'Grouped courses.',
              coverImage: null,
              orderIndex: 1,
              isPublished: true,
              courses: [],
              createdAt: '2026-04-10T00:00:00.000Z',
              updatedAt: '2026-04-10T00:00:00.000Z',
            },
          ],
          issuedCertificates: 0,
          pendingCertificates: 0,
          loading: false,
          error: null,
        },
        getCollectionTitle: jest.fn(() => 'Cybersecurity Track'),
        getCollectionDescription: jest.fn(() => 'Grouped courses.'),
      }),
    );

    render(<HomePage />);

    expect(
      screen.getByTestId('rail-Free courses'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('rail-Premium courses'),
    ).toBeInTheDocument();
  });
});
