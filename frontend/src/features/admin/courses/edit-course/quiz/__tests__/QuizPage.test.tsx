import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuizPage from '../QuizPage';
import courseService from '@/services/course';

jest.mock('@/services/course', () => ({
  __esModule: true,
  default: {
    getAdminCourseById: jest.fn(),
    getCourseById: jest.fn(),
    getChapterQuiz: jest.fn(),
    getChapterQuizAnalytics: jest.fn(),
    upsertChapterQuiz: jest.fn(),
    deleteChapterQuiz: jest.fn(),
  },
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const TRANSLATIONS: Record<string, string> = {
  'common.cancel': 'Cancel',
  'edit.tabs.quiz': 'Training quiz',
  'edit.tabs.details': 'Course details',
  'edit.tabs.structure': 'Structure',
  'edit.tabs.content': 'Content',
  'edit.tabs.finalTest': 'Final test',
  'edit.quiz.subtitle':
    'Attach one scored training quiz to each chapter. These quizzes can include single-choice and multiple-choice questions with a passing percentage.',
  'edit.quiz.title': 'Chapter training quizzes',
  'edit.quiz.description':
    'Pick a chapter on the left, then create or update the scored training quiz learners will see at the end of that chapter.',
  'edit.quiz.chapterListTitle': 'Chapters',
  'edit.quiz.chapterListDescription': 'Choose the chapter whose training quiz you want to manage.',
  'edit.chapters.orderLabel': 'Chapter',
  'edit.quiz.statusEmpty': 'No quiz yet',
  'edit.quiz.notConfigured': 'Not configured',
  'edit.quiz.statusPublished': 'Published',
  'edit.quiz.quizReady': 'Quiz ready',
  'edit.quiz.editorTitle': 'Training quiz editor',
  'edit.quiz.editorDescription':
    'Configure the scored quiz for the selected chapter, including the pass percentage and the full question set.',
  'edit.quiz.titleEn': 'Quiz title (English)',
  'edit.quiz.titleFi': 'Quiz title (Finnish)',
  'edit.quiz.descriptionEn': 'Description (English)',
  'edit.quiz.descriptionFi': 'Description (Finnish)',
  'edit.quiz.passingScore': 'Passing score (%)',
  'edit.quiz.publishNow': 'Make this quiz visible to learners now',
  'edit.quiz.questionsTitle': 'Questions',
  'edit.quiz.addQuestion': 'Add question',
  'edit.quiz.questionLabel': 'Question',
  'edit.quiz.untitledQuestion': 'Untitled question',
  'edit.quiz.promptEn': 'Prompt (English)',
  'edit.quiz.promptFi': 'Prompt (Finnish)',
  'edit.quiz.explanationEn': 'Explanation (English)',
  'edit.quiz.explanationFi': 'Explanation (Finnish)',
  'edit.quiz.questionType': 'Question type',
  'edit.quiz.singleChoice': 'Single choice',
  'edit.quiz.multipleChoice': 'Multiple choice',
  'edit.quiz.optionsTitle': 'Answer options',
  'edit.quiz.addOption': 'Add option',
  'edit.quiz.correctAnswer': 'Correct',
  'edit.quiz.optionEn': 'Option (English)',
  'edit.quiz.optionFi': 'Option (Finnish)',
  'edit.quiz.deleteQuestion': 'Delete question',
  'edit.quiz.saveQuiz': 'Save quiz',
  'edit.quiz.saved': 'Training quiz saved successfully.',
  'edit.quiz.analyticsTitle': 'Learner quiz analytics',
  'edit.quiz.analyticsOpenDetails': 'View learner analytics',
};

const mockT = (key: string, options?: { defaultValue?: string }) =>
  TRANSLATIONS[key] ?? options?.defaultValue ?? key;

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

const navigationState = {
  searchParams: '',
};

jest.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'course-1' }),
  usePathname: () => '/admin/courses/course-1/edit/quiz',
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(navigationState.searchParams),
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('QuizPage', () => {
  beforeEach(() => {
    navigationState.searchParams = '';
    mockedCourseService.getAdminCourseById.mockResolvedValue({
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
    } as Awaited<ReturnType<typeof courseService.getAdminCourseById>>);
  });

  afterEach(() => {
    mockedCourseService.getAdminCourseById.mockReset();
    mockedCourseService.getCourseById.mockReset();
    mockedCourseService.getChapterQuiz.mockReset();
    mockedCourseService.getChapterQuizAnalytics.mockReset();
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
          latestAttemptAt: '2026-01-03T10:00:00.000Z',
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
    mockedCourseService.getChapterQuizAnalytics
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        quizId: 'quiz-2',
        chapterId: 'chapter-2',
        summary: {
          learnerCount: 2,
          attemptCount: 4,
          latestAttemptAt: '2026-01-03T10:00:00.000Z',
          bestScore: 100,
          averageScore: 78,
          passRate: 50,
        },
        learners: [
          {
            userId: 12,
            email: 'user@example.com',
            firstName: 'User',
            lastName: 'Example',
            attemptCount: 3,
            latestScore: 60,
            bestScore: 100,
            hasPassed: true,
            latestAttemptAt: '2026-01-03T10:00:00.000Z',
          },
        ],
      });

    render(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByText('Foundations')).toBeInTheDocument();
      expect(screen.getByText('Applied practice')).toBeInTheDocument();
    });

    expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-1');
    expect(mockedCourseService.getChapterQuizAnalytics).toHaveBeenCalledWith(
      'course-1',
      'chapter-1',
    );
    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Foundations training quiz',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /applied practice/i }));

    await waitFor(() => {
      expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-2');
      expect(mockedCourseService.getChapterQuizAnalytics).toHaveBeenCalledWith(
        'course-1',
        'chapter-2',
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Applied practice training quiz',
      );
      expect(screen.getByLabelText('Passing score (%)')).toHaveValue(80);
    });

    expect(
      screen.getByRole('button', { name: /view learner analytics/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Learner quiz analytics' }),
    ).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('keeps the clicked chapter selection while the url is catching up', async () => {
    navigationState.searchParams = 'chapter=chapter-2';
    mockedCourseService.getChapterQuiz
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
          latestAttemptAt: '2026-01-03T10:00:00.000Z',
          bestScore: 100,
        },
        questions: [],
      })
      .mockResolvedValueOnce(null);
    mockedCourseService.getChapterQuizAnalytics.mockResolvedValue(null);

    render(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Applied practice training quiz',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /foundations/i }));

    await waitFor(() => {
      expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledWith('course-1', 'chapter-1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Foundations training quiz',
      );
    });
  });

  it('does not reload the full course when only the chapter query changes', async () => {
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
          latestAttemptAt: '2026-01-03T10:00:00.000Z',
          bestScore: 100,
        },
        questions: [],
      });
    mockedCourseService.getChapterQuizAnalytics.mockResolvedValue(null);

    const { rerender } = render(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Foundations training quiz',
      );
    });

    expect(mockedCourseService.getAdminCourseById).toHaveBeenCalledTimes(1);

    navigationState.searchParams = 'chapter=chapter-2';
    rerender(<QuizPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Quiz title (English)')).toHaveValue(
        'Applied practice training quiz',
      );
    });

    expect(mockedCourseService.getAdminCourseById).toHaveBeenCalledTimes(1);
    expect(mockedCourseService.getChapterQuiz).toHaveBeenCalledTimes(2);
  });

  it('saves the quiz for the selected chapter', async () => {
    mockedCourseService.getChapterQuiz.mockResolvedValue(null);
    mockedCourseService.getChapterQuizAnalytics
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        quizId: 'quiz-1',
        chapterId: 'chapter-1',
        summary: {
          learnerCount: 0,
          attemptCount: 0,
          latestAttemptAt: null,
          bestScore: null,
          averageScore: null,
          passRate: null,
        },
        learners: [],
      });
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
        latestAttemptAt: null,
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
    expect(mockedCourseService.getChapterQuizAnalytics).toHaveBeenLastCalledWith(
      'course-1',
      'chapter-1',
    );
  });
});
