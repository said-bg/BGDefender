import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FinalTestPage from '../FinalTestPage';
import courseService from '@/services/course';

jest.mock('@/services/course', () => ({
  __esModule: true,
  default: {
    getAdminCourseById: jest.fn(),
    getCourseById: jest.fn(),
    getCourseFinalTest: jest.fn(),
    getCourseFinalTestAnalytics: jest.fn(),
    upsertCourseFinalTest: jest.fn(),
    deleteCourseFinalTest: jest.fn(),
  },
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const TRANSLATIONS: Record<string, string> = {
  'common.cancel': 'Cancel',
  'edit.missingCourseId': 'Missing course id.',
  'edit.failedToLoad': 'Failed to load course data.',
  'edit.tabs.finalTest': 'Final test',
  'edit.finalTest.subtitle':
    'Create one optional scored final test for the full course. Learners unlock it only after finishing the course path.',
  'edit.finalTest.title': 'Course final test',
  'edit.finalTest.description':
    'Configure the optional final assessment for this course, including its passing percentage and question set.',
  'edit.finalTest.analyticsTitle': 'Learner final test analytics',
  'edit.finalTest.analyticsOpenDetails': 'View learner analytics',
  'edit.finalTest.analyticsDescription':
    'Review who attempted the final test, how often they retried it, and how they performed.',
  'edit.finalTest.loading': 'Loading final test...',
  'edit.finalTest.failedToLoad': 'Failed to load the final test.',
  'edit.finalTest.saved': 'Final test saved successfully.',
  'edit.finalTest.saveFailed': 'Failed to save the final test.',
  'edit.finalTest.deleteConfirm': 'Delete this final test? This action cannot be undone.',
  'edit.finalTest.deleted': 'Final test deleted successfully.',
  'edit.finalTest.deleteFailed': 'Failed to delete the final test.',
  'edit.finalTest.titleEn': 'Final test title (English)',
  'edit.finalTest.titleFi': 'Final test title (Finnish)',
  'edit.finalTest.descriptionEn': 'Description (English)',
  'edit.finalTest.descriptionFi': 'Description (Finnish)',
  'edit.finalTest.passingScore': 'Passing score (%)',
  'edit.finalTest.publishNow': 'Make this final test visible to learners now',
  'edit.finalTest.attemptsShort': 'attempts',
  'edit.finalTest.bestScoreLabel': 'Best score',
  'edit.finalTest.questionsTitle': 'Questions',
  'edit.finalTest.addQuestion': 'Add question',
  'edit.finalTest.questionLabel': 'Question',
  'edit.finalTest.untitledQuestion': 'Untitled question',
  'edit.finalTest.promptEn': 'Prompt (English)',
  'edit.finalTest.promptFi': 'Prompt (Finnish)',
  'edit.finalTest.explanationEn': 'Explanation (English)',
  'edit.finalTest.explanationFi': 'Explanation (Finnish)',
  'edit.finalTest.questionType': 'Question type',
  'edit.finalTest.singleChoice': 'Single choice',
  'edit.finalTest.multipleChoice': 'Multiple choice',
  'edit.finalTest.optionsTitle': 'Answer options',
  'edit.finalTest.addOption': 'Add option',
  'edit.finalTest.correctAnswer': 'Correct',
  'edit.finalTest.optionEn': 'Option (English)',
  'edit.finalTest.optionFi': 'Option (Finnish)',
  'edit.finalTest.deleting': 'Deleting final test...',
  'edit.finalTest.deleteQuestion': 'Delete question',
  'edit.finalTest.deleteTest': 'Delete final test',
  'edit.finalTest.saving': 'Saving final test...',
  'edit.finalTest.saveTest': 'Save final test',
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

jest.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'course-1' }),
  usePathname: () => '/admin/courses/course-1/edit/final-test',
}));

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

describe('FinalTestPage', () => {
  beforeEach(() => {
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
      finalTests: [],
      chapters: [],
    } as Awaited<ReturnType<typeof courseService.getAdminCourseById>>);
  });

  afterEach(() => {
    mockedCourseService.getAdminCourseById.mockReset();
    mockedCourseService.getCourseById.mockReset();
    mockedCourseService.getCourseFinalTest.mockReset();
    mockedCourseService.getCourseFinalTestAnalytics.mockReset();
    mockedCourseService.upsertCourseFinalTest.mockReset();
    mockedCourseService.deleteCourseFinalTest.mockReset();
  });

  it('loads the course final test editor', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue(null);
    mockedCourseService.getCourseFinalTestAnalytics.mockResolvedValue(null);

    render(<FinalTestPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Final test title (English)')).toHaveValue(
        'Course EN final test',
      );
    });
  });

  it('saves the final test for the course', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue(null);
    mockedCourseService.getCourseFinalTestAnalytics
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        quizId: 'final-test-1',
        courseId: 'course-1',
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
    mockedCourseService.upsertCourseFinalTest.mockResolvedValue({
      id: 'final-test-1',
      courseId: 'course-1',
      titleEn: 'Course EN certification test',
      titleFi: 'Course FI certification test',
      descriptionEn: 'Updated final test description',
      descriptionFi: 'Updated final test description',
      passingScore: 80,
      isPublished: true,
      stats: {
        attemptCount: 0,
        latestAttemptAt: null,
        bestScore: null,
      },
      questions: [
        {
          id: 'question-1',
          promptEn: 'What is the safest first step?',
          promptFi: 'What is the safest first step?',
          explanationEn: 'Because option A is the safest first step',
          explanationFi: 'Because option A is the safest first step',
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

    render(<FinalTestPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Final test title (English)')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Final test title (English)'), {
      target: { value: 'Course EN certification test' },
    });
    fireEvent.change(screen.getByLabelText('Final test title (Finnish)'), {
      target: { value: 'Course FI certification test' },
    });
    fireEvent.change(screen.getByLabelText('Description (English)'), {
      target: { value: 'Updated final test description' },
    });
    fireEvent.change(screen.getByLabelText('Description (Finnish)'), {
      target: { value: 'Updated final test description' },
    });
    fireEvent.change(screen.getByLabelText('Passing score (%)'), {
      target: { value: '80' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /make this final test visible to learners now/i,
      }),
    );
    fireEvent.change(screen.getByLabelText('Prompt (English)'), {
      target: { value: 'What is the safest first step?' },
    });
    fireEvent.change(screen.getByLabelText('Prompt (Finnish)'), {
      target: { value: 'What is the safest first step?' },
    });
    fireEvent.change(screen.getByLabelText('Explanation (English)'), {
      target: { value: 'Because option A is the safest first step' },
    });
    fireEvent.change(screen.getByLabelText('Explanation (Finnish)'), {
      target: { value: 'Because option A is the safest first step' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Option (English)')[0], {
      target: { value: 'Option A' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Option (Finnish)')[0], {
      target: { value: 'Option A' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Option (English)')[1], {
      target: { value: 'Option B' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Option (Finnish)')[1], {
      target: { value: 'Option B' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save final test' }));

    await waitFor(() => {
      expect(mockedCourseService.upsertCourseFinalTest).toHaveBeenCalledWith(
        'course-1',
        expect.objectContaining({
          titleEn: 'Course EN certification test',
          titleFi: 'Course FI certification test',
          descriptionEn: 'Updated final test description',
          descriptionFi: 'Updated final test description',
          passingScore: 80,
          isPublished: true,
        }),
      );
    });

    expect(screen.getByText('Final test saved successfully.')).toBeInTheDocument();
    expect(mockedCourseService.getCourseFinalTestAnalytics).toHaveBeenLastCalledWith(
      'course-1',
    );
  });
});
