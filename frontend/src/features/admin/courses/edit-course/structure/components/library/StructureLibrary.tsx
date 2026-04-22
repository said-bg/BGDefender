'use client';

import { Chapter } from '@/services/course';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import featureStyles from '../../StructurePage.module.css';
import StructureChapterCard from './StructureChapterCard';
import StructureSubChapterCard from './StructureSubChapterCard';
import { TranslationFn } from '../../types';

const styles = { ...sharedStyles, ...sidebarStyles, ...featureStyles };

type EditCourseStructureLibraryProps = {
  chapters: Chapter[];
  deletingChapterId: string | null;
  deletingSubChapterId: string | null;
  activeChapterId: string | null;
  activeSubChapterId: string | null;
  language: string;
  onDeleteChapter: (chapterId: string) => void | Promise<void>;
  onDeleteSubChapter: (chapterId: string, subChapterId: string) => void | Promise<void>;
  onEditChapter: (chapter: Chapter) => void;
  onEditSubChapter: (chapter: Chapter, subChapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void | Promise<void>;
  onMoveSubChapter: (
    chapterId: string,
    subChapterId: string,
    direction: 'up' | 'down',
  ) => void | Promise<void>;
  t: TranslationFn;
};

export default function EditCourseStructureLibrary({
  chapters,
  deletingChapterId,
  deletingSubChapterId,
  activeChapterId,
  activeSubChapterId,
  language,
  onDeleteChapter,
  onDeleteSubChapter,
  onEditChapter,
  onEditSubChapter,
  onMoveChapter,
  onMoveSubChapter,
  t,
}: EditCourseStructureLibraryProps) {
  if (chapters.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>{t('edit.chapters.emptyTitle')}</p>
        <p className={styles.emptyDescription}>{t('edit.chapters.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className={styles.contentSidebarGroups}>
      {chapters.map((chapter) => {
        const subChapters = chapter.subChapters ?? [];

        return (
          <article key={chapter.id} className={styles.structureTreeGroup}>
            <StructureChapterCard
              chapter={{ ...chapter, subChapters }}
              deletingChapterId={deletingChapterId}
              activeChapterId={activeChapterId}
              language={language}
              styles={styles}
              totalChapters={chapters.length}
              onDeleteChapter={onDeleteChapter}
              onEditChapter={onEditChapter}
              onMoveChapter={onMoveChapter}
              t={t}
            />

            {subChapters.length > 0 ? (
              <div className={styles.structureSubChapterList}>
                {subChapters.map((subChapter) => (
                  <StructureSubChapterCard
                    key={subChapter.id}
                    chapter={{ ...chapter, subChapters }}
                    subChapter={subChapter}
                    deletingSubChapterId={deletingSubChapterId}
                    activeSubChapterId={activeSubChapterId}
                    language={language}
                    styles={styles}
                    totalSubChapters={subChapters.length}
                    onDeleteSubChapter={onDeleteSubChapter}
                    onEditSubChapter={onEditSubChapter}
                    onMoveSubChapter={onMoveSubChapter}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.structureSubChapterEmpty}>
                {t('edit.subchapters.emptyTitle')}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

