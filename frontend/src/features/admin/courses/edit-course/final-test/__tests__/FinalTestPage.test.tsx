import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FinalTestPage from '../FinalTestPage';
import courseService from '@/services/course';

jest.mock('@/services/course', () => ({
  __esModule: true,
  default: {
    getCourseById: jest.fn(),
    getCourseFinalTest: jest.fn(),
    upsertCourseFinalTest: jest.fn(),
    deleteCourseFinalTest: jest.fn(),
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

describe('FinalTestPage', () => {
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
      finalTests: [],
      chapters: [],
    } as Awaited<ReturnType<typeof courseService.getCourseById>>);
  });

  afterEach(() => {
    mockedCourseService.getCourseById.mockReset();
    mockedCourseService.getCourseFinalTest.mockReset();
    mockedCourseService.upsertCourseFinalTest.mockReset();
    mockedCourseService.deleteCourseFinalTest.mockReset();
  });

  it('loads the course final test editor', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue(null);

    render(<FinalTestPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Final test title (English)')).toHaveValue(
        'Course EN final test',
      );
    });
  });

  it('saves the final test for the course', async () => {
    mockedCourseService.getCourseFinalTest.mockResolvedValue(null);
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
  });
});
