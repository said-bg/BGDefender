import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import CourseAnalyticsPage from '../CourseAnalyticsPage';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'reviewOwnerLabel') {
        return `Owned by ${params?.owner ?? ''}`;
      }

      const dictionary: Record<string, string> = {
        'edit.analytics.title': 'Course analytics',
        'edit.analytics.subtitle': 'Review learning signals for this course.',
        'edit.analytics.overviewTitle': 'Overview',
        'edit.analytics.overviewDescription': 'Top-level learner progress.',
        'edit.analytics.finalTestTitle': 'Final test analytics',
        'edit.analytics.finalTestDescription': 'How the final test is performing.',
        'edit.analytics.openFinalTestEditor': 'Open final test editor',
        'edit.analytics.trainingQuizTitle': 'Training quiz analytics',
        'edit.analytics.trainingQuizDescription': 'How chapter quizzes are performing.',
        'edit.analytics.chapterLabel': `Chapter ${params?.index ?? ''}`,
        'edit.analytics.openQuizEditor': 'Open quiz editor',
        'edit.analytics.noQuizTitle': 'No quiz yet',
        'edit.analytics.noQuizDescription': 'Add a quiz to gather learner data.',
        'edit.analytics.noFinalTestTitle': 'No final test yet',
        'edit.analytics.noFinalTestDescription': 'Add a final test to gather learner data.',
        'edit.quiz.analyticsEmptyTitle': 'No learner attempts yet',
        'edit.quiz.analyticsEmptyDescription': 'Learner analytics will appear here later.',
        'edit.missingCourseId': 'Missing course id',
      };

      return dictionary[key] ?? key;
    },
  }),
}));

jest.mock(
  '@/features/admin/courses/edit-course/shared/EditCourseShared',
  () => ({
    EditCourseProtected: ({ children }: { children: ReactNode }) => <>{children}</>,
    EditCourseLoadingState: () => <div>Loading course analytics...</div>,
    EditCourseErrorState: ({ message }: { message: string }) => <div>{message}</div>,
    EditCourseShell: ({
      children,
      title,
      courseTitle,
    }: {
      children: ReactNode;
      title: string;
      courseTitle: string;
    }) => (
      <section>
        <h1>{title}</h1>
        <p>{courseTitle}</p>
        {children}
      </section>
    ),
  }),
);

jest.mock('@/features/creator/dashboard/CreatorLearningMetrics', () => ({
  __esModule: true,
  default: ({ summary }: { summary: { learnersStarted: number } | null }) => (
    <div>Overview metrics: {summary?.learnersStarted ?? 0}</div>
  ),
}));

jest.mock(
  '@/features/admin/courses/edit-course/quiz/components/QuizAnalyticsPanel',
  () => ({
    __esModule: true,
    default: ({ title }: { title: string }) => <div>{title}</div>,
  }),
);

jest.mock('../useCourseAnalyticsPage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useCourseAnalyticsPageMock = jest.requireMock('../useCourseAnalyticsPage').default as jest.Mock;

describe('CourseAnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders course overview, final test analytics and chapter quiz analytics', () => {
    useCourseAnalyticsPageMock.mockReturnValue({
      analyticsError: null,
      analyticsLoading: false,
      chapterAnalytics: [
        {
          chapter: {
            id: 'chapter-1',
            titleEn: 'Introduction',
            titleFi: 'Johdanto',
            trainingQuiz: {
              titleEn: 'Intro quiz',
              titleFi: 'Johdantovisa',
            },
          },
          analytics: {
            summary: {
              learnerCount: 2,
              attemptCount: 3,
              averageScore: 84,
              passRate: 100,
              bestScore: 100,
              latestAttemptAt: '2026-01-01T00:00:00.000Z',
            },
            learners: [],
          },
        },
      ],
      course: {
        id: 'course-1',
        titleEn: 'Threat Hunting Basics',
        titleFi: 'Uhkametsastyksen perusteet',
        learningSummary: {
          learnersStarted: 4,
          learnersCompleted: 2,
          averageProgressPercentage: 67,
          finalTestPassRate: 50,
          finalTestAttemptCount: 2,
        },
        finalTests: [
          {
            titleEn: 'Final assessment',
            titleFi: 'Lopputesti',
          },
        ],
      },
      courseId: 'course-1',
      finalTestAnalytics: {
        summary: {
          learnerCount: 2,
          attemptCount: 2,
          averageScore: 90,
          passRate: 50,
          bestScore: 100,
          latestAttemptAt: '2026-01-01T00:00:00.000Z',
        },
        learners: [],
      },
      loadError: null,
      loadingPage: false,
      localizedCourseTitle: 'Threat Hunting Basics',
    });

    render(<CourseAnalyticsPage />);

    expect(
      screen.getByRole('heading', { name: 'Course analytics' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Threat Hunting Basics')).toBeInTheDocument();
    expect(screen.getByText('Overview metrics: 4')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open final test editor' }),
    ).toHaveAttribute('href', '/en/admin/courses/course-1/edit/final-test');
    expect(screen.getByText('Final assessment')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getAllByText('Intro quiz')).toHaveLength(2);
  });

  it('shows the loading state while analytics are being fetched', () => {
    useCourseAnalyticsPageMock.mockReturnValue({
      loadingPage: true,
    });

    render(<CourseAnalyticsPage />);

    expect(screen.getByText('Loading course analytics...')).toBeInTheDocument();
  });
});
