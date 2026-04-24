import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseContent } from '../components/CourseContent';
import type { Course } from '@/services/course';
import type {
  NavigationItem,
  SelectedContent,
  ViewState,
} from '../courseDetail.utils';

jest.mock('next/link', () => {
  return function MockLink({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children?: ReactNode;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'detail.courseDetail': 'Course detail',
        'detail.chapterOverview': 'Chapter overview',
        'detail.trainingQuiz': 'Training quiz',
        'detail.writtenBy': 'Written by',
        'detail.checkingAccess': 'Checking access',
        'detail.loginRequiredDescription':
          'Please login to open the detailed learning content.',
        'detail.premiumRequiredDescription':
          'Premium access is required for this content.',
        'detail.checkingAccessText': 'Checking access...',
        'detail.premiumRequiredPrompt':
          'This content is part of the premium plan. Please contact the team for access.',
        'detail.loginAction': 'Login',
        'detail.premiumRequiredTitle': 'Premium access required',
        'detail.previous': 'Previous',
        'detail.next': 'Next',
        'detail.backToOverview': 'Back to overview',
      })[key] ?? key,
  }),
  Trans: ({
    components,
  }: {
    components: { loginLink: ReactElement };
  }) => {
    const { cloneElement } = jest.requireActual('react') as typeof import('react');

    return (
      <span>
        Please {cloneElement(components.loginLink, undefined, 'login')} to open
        the detailed learning content.
      </span>
    );
  },
}));

const createCourse = (): Course => ({
  id: 'course-1',
  titleEn: 'Course EN',
  titleFi: 'Course FI',
  descriptionEn: 'Overview paragraph',
  descriptionFi: 'Yleiskuvaus',
  level: 'free',
  status: 'published',
  estimatedDuration: 90,
  coverImage: '/cover.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  authors: [
    {
      id: 'author-1',
      name: 'Alex',
      roleEn: 'Security Engineer',
      roleFi: 'Tietoturva-asiantuntija',
    },
    {
      id: 'author-2',
      name: 'NoRole',
    },
  ],
  finalTests: [],
  chapters: [],
});

const overviewContent: SelectedContent = {
  kind: 'overview',
  title: 'Overview',
  description: 'Course detail',
  paragraphs: ['Paragraph 1', 'Paragraph 2'],
};

const chapterView: ViewState = { type: 'chapter', chapterId: 'chapter-1' };
const previousItem: NavigationItem = {
  key: 'overview',
  view: { type: 'overview' },
};
const nextItem: NavigationItem = {
  key: 'chapter:chapter-1',
  view: chapterView,
};

describe('CourseContent', () => {
  const scrollToMock = jest.fn();
  beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', {
      value: scrollToMock,
      writable: true,
    });
  });

  beforeEach(() => {
    scrollToMock.mockClear();
  });

  // Verifies the readable state: authors, fallback author role, and visible paragraphs.
  it('renders authors and content when reading is allowed', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={nextItem}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(screen.getByText('Written by')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Security Engineer')).toBeInTheDocument();
    expect(screen.getByText('Course author')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  // Verifies the locked state for visitors and checks that the inline login link points to the login page.
  it('renders inline login link when access requires authentication', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'chapter',
          title: 'Chapter 1',
          description: 'Chapter summary',
          paragraphs: ['Secret paragraph'],
        }}
        accessState="login_required"
        canAccessAssessments={false}
        canReadContent={false}
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated={false}
        previousItem={previousItem}
        nextItem={nextItem}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Please login to open the detailed learning content.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'login' })).toHaveAttribute(
      'href',
      '/login?redirect=%2F',
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/login?redirect=%2F',
    );
  });

  // Verifies the premium lock message shown to authenticated free users on premium content.
  it('renders premium prompt when access requires premium plan', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'chapter',
          title: 'Chapter 1',
          description: 'Chapter summary',
          paragraphs: ['Secret paragraph'],
        }}
        accessState="premium_required"
        canAccessAssessments={false}
        canReadContent={false}
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={previousItem}
        nextItem={nextItem}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        'This content is part of the premium plan. Please contact the team for access.',
      ),
    ).toBeInTheDocument();
  });

  // Verifies that Previous and Next buttons forward the expected navigation targets.
  it('navigates with previous and next buttons', () => {
    const onNavigateToView = jest.fn();

    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={previousItem}
        nextItem={nextItem}
        onNavigateToView={onNavigateToView}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onNavigateToView).toHaveBeenNthCalledWith(1, previousItem.view);
    expect(onNavigateToView).toHaveBeenNthCalledWith(2, nextItem.view);
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  // Verifies the edge case where the current view has no previous or next step.
  it('disables navigation buttons when no adjacent items exist', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows a login CTA instead of advancing through locked content for visitors', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated={false}
        previousItem={null}
        nextItem={nextItem}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/login?redirect=%2F',
    );
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  it('shows a login CTA on locked chapters instead of allowing fake course completion', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'chapter',
          title: 'Chapter 1',
          description: 'Chapter summary',
          paragraphs: ['Secret paragraph'],
        }}
        accessState="login_required"
        canAccessAssessments={false}
        canReadContent={false}
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated={false}
        previousItem={previousItem}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/login?redirect=%2F',
    );
    expect(
      screen.queryByRole('button', { name: 'Finish' }),
    ).not.toBeInTheDocument();
  });

  it('renders uploaded video files as html5 video in rich text blocks', () => {
    const { container } = render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'subchapter',
          title: 'Lesson video',
          description: 'Video description',
          paragraphs: [],
          parentTitle: 'Chapter 1',
          contentBlocks: [
            {
              id: 'content-video-1',
              titleEn: 'Video lesson',
              titleFi: 'Video lesson',
              type: 'text',
              contentEn:
                '<div data-video><div><div><iframe src="http://localhost:3001/uploads/course-content-media/demo.mp4"></iframe></div></div></div>',
              contentFi:
                '<div data-video><div><div><iframe src="http://localhost:3001/uploads/course-content-media/demo.mp4"></iframe></div></div></div>',
              url: null,
              orderIndex: 1,
            },
          ],
        }}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      container.querySelector(
        'video[src="http://localhost:3001/uploads/course-content-media/demo.mp4"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'iframe[src="http://localhost:3001/uploads/course-content-media/demo.mp4"]',
      ),
    ).toBeNull();
  });

  it('normalizes youtube watch urls to embed urls in rich text blocks', () => {
    const { container } = render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'subchapter',
          title: 'Lesson video',
          description: 'Video description',
          paragraphs: [],
          parentTitle: 'Chapter 1',
          contentBlocks: [
            {
              id: 'content-video-2',
              titleEn: 'YouTube lesson',
              titleFi: 'YouTube lesson',
              type: 'text',
              contentEn:
                '<div data-video><div><div><iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe></div></div></div>',
              contentFi:
                '<div data-video><div><div><iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe></div></div></div>',
              url: null,
              orderIndex: 2,
            },
          ],
        }}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      container.querySelector(
        'iframe[src="https://www.youtube.com/embed/dQw4w9WgXcQ"]',
      ),
    ).toBeTruthy();
  });

  it('restores iframe src from wrapper data when rich text video html is partially broken', () => {
    const { container } = render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'subchapter',
          title: 'Lesson video',
          description: 'Video description',
          paragraphs: [],
          parentTitle: 'Chapter 1',
          contentBlocks: [
            {
              id: 'content-video-3',
              titleEn: 'Recovered YouTube lesson',
              titleFi: 'Recovered YouTube lesson',
              type: 'text',
              contentEn:
                '<div data-video data-video-kind="embed" data-video-src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" data-video-width="440px" data-video-align="center"><div><div><iframe width="100%" height="100%"></iframe></div></div></div>',
              contentFi:
                '<div data-video data-video-kind="embed" data-video-src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" data-video-width="440px" data-video-align="center"><div><div><iframe width="100%" height="100%"></iframe></div></div></div>',
              url: null,
              orderIndex: 3,
            },
          ],
        }}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      container.querySelector(
        'iframe[src="https://www.youtube.com/embed/dQw4w9WgXcQ"]',
      ),
    ).toBeTruthy();

    const videoFrame = container.querySelector('div[data-video] > div > div');
    expect(videoFrame).toHaveAttribute(
      'style',
      expect.stringContaining('width: 440px'),
    );
  });

  it('preserves inline rich text formatting like underline, font size and horizontal rules', () => {
    const { container } = render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'subchapter',
          title: 'Formatted lesson',
          description: 'Formatting description',
          paragraphs: [],
          parentTitle: 'Chapter 1',
          contentBlocks: [
            {
              id: 'content-formatting-1',
              titleEn: 'Formatting lesson',
              titleFi: 'Formatting lesson',
              type: 'text',
              contentEn:
                '<p><u>Underlined text</u> <span style="font-size: 14px; font-family: Georgia, serif;">Small styled text</span></p><hr />',
              contentFi:
                '<p><u>Underlined text</u> <span style="font-size: 14px; font-family: Georgia, serif;">Small styled text</span></p><hr />',
              url: null,
              orderIndex: 4,
            },
          ],
        }}
        accessState="public"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(container.querySelector('u')).toHaveTextContent('Underlined text');
    expect(container.querySelector('span[style*="font-size: 14px"]')).toHaveTextContent(
      'Small styled text',
    );
    expect(container.querySelector('hr')).toBeTruthy();
  });

  it('uses a discreet back to overview action for already completed courses', () => {
    const onNavigateToView = jest.fn();

    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={{
          kind: 'subchapter',
          title: 'Last lesson',
          description: 'Last lesson description',
          paragraphs: ['Summary'],
          parentTitle: 'Chapter 1',
        }}
        accessState="granted"
        canAccessAssessments={false}
        canReadContent
        courseId="course-1"
        courseAuthorFallback="Course author"
        isAuthenticated
        isCourseCompleted
        previousItem={previousItem}
        nextItem={null}
        onNavigateToView={onNavigateToView}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));

    expect(onNavigateToView).toHaveBeenCalledWith({ type: 'overview' });
    expect(
      screen.queryByText('Nice work, you reached the end of this course path'),
    ).not.toBeInTheDocument();
  });
});

