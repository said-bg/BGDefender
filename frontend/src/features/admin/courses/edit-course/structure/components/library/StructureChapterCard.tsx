'use client';

import { Chapter } from '@/services/course';
import { TranslationFn } from '../../types';

type StructureChapterCardProps = {
  chapter: Chapter;
  deletingChapterId: string | null;
  activeChapterId: string | null;
  language: string;
  styles: Record<string, string>;
  totalChapters: number;
  onDeleteChapter: (chapterId: string) => void | Promise<void>;
  onEditChapter: (chapter: Chapter) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void | Promise<void>;
  t: TranslationFn;
};

export default function StructureChapterCard({
  chapter,
  deletingChapterId,
  activeChapterId,
  language,
  styles,
  totalChapters,
  onDeleteChapter,
  onEditChapter,
  onMoveChapter,
  t,
}: StructureChapterCardProps) {
  const chapterTitle = language === 'fi' ? chapter.titleFi : chapter.titleEn;
  const chapterDescription = language === 'fi' ? chapter.descriptionFi : chapter.descriptionEn;
  const subChapterCount = chapter.subChapters?.length ?? 0;

  return (
    <div
      className={`${styles.structureChapterCard} ${
        activeChapterId === chapter.id ? styles.structureChapterCardActive : ''
      }`}
    >
      <div className={styles.structureNodeHeader}>
        <div className={styles.structureIndexBadge}>{chapter.orderIndex}</div>
        <div className={styles.structureNodeHeading}>
          <p className={styles.structureNodeType}>
            {t('edit.chapters.orderLabel')}
          </p>
          <h4 className={styles.structureNodeTitle}>{chapterTitle}</h4>
          <p className={styles.structureNodeDescription}>{chapterDescription}</p>
        </div>
        <span className={styles.structureCountBadge}>
          {subChapterCount}{' '}
          {t('edit.chapters.subchapterCount')}
        </span>
      </div>

      <div className={styles.structureChapterActions}>
        <button
          type="button"
          className={styles.compactIconButton}
          disabled={chapter.orderIndex === 1}
          onClick={() => void onMoveChapter(chapter.id, 'up')}
        >
          {t('collections.moveUp')}
        </button>
        <button
          type="button"
          className={styles.compactIconButton}
          disabled={chapter.orderIndex === totalChapters}
          onClick={() => void onMoveChapter(chapter.id, 'down')}
        >
          {t('collections.moveDown')}
        </button>
        <button
          type="button"
          className={styles.compactAction}
          onClick={() => onEditChapter(chapter)}
        >
          {t('edit.chapters.editAction')}
        </button>
        <button
          type="button"
          className={styles.compactDanger}
          disabled={deletingChapterId === chapter.id}
          onClick={() => void onDeleteChapter(chapter.id)}
        >
          {deletingChapterId === chapter.id
            ? t('edit.chapters.deleting')
            : t('courseActions.delete')}
        </button>
      </div>
    </div>
  );
}
