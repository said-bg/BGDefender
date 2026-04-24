'use client';

import { Course } from '@/services/course';
import styles from './CourseSidebar.module.css';
import {
  ActiveLanguage,
  ViewState,
  getChapterProgressPercentage,
  getCourseProgressPercentage,
  getChapterParagraphs,
  getLocalizedText,
  getOverviewParagraphs,
  getPreviewParagraph,
  getPreviewText,
  getSubChapterParagraphs,
} from '../courseDetail.utils';


type CourseSidebarProps = {
  id?: string;
  hidden?: boolean;
  course: Course;
  activeLanguage: ActiveLanguage;
  selectedView: ViewState;
  expandedChapters: Set<string>;
  courseProgressLabel: string;
  overviewLabel: string;
  quizLabel: string;
  quizDescription: string;
  finalTestLabel: string;
  finalTestDescription: string;
  onSelectOverview: () => void;
  onOpenFinalTest: () => void;
  onOpenQuiz: (chapterId: string) => void;
  onToggleChapter: (chapterId: string) => void;
  onOpenSubChapter: (chapterId: string, subChapterId: string) => void;
};

export function CourseSidebar({
  id,
  hidden = false,
  course,
  activeLanguage,
  selectedView,
  expandedChapters,
  courseProgressLabel,
  overviewLabel,
  quizLabel,
  quizDescription,
  finalTestLabel,
  finalTestDescription,
  onSelectOverview,
  onOpenFinalTest,
  onOpenQuiz,
  onToggleChapter,
  onOpenSubChapter,
}: CourseSidebarProps) {
  const courseProgress = getCourseProgressPercentage(course, selectedView);
  const overviewPreview = getPreviewText(
    getPreviewParagraph(getOverviewParagraphs(activeLanguage, course)),
    88,
  );

  return (
    <aside
      id={id}
      className={styles.sidebar}
      hidden={hidden}
      aria-hidden={hidden}
    >
      <button
        type="button"
        className={`${styles.overviewCard} ${
          selectedView.type === 'overview' ? styles.overviewCardActive : ''
        }`}
        onClick={onSelectOverview}
      >
        <div>
          <div className={styles.overviewTitle}>{overviewLabel}</div>
          {overviewPreview ? (
            <p className={styles.overviewText}>{overviewPreview}</p>
          ) : null}
          <progress
            className={styles.overviewProgress}
            max={100}
            value={courseProgress}
            aria-label={courseProgressLabel}
          />
        </div>
      </button>

      <div className={styles.chapterList}>
        {course.chapters.map((chapter, index) => {
          const chapterParagraphs = getChapterParagraphs(activeLanguage, chapter);
          const chapterTitle = getLocalizedText(
            activeLanguage,
            chapter.titleEn,
            chapter.titleFi,
          );
          const chapterPreview = getPreviewText(
            getPreviewParagraph(chapterParagraphs) ||
              getLocalizedText(
                activeLanguage,
                chapter.descriptionEn,
                chapter.descriptionFi,
              ),
            92,
          );
          const isExpanded = expandedChapters.has(chapter.id);
          const isChapterActive =
            selectedView.type !== 'overview' &&
            selectedView.type !== 'final-test' &&
            selectedView.chapterId === chapter.id;
          const chapterProgress = getChapterProgressPercentage(
            course,
            chapter.id,
            selectedView,
          );

          return (
            <div key={chapter.id} className={styles.chapterGroup}>
              <button
                type="button"
                className={`${styles.chapterButton} ${
                  isChapterActive ? styles.chapterButtonActive : ''
                }`}
                onClick={() => onToggleChapter(chapter.id)}
              >
                <div className={styles.chapterMeta}>
                  <span className={styles.chapterIndex}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className={styles.chapterCopy}>
                    <div className={styles.chapterTitle}>{chapterTitle}</div>
                    {chapterPreview ? (
                      <div className={styles.chapterTeaser}>{chapterPreview}</div>
                    ) : null}
                    <progress
                      className={styles.chapterProgress}
                      max={100}
                      value={chapterProgress}
                      aria-label={`${chapterTitle} ${courseProgressLabel}`}
                    />
                  </div>
                </div>
                <span className={styles.chapterChevron}>
                  {isExpanded ? '-' : '+'}
                </span>
              </button>

              {isExpanded && (
                <div className={styles.subChapterList}>
                  {chapter.subChapters.map((subChapter) => {
                    const subChapterParagraphs = getSubChapterParagraphs(
                      activeLanguage,
                      subChapter,
                    );
                    const isSubChapterActive =
                      selectedView.type === 'subchapter' &&
                      selectedView.subChapterId === subChapter.id;

                    return (
                      <button
                        key={subChapter.id}
                        type="button"
                        className={`${styles.subChapterButton} ${
                          isSubChapterActive
                            ? styles.subChapterButtonActive
                            : ''
                        }`}
                        onClick={() =>
                          onOpenSubChapter(chapter.id, subChapter.id)
                        }
                      >
                        <span className={styles.subChapterInner}>
                          <strong>
                            {getLocalizedText(
                              activeLanguage,
                              subChapter.titleEn,
                              subChapter.titleFi,
                            )}
                          </strong>
                          <small>
                            {getPreviewText(
                              getPreviewParagraph(subChapterParagraphs) ||
                                getLocalizedText(
                                  activeLanguage,
                                  subChapter.descriptionEn,
                                  subChapter.descriptionFi,
                                ),
                              78,
                            )}
                          </small>
                        </span>
                      </button>
                    );
                  })}

                  {chapter.trainingQuiz?.isPublished ? (
                    <button
                      type="button"
                      className={`${styles.quizButton} ${
                        selectedView.type === 'quiz' && selectedView.chapterId === chapter.id
                          ? styles.quizButtonActive
                          : ''
                      }`}
                      onClick={() => onOpenQuiz(chapter.id)}
                    >
                      <span className={styles.subChapterInner}>
                        <strong>{quizLabel}</strong>
                        <small>{quizDescription}</small>
                      </span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {course.finalTests?.some((finalTest) => finalTest.isPublished) ? (
          <div className={styles.finalTestSection}>
            <button
              type="button"
              className={`${styles.finalTestButton} ${
                selectedView.type === 'final-test' ? styles.finalTestButtonActive : ''
              }`}
              onClick={onOpenFinalTest}
            >
              <span className={styles.subChapterInner}>
                <strong>{finalTestLabel}</strong>
                <small>{finalTestDescription}</small>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default CourseSidebar;
