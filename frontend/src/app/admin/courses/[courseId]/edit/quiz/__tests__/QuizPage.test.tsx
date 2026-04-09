import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuizPage from '../QuizPage';
import courseService from '@/services/courseService';

jest.mock('@/services/courseService', () => ({
  __esModule: true,
  default: {
    getCourseById: jest.fn(),
    getChapterQuiz: jest.fn(),
    upsertChapterQuiz: jest.fn(),
    deleteChapterQuiz: jest.fn(),
  },
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mockT = (key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en' },
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'course-1' }),
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('QuizPage', () => {
  beforeEach(() => {
    mockedCourseService.getCourseById.mockResolvedValue({
      id: 'course-1',
      titleEn: 'Course EN',
      titleFi: 'Course FI',
      descriptionEn: 'Course description',
      descriptionFi: 'Course description',
      level: 'free',
      status: 'published',
      estimatedDuration: 90,
      coverImage: '/cover.jpg',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      authors: [],
      chapters: [
        {
          id: 'chapter-1',
          titleEn: 'Foundations',
          titleFi: 'Foundations',
          descriptionEn: 'Foundations description',
          descriptionFi: 'Foundations description',
          orderIndex: 1,
          trainingQuiz: null,
          subChapters: [],
        },
        {
          id: 'chapter-2',
          titleEn: 'Applied practice',
          titleFi: 'Applied practice',
          descriptionEn: 'Applied practice description',
          descriptionFi: 'Applied practice description',
          orderIndex: 2,
          trainingQuiz: {
            id: 'quiz-2',
            titleEn: 'Applied practice training quiz',
            titleFi: 'Applied practice training quiz',
            descriptionEn: 'Quiz description',
            descriptionFi: 'Quiz description',
            passingScore: 80,
            isPublished: true,
          },
          subChapters: [],
        },
      ],
    } as Awaited<ReturnType<typeof courseService.getCourseById>>);
  });

  afterEach(() => {
    mockedCourseService.getCourseById.mockReset();
    mockedCourseService.getChapterQuiz.mockReset();
    mockedCourseService.upsertChapterQuiz.mockReset();
    mockedCourseService.deleteChapterQuiz.mockReset();
  });

  it('loads chapter quiz data and switches chapters in the sidebar', async () => {
    mockedCourseService.getChapterQuiz
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'quiz-2',
        chapterId: 'chapter-2',
        titleEn: 'Applied practice training quiz',
        titleFi: 'Applied practice training quiz',
        descriptionEn: 'Quiz description',
        descriptionFi: 'Quiz description',
        passingScore: 80,
        isPublished: true,
        stats: {
          attemptCount: 4,
          bestScore: 100,
        },
        questions: [
          {
            id: 'question-1',
            promptEn: 'Which action fits best?',
            promptFi: 'Which action fits best?',
            explanationEn: 'Because this is the correct path',
            explanationFi: 'Because this is the correct path',
            type: 'single_choice',
            orderIndex: 1,
            options: [
              {
                id: 'option-1',
                labelEn: 'Option A',
                labelFi: 'Option A',
                orderIndex: 1,
                isCorrect: true,
              },
              {
                id: 'option-2',
                labelEn: 'Option B',
                labelFi: 'Option B',
                orderIndex: 2,
                isCorrect: false,
              },
            ],
          },
        ],
      });

    render(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByText('Foundations')).toBeInTheDocument();
      expect(screen.getByText('Applied practice')).toBeInTheDocument();
    });

    expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-1');
    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Foundations training quiz',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /applied practice/i }));

    await waitFor(() => {
      expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-2');
    });

    expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
      'Applied practice training quiz',
    );
    expect(screen.getByLabelText('Passing score (%)')).toHaveValue(80);
    expect(screen.getByText(/4 attempts/i)).toBeInTheDocument();
  });

  it('saves the quiz for the selected chapter', async () => {
    mockedCourseService.getChapterQuiz.mockResolvedValue(null);
    mockedCourseService.upsertChapterQuiz.mockResolvedValue({
      id: 'quiz-1',
      chapterId: 'chapter-1',
      titleEn: 'Foundations mastery quiz',
      titleFi: 'Foundations mastery quiz',
      descriptionEn: 'Updated description',
      descriptionFi: 'Updated description',
      passingScore: 75,
      isPublished: true,
      stats: {
        attemptCount: 0,
        bestScore: null,
      },
      questions: [
        {
          id: 'question-1',
          promptEn: 'Which answer is correct?',
          promptFi: 'Which answer is correct?',
          explanationEn: 'Because option A is right',
          explanationFi: 'Because option A is right',
          type: 'single_choice',
          orderIndex: 1,
          options: [
            {
              id: 'option-1',
              labelEn: 'Option A',
              labelFi: 'Option A',
              orderIndex: 1,
              isCorrect: true,
            },
            {
              id: 'option-2',
              labelEn: 'Option B',
              labelFi: 'Option B',
              orderIndex: 2,
              isCorrect: false,
            },
          ],
        },
      ],
    });

    render(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Foundations training quiz',
      );
    });

    fireEvent.change(screen.getByLabelText('Quiz title (English)'), {
      target: { value: 'Foundations mastery quiz' },
    });
    fireEvent.change(screen.getByLabelText('Passing score (%)'), {
      target: { value: '75' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /make this quiz visible to learners now/i,
      }),
    );
    fireEvent.change(screen.getByLabelText('Prompt (English)'), {
      target: { value: 'Which answer is correct?' },
    });
    const englishOptionInputs = screen.getAllByPlaceholderText('Option (English)');
    const finnishInputs = screen.getAllByPlaceholderText('Option (Finnish)');
    fireEvent.change(englishOptionInputs[0], {
      target: { value: 'Option A' },
    });
    fireEvent.change(finnishInputs[0], { target: { value: 'Option A' } });

    fireEvent.change(englishOptionInputs[1], { target: { value: 'Option B' } });
    fireEvent.change(finnishInputs[1], { target: { value: 'Option B' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save quiz' }));

    await waitFor(() => {
      expect(mockedCourseService.upsertChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-1', {
        titleEn: 'Foundations mastery quiz',
        titleFi: 'Foundations training quiz',
        descriptionEn: null,
        descriptionFi: null,
        passingScore: 75,
        isPublished: true,
        questions: [
          {
            promptEn: 'Which answer is correct?',
            promptFi: '',
            explanationEn: null,
            explanationFi: null,
            type: 'single_choice',
            orderIndex: 1,
            options: [
              {
                labelEn: 'Option A',
                labelFi: 'Option A',
                isCorrect: true,
                orderIndex: 1,
              },
              {
                labelEn: 'Option B',
                labelFi: 'Option B',
                isCorrect: false,
                orderIndex: 2,
              },
            ],
          },
        ],
      });
    });

    expect(screen.getByText('Training quiz saved successfully.')).toBeInTheDocument();
  });
});
