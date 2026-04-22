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
  totalSubChapters: number;
  onDeleteSubChapter: (chapterId: string, subChapterId: string) => void | Promise<void>;
  onEditSubChapter: (chapter: Chapter, subChapterId: string) => void;
  onMoveSubChapter: (
    chapterId: string,
    subChapterId: string,
    direction: 'up' | 'down',
  ) => void | Promise<void>;
  t: TranslationFn;
};

export default function StructureSubChapterCard({
  chapter,
  subChapter,
  deletingSubChapterId,
  activeSubChapterId,
  language,
  styles,
  totalSubChapters,
  onDeleteSubChapter,
  onEditSubChapter,
  onMoveSubChapter,
  t,
}: StructureSubChapterCardProps) {
  const subChapterTitle = language === 'fi' ? subChapter.titleFi : subChapter.titleEn;
  const subChapterDescription =
    language === 'fi' ? subChapter.descriptionFi : subChapter.descriptionEn;

  return (
    <div
      className={`${styles.structureSubChapterCard} ${
        activeSubChapterId === subChapter.id ? styles.structureSubChapterCardActive : ''
      }`}
    >
      <div className={styles.structureSubChapterBody}>
        <div className={styles.structureSubChapterMain}>
          <p className={styles.structureSubChapterOrder}>
            {chapter.orderIndex}.{subChapter.orderIndex}
          </p>
          <h5 className={styles.structureSubChapterTitle}>{subChapterTitle}</h5>
          <p className={styles.structureSubChapterDescription}>{subChapterDescription}</p>
        </div>

        <div className={styles.structureSubChapterActions}>
          <button
            type="button"
            className={styles.compactIconButton}
            disabled={subChapter.orderIndex === 1}
            onClick={() => void onMoveSubChapter(chapter.id, subChapter.id, 'up')}
          >
            Up
          </button>
          <button
            type="button"
            className={styles.compactIconButton}
            disabled={subChapter.orderIndex === totalSubChapters}
            onClick={() => void onMoveSubChapter(chapter.id, subChapter.id, 'down')}
          >
            Down
          </button>
          <button
            type="button"
            className={styles.compactAction}
            onClick={() => onEditSubChapter(chapter, subChapter.id)}
          >
            {t('edit.subchapters.editAction', {
              defaultValue: 'Open',
            })}
          </button>
          <button
            type="button"
            className={styles.compactDanger}
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
    </div>
  );
}
