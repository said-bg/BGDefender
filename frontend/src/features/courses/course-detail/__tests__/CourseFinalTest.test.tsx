import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import CourseFinalTest from '../components/CourseFinalTest';
import courseService from '@/services/course';

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

jest.mock('@/services/course', () => ({
  __esModule: true,
  default: {
    getCourseFinalTest: jest.fn(),
    submitCourseFinalTestAttempt: jest.fn(),
  },
}));

const courseTranslations: Record<string, string> = {
  'detail.finalTestLockedDescription':
    'Complete every chapter in this course to unlock the final test.',
  'detail.finalTestStart': 'Start final test',
  'detail.finalTestSubmit': 'Submit final test',
  'detail.finalTestSubmitting': 'Submitting final test...',
  'detail.finalTestRetry': 'Clear answers',
  'detail.finalTestStartRetry': 'Retry final test',
  'detail.finalTestUnlockedDescription': 'The final test is ready when you are.',
  'detail.finalTestPassedMessage': 'Excellent work. You passed the course final test.',
  'detail.finalTestFailedSummary': 'Your latest final test result is saved.',
  'detail.previewFinalTestPassedMessage':
    'Preview complete. This final test attempt would pass, and nothing was saved.',
  'detail.previewFinalTestFailedMessage':
    'Preview complete. This final test attempt would not pass, and nothing was saved.',
  'detail.certificatePendingTitle': 'Certificate waiting for profile completion',
  'detail.completeProfile': 'Complete profile',
  'detail.viewCertificate': 'View certificates',
  'detail.finalTestPassingScore': 'Passing score',
  'detail.finalTestAnswered': 'Answered',
  'detail.finalTestBestScore': 'Best score',
  'detail.finalTestLatestScore': 'Latest score',
  'detail.finalTestCorrectAnswers': 'Correct answers',
  'detail.finalTestCourseStatus': 'Course status',
  'detail.finalTestCourseCompleted': 'Course completed',
  'detail.finalTestRetryNeeded': 'Retry available',
  'detail.finalTestPassed': 'Passed',
  'detail.finalTestNotPassed': 'Not passed',
  'detail.finalTest': 'Final test',
  'detail.finalTestLocked': 'Locked',
  'detail.previewModeFinalTestDescription': 'Preview mode',
};

const mockT = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? courseTranslations[key] ?? key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('CourseFinalTest', () => {
  const scrollIntoViewMock = jest.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
      writable: true,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: scrollIntoViewMock,
      writable: true,
    });
  });

  afterEach(() => {
    mockedCourseService.getCourseFinalTest.mockReset();
    mockedCourseService.submitCourseFinalTestAttempt.mockReset();
    scrollIntoViewMock.mockClear();
  });

  it('renders a locked state until the course is completed', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue({
      id: 'final-test-1',
      courseId: 'course-1',
      titleEn: 'Course final test',
      titleFi: 'Course final test',
      descriptionEn: 'Final test description',
      descriptionFi: 'Final test description',
      passingScore: 70,
      isPublished: true,
      isUnlocked: false,
      questions: [],
      latestAttempt: null,
      bestAttempt: null,
      certificate: null,
    });

    render(
      <CourseFinalTest
        activeLanguage="en"
        courseId="course-1"
        enabled
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Complete every chapter in this course to unlock the final test.'),
      ).toBeInTheDocument();
    });
  });

  it('starts and submits the final test once unlocked', async () => {
    mockedCourseService.getCourseFinalTest
      .mockResolvedValueOnce({
        id: 'final-test-1',
        courseId: 'course-1',
        titleEn: 'Course final test',
        titleFi: 'Course final test',
        descriptionEn: 'Final test description',
        descriptionFi: 'Final test description',
        passingScore: 70,
        isPublished: true,
        isUnlocked: true,
        questions: [
          {
            id: 'question-1',
            promptEn: 'Final question 1',
            promptFi: 'Final question 1',
            explanationEn: 'Because option A is correct',
            explanationFi: 'Because option A is correct',
            type: 'single_choice',
            orderIndex: 1,
            options: [
              {
                id: 'option-a',
                labelEn: 'Option A',
                labelFi: 'Option A',
                orderIndex: 1,
              },
              {
                id: 'option-b',
                labelEn: 'Option B',
                labelFi: 'Option B',
                orderIndex: 2,
              },
            ],
          },
        ],
        latestAttempt: null,
        bestAttempt: null,
        certificate: null,
      })
      .mockResolvedValueOnce({
        id: 'final-test-1',
        courseId: 'course-1',
        titleEn: 'Course final test',
        titleFi: 'Course final test',
        descriptionEn: 'Final test description',
        descriptionFi: 'Final test description',
        passingScore: 70,
        isPublished: true,
        isUnlocked: true,
        questions: [
          {
            id: 'question-1',
            promptEn: 'Final question 1',
            promptFi: 'Final question 1',
            explanationEn: 'Because option A is correct',
            explanationFi: 'Because option A is correct',
            type: 'single_choice',
            orderIndex: 1,
            options: [
              {
                id: 'option-a',
                labelEn: 'Option A',
                labelFi: 'Option A',
                orderIndex: 1,
              },
              {
                id: 'option-b',
                labelEn: 'Option B',
                labelFi: 'Option B',
                orderIndex: 2,
              },
            ],
          },
        ],
        latestAttempt: {
          id: 'attempt-1',
          totalQuestions: 1,
          correctAnswers: 1,
          score: 100,
          passed: true,
          submittedAt: '2026-04-09T10:00:00.000Z',
        },
        bestAttempt: {
          id: 'attempt-1',
          totalQuestions: 1,
          correctAnswers: 1,
          score: 100,
          passed: true,
          submittedAt: '2026-04-09T10:00:00.000Z',
        },
        certificate: {
          id: 'certificate-1',
          status: 'issued',
          issuedAt: '2026-04-09T10:00:00.000Z',
        },
      });

    mockedCourseService.submitCourseFinalTestAttempt.mockResolvedValue({
      attempt: {
        id: 'attempt-1',
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: '2026-04-09T10:00:00.000Z',
      },
      latestAttempt: {
        id: 'attempt-1',
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: '2026-04-09T10:00:00.000Z',
      },
      bestAttempt: {
        id: 'attempt-1',
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: '2026-04-09T10:00:00.000Z',
      },
      answers: [
        {
          questionId: 'question-1',
          selectedOptionIds: ['option-a'],
          correctOptionIds: ['option-a'],
          isCorrect: true,
        },
      ],
    });

    render(
      <CourseFinalTest
        activeLanguage="en"
        courseId="course-1"
        enabled
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start final test' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start final test' }));

    await waitFor(() => {
      expect(screen.getByText(/Final question 1/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Option A'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit final test' }));

    await waitFor(() => {
      expect(mockedCourseService.submitCourseFinalTestAttempt).toHaveBeenCalledWith(
        'course-1',
        {
          answers: [
            {
              questionId: 'question-1',
              selectedOptionIds: ['option-a'],
            },
          ],
        },
      );
    });

    expect(
      screen.getByText('Excellent work. You passed the course final test.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Latest score')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View certificates' })).toBeInTheDocument();
    expect(screen.queryByText(/Final question 1/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry final test' })).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('shows a profile completion prompt when the certificate is pending', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue({
      id: 'final-test-1',
      courseId: 'course-1',
      titleEn: 'Course final test',
      titleFi: 'Course final test',
      descriptionEn: 'Final test description',
      descriptionFi: 'Final test description',
      passingScore: 70,
      isPublished: true,
      isUnlocked: true,
      questions: [],
      latestAttempt: {
        id: 'attempt-2',
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: '2026-04-09T11:00:00.000Z',
      },
      bestAttempt: {
        id: 'attempt-2',
        totalQuestions: 1,
        correctAnswers: 1,
        score: 100,
        passed: true,
        submittedAt: '2026-04-09T11:00:00.000Z',
      },
      certificate: {
        id: 'certificate-2',
        status: 'pending_profile',
        issuedAt: null,
      },
    });

    render(
      <CourseFinalTest
        activeLanguage="en"
        courseId="course-1"
        enabled
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Certificate waiting for profile completion'),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Complete profile' })).toBeInTheDocument();
  });

  it('simulates preview final test submission locally without saving attempts', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue({
      id: 'final-test-1',
      courseId: 'course-1',
      titleEn: 'Draft final test',
      titleFi: 'Draft final test',
      descriptionEn: 'Draft description',
      descriptionFi: 'Draft description',
      passingScore: 70,
      isPublished: false,
      stats: {
        attemptCount: 0,
        latestAttemptAt: null,
        bestScore: null,
      },
      questions: [
        {
          id: 'question-1',
          promptEn: 'Preview question 1',
          promptFi: 'Preview question 1',
          explanationEn: 'Preview final explanation',
          explanationFi: 'Preview final explanation',
          type: 'single_choice',
          orderIndex: 1,
          options: [
            {
              id: 'option-a',
              labelEn: 'Option A',
              labelFi: 'Option A',
              orderIndex: 1,
              isCorrect: true,
            },
          ],
        },
      ],
    });

    render(
      <CourseFinalTest
        activeLanguage="en"
        courseId="course-1"
        enabled
        previewMode
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Preview question 1/)).toBeInTheDocument();
    });

    expect(
      screen.queryByText('Complete every chapter in this course to unlock the final test.'),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Option A'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit final test' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Preview complete. This final test attempt would pass, and nothing was saved.',
        ),
      ).toBeInTheDocument();
    });

    expect(mockedCourseService.submitCourseFinalTestAttempt).not.toHaveBeenCalled();
    expect(screen.getByText('Preview final explanation')).toBeInTheDocument();
    expect(screen.getByText('Latest score')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry final test' }));
    expect(screen.getByRole('button', { name: 'Clear answers' })).toBeInTheDocument();
  });
});

