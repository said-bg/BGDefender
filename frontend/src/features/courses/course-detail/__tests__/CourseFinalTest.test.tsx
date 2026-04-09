import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CourseFinalTest from '../components/CourseFinalTest';
import courseService from '@/services/courseService';

jest.mock('@/services/courseService', () => ({
  __esModule: true,
  default: {
    getCourseFinalTest: jest.fn(),
    submitCourseFinalTestAttempt: jest.fn(),
  },
}));

const mockT = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('CourseFinalTest', () => {
  afterEach(() => {
    mockedCourseService.getCourseFinalTest.mockReset();
    mockedCourseService.submitCourseFinalTestAttempt.mockReset();
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
  });
});
