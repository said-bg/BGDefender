import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChapterTrainingQuiz from '../components/ChapterTrainingQuiz';
import courseService from '@/services/course';

jest.mock('@/services/course', () => ({
  __esModule: true,
  default: {
    getChapterQuiz: jest.fn(),
    submitChapterQuizAttempt: jest.fn(),
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

describe('ChapterTrainingQuiz', () => {
  afterEach(() => {
    mockedCourseService.getChapterQuiz.mockReset();
    mockedCourseService.submitChapterQuizAttempt.mockReset();
  });

  it('renders an unavailable state when no quiz is published', async () => {
    mockedCourseService.getChapterQuiz.mockResolvedValue(null);

    render(
      <ChapterTrainingQuiz
        activeLanguage="en"
        chapterId="chapter-1"
        courseId="course-1"
        passingScore={70}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('No training quiz is published for this chapter yet.'),
      ).toBeInTheDocument();
    });
  });

  
  it('submits the learner answers and shows the success state', async () => {
    mockedCourseService.getChapterQuiz.mockResolvedValue({
      id: 'quiz-1',
      chapterId: 'chapter-1',
      titleEn: 'Intro quiz',
      titleFi: 'Intro quiz',
      descriptionEn: 'Quiz description',
      descriptionFi: 'Quiz description',
      passingScore: 70,
      isPublished: true,
      questions: [
        {
          id: 'question-1',
          promptEn: 'Question 1',
          promptFi: 'Question 1',
          explanationEn: 'Because A is correct',
          explanationFi: 'Because A is correct',
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

    mockedCourseService.submitChapterQuizAttempt.mockResolvedValue({
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
      <ChapterTrainingQuiz
        activeLanguage="en"
        chapterId="chapter-1"
        courseId="course-1"
        passingScore={70}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Question 1/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Option A'));
    fireEvent.click(await screen.findByRole('button', { name: 'Submit quiz' }));

    await waitFor(() => {
      expect(mockedCourseService.submitChapterQuizAttempt).toHaveBeenCalledWith(
        'course-1',
        'chapter-1',
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
      screen.getByText('Nice work. You passed this chapter training quiz.'),
    ).toBeInTheDocument();
  });
});

