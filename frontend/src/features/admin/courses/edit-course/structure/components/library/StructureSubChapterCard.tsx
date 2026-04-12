'use client';

import { Chapter } from '@/services/course';
import { TranslationFn } from '../../types';

type StructureSubChapterCardProps = {
  chapter: Chapter;
  subChapter: Chapter['subChapters'][number];
  deletingSubChapterId: string | null;
  activeSubChapterId: string | null;
  language: string;
  styles: Record<string, string>;
  onDeleteSubChapter: (chapterId: string, subChapterId: string) => void | Promise<void>;
  onEditSubChapter: (chapter: Chapter, subChapterId: string) => void;
  t: TranslationFn;
};

export default function StructureSubChapterCard({
  chapter,
  subChapter,
  deletingSubChapterId,
  activeSubChapterId,
  language,
  styles,
  onDeleteSubChapter,
  onEditSubChapter,
  t,
}: StructureSubChapterCardProps) {
  const subChapterTitle = language === 'fi' ? subChapter.titleFi : subChapter.titleEn;
  const subChapterDescription =
    language === 'fi' ? subChapter.descriptionFi : subChapter.descriptionEn;

  return (
    <div
      className={`${styles.structureSidebarCard} ${
        activeSubChapterId === subChapter.id ? styles.structureSidebarCardActive : ''
      }`}
    >
      <div className={styles.structureSidebarCardBody}>
        <p className={styles.chapterOrderLabel}>
          {t('edit.subchapters.orderLabel', {
            defaultValue: 'Subchapter',
          })}{' '}
          {subChapter.orderIndex}
        </p>
        <h5 className={styles.subChapterTitle}>{subChapterTitle}</h5>
        <small className={styles.sidebarPreview} title={subChapterDescription}>
          {subChapterDescription}
        </small>
      </div>

      <div className={styles.structureSidebarButtonRow}>
        <button
          type="button"
          className={styles.inlineAction}
          onClick={() => onEditSubChapter(chapter, subChapter.id)}
        >
          {t('edit.subchapters.editAction', {
            defaultValue: 'Open',
          })}
        </button>
        <button
          type="button"
          className={styles.inlineDanger}
          disabled={deletingSubChapterId === subChapter.id}
          onClick={() => void onDeleteSubChapter(chapter.id, subChapter.id)}
        >
          {deletingSubChapterId === subChapter.id
            ? t('edit.subchapters.deleting', {
                defaultValue: 'Deleting...',
              })
            : t('courseActions.delete', {
                defaultValue: 'Delete',
              })}
        </button>
      </div>
    </div>
  );
}
