import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseContent } from '../CourseContent';
import type { Course } from '@/services/courseService';
import type { NavigationItem, SelectedContent, ViewState } from '../course-detail.utils';

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
        'detail.writtenBy': 'Written by',
        'detail.checkingAccess': 'Checking access',
        'detail.loginRequiredDescription':
          'Please login to open the detailed learning content.',
        'detail.premiumRequiredDescription':
          'Premium access is required for this content.',
        'detail.checkingAccessText': 'Checking access...',
        'detail.premiumRequiredPrompt':
          'This content is part of the premium plan. Please contact the team for access.',
        'detail.previous': 'Previous',
        'detail.next': 'Next',
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
  // Verifies the readable state: authors, fallback author role, and visible paragraphs.
  it('renders authors and content when reading is allowed', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canReadContent
        courseAuthorFallback="Course author"
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
        canReadContent={false}
        courseAuthorFallback="Course author"
        previousItem={previousItem}
        nextItem={nextItem}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Please login to open the detailed learning content.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/auth/login',
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
        canReadContent={false}
        courseAuthorFallback="Course author"
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
        canReadContent
        courseAuthorFallback="Course author"
        previousItem={previousItem}
        nextItem={nextItem}
        onNavigateToView={onNavigateToView}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onNavigateToView).toHaveBeenNthCalledWith(1, previousItem.view);
    expect(onNavigateToView).toHaveBeenNthCalledWith(2, nextItem.view);
  });

  // Verifies the edge case where the current view has no previous or next step.
  it('disables navigation buttons when no adjacent items exist', () => {
    render(
      <CourseContent
        course={createCourse()}
        activeLanguage="en"
        selectedContent={overviewContent}
        accessState="public"
        canReadContent
        courseAuthorFallback="Course author"
        previousItem={null}
        nextItem={null}
        onNavigateToView={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
