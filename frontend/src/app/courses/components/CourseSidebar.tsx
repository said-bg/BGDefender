'use client';

import { Course } from '@/services/courseService';
import styles from '../course-page.module.css';
import {
  ActiveLanguage,
  ViewState,
  getChapterParagraphs,
  getLocalizedText,
  getPreviewText,
  getSubChapterParagraphs,
} from '../course-detail.utils';

type CourseSidebarProps = {
  course: Course;
  activeLanguage: ActiveLanguage;
  selectedView: ViewState;
  expandedChapters: Set<string>;
  overviewLabel: string;
  heroSummary: string;
  onSelectOverview: () => void;
  onToggleChapter: (chapterId: string) => void;
  onOpenSubChapter: (chapterId: string, subChapterId: string) => void;
};

export function CourseSidebar({
  course,
  activeLanguage,
  selectedView,
  expandedChapters,
  overviewLabel,
  heroSummary,
  onSelectOverview,
  onToggleChapter,
  onOpenSubChapter,
}: CourseSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <button
        type="button"
        className={`${styles.overviewCard} ${
          selectedView.type === 'overview' ? styles.overviewCardActive : ''
        }`}
        onClick={onSelectOverview}
      >
        <div>
          <div className={styles.overviewTitle}>{overviewLabel}</div>
          <p className={styles.overviewText}>
            {getPreviewText(heroSummary, 120)}
          </p>
        </div>
      </button>

      <div className={styles.chapterList}>
        {course.chapters.map((chapter, index) => {
          const chapterTitle = getLocalizedText(
            activeLanguage,
            chapter.titleEn,
            chapter.titleFi,
          );
          const chapterPreview = getPreviewText(
            getChapterParagraphs(activeLanguage, chapter)[0] ||
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
            selectedView.chapterId === chapter.id;

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
                  <div>
                    <div className={styles.chapterTitle}>{chapterTitle}</div>
                    <div className={styles.chapterTeaser}>{chapterPreview}</div>
                  </div>
                </div>
                <span className={styles.chapterChevron}>
                  {isExpanded ? '-' : '+'}
                </span>
              </button>

              {isExpanded && (
                <div className={styles.subChapterList}>
                  {chapter.subChapters.map((subChapter) => {
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
                              getSubChapterParagraphs(
                                activeLanguage,
                                subChapter,
                              )[0] ||
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default CourseSidebar;
