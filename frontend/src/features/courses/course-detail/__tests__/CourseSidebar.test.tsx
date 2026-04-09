import { fireEvent, render, screen } from '@testing-library/react';
import { CourseSidebar } from '../components/CourseSidebar';
import type { Course } from '@/services/courseService';

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
  authors: [],
  finalTests: [
    {
      id: 'final-test-1',
      titleEn: 'Course final test',
      titleFi: 'Course final test',
      descriptionEn: 'Final assessment',
      descriptionFi: 'Final assessment',
      passingScore: 70,
      isPublished: true,
    },
  ],
  chapters: [
    {
      id: 'chapter-1',
      titleEn: 'Intro',
      titleFi: 'Johdanto',
      descriptionEn: 'Intro description',
      descriptionFi: 'Johdannon kuvaus',
      orderIndex: 1,
      trainingQuiz: {
        id: 'quiz-1',
        titleEn: 'Intro quiz',
        titleFi: 'Intro quiz',
        descriptionEn: 'Quiz description',
        descriptionFi: 'Quiz description',
        passingScore: 70,
        isPublished: true,
      },
      subChapters: [
        {
          id: 'sub-1',
          titleEn: 'Getting Started',
          titleFi: 'Alkuun',
          descriptionEn: 'Sub description',
          descriptionFi: 'Alikappaleen kuvaus',
          orderIndex: 1,
          pedagogicalContents: [],
        },
      ],
    },
  ],
});

describe('CourseSidebar', () => {
  // Verifies that clicking the overview card triggers the callback used to switch back to overview mode.
  it('calls overview callback when overview card is clicked', () => {
    const onSelectOverview = jest.fn();

    render(
      <CourseSidebar
        course={createCourse()}
        activeLanguage="en"
        selectedView={{ type: 'overview' }}
        expandedChapters={new Set()}
        overviewLabel="Overview"
        heroSummary="Hero summary"
        quizLabel="Training quiz"
        quizDescription="Score-based practice"
        finalTestLabel="Final test"
        finalTestDescription="Course-wide assessment"
        onSelectOverview={onSelectOverview}
        onOpenFinalTest={jest.fn()}
        onOpenQuiz={jest.fn()}
        onToggleChapter={jest.fn()}
        onOpenSubChapter={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /overview/i }));
    expect(onSelectOverview).toHaveBeenCalledTimes(1);
  });

  // Verifies that chapter and subchapter buttons send the correct identifiers to the parent page.
  it('opens chapter and subchapter actions with the right identifiers', () => {
    const onToggleChapter = jest.fn();
    const onOpenSubChapter = jest.fn();
    const onOpenQuiz = jest.fn();
    const onOpenFinalTest = jest.fn();

    render(
      <CourseSidebar
        course={createCourse()}
        activeLanguage="en"
        selectedView={{ type: 'chapter', chapterId: 'chapter-1' }}
        expandedChapters={new Set(['chapter-1'])}
        overviewLabel="Overview"
        heroSummary="Hero summary"
        quizLabel="Training quiz"
        quizDescription="Score-based practice"
        finalTestLabel="Final test"
        finalTestDescription="Course-wide assessment"
        onSelectOverview={jest.fn()}
        onOpenFinalTest={onOpenFinalTest}
        onOpenQuiz={onOpenQuiz}
        onToggleChapter={onToggleChapter}
        onOpenSubChapter={onOpenSubChapter}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /intro/i }));
    expect(onToggleChapter).toHaveBeenCalledWith('chapter-1');

    fireEvent.click(screen.getByRole('button', { name: /getting started/i }));
    expect(onOpenSubChapter).toHaveBeenCalledWith('chapter-1', 'sub-1');

    fireEvent.click(screen.getByRole('button', { name: /training quiz/i }));
    expect(onOpenQuiz).toHaveBeenCalledWith('chapter-1');

    fireEvent.click(screen.getByRole('button', { name: /final test/i }));
    expect(onOpenFinalTest).toHaveBeenCalledTimes(1);
  });

  // Verifies that the sidebar renders the subtle progress bars for the course and chapter list.
  it('renders sidebar progress bars', () => {
    render(
      <CourseSidebar
        course={createCourse()}
        activeLanguage="en"
        selectedView={{
          type: 'subchapter',
          chapterId: 'chapter-1',
          subChapterId: 'sub-1',
        }}
        expandedChapters={new Set(['chapter-1'])}
        overviewLabel="Overview"
        heroSummary="Hero summary"
        quizLabel="Training quiz"
        quizDescription="Score-based practice"
        finalTestLabel="Final test"
        finalTestDescription="Course-wide assessment"
        onSelectOverview={jest.fn()}
        onOpenFinalTest={jest.fn()}
        onOpenQuiz={jest.fn()}
        onToggleChapter={jest.fn()}
        onOpenSubChapter={jest.fn()}
      />,
    );

    const progressBars = screen.getAllByRole('progressbar');
    const progressValues = progressBars.map((progressBar) =>
      progressBar.getAttribute('value'),
    );

    expect(progressBars).toHaveLength(2);
    expect(progressValues).toEqual(expect.arrayContaining(['67', '67']));
  });
});
