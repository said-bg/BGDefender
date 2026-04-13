'use client';

import { memo } from 'react';
import { Chapter, SubChapter } from '@/services/course';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import featureStyles from '../../ContentPage.module.css';

const styles = { ...sharedStyles, ...sidebarStyles, ...featureStyles };

type ContentSidebarProps = {
  activeSubChapterId: string | null;
  chapters: Chapter[];
  className?: string;
  language: string;
  onSelect: (chapter: Chapter, subChapter: SubChapter) => void;
  onToggleVisibility: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ContentSidebar({
  activeSubChapterId,
  chapters,
  className,
  language,
  onSelect,
  onToggleVisibility,
  t,
}: ContentSidebarProps) {
  const hasSubChapters = chapters.some((chapter) => chapter.subChapters.length > 0);

  return (
    <aside className={`${styles.contentSidebar} ${className ?? ''}`}>
      <div className={styles.sidebarHeaderRow}>
        <div className={styles.chapterLibraryHeader}>
          <h3 className={styles.chapterSectionTitle}>{t('edit.tabs.structure')}</h3>
        </div>

        <button type="button" className={styles.inlineAction} onClick={onToggleVisibility}>
          {t('edit.contentBlocks.hideStructure')}
        </button>
      </div>

      {!hasSubChapters ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t('edit.contentBlocks.emptyWithoutSubChapterTitle')}</p>
          <p className={styles.emptyDescription}>{t('edit.contentBlocks.emptyWithoutSubChapterDescription')}</p>
        </div>
      ) : (
        <div className={styles.contentSidebarGroups}>
          {chapters.map((chapter) => (
            <section key={chapter.id} className={styles.contentSidebarGroup}>
              <p className={styles.chapterOrderLabel}>
                {t('edit.chapters.orderLabel')} {chapter.orderIndex}
              </p>
              <h4 className={styles.chapterTitle}>
                {language === 'fi' ? chapter.titleFi : chapter.titleEn}
              </h4>

              {chapter.subChapters.length > 0 ? (
                <div className={styles.subChapterNav}>
                  {chapter.subChapters.map((subChapter) => (
                    <button
                      key={subChapter.id}
                      type="button"
                      className={`${styles.subChapterNavItem} ${
                        activeSubChapterId === subChapter.id ? styles.subChapterNavItemActive : ''
                      }`}
                      onClick={() => onSelect(chapter, subChapter)}
                    >
                      <span className={styles.subChapterNavTitle}>
                        {language === 'fi' ? subChapter.titleFi : subChapter.titleEn}
                      </span>
                      <span className={styles.subChapterNavMeta}>
                        {t('edit.contentBlocks.blockCount', {
                          count: subChapter.pedagogicalContents.length,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyDescription}>
                  {t('edit.subchapters.emptyTitle')}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}

export default memo(ContentSidebar);
