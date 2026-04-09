'use client';

import { Chapter } from '@/services/courseService';
import { TranslationFn } from '../../types';

type StructureChapterCardProps = {
  chapter: Chapter;
  deletingChapterId: string | null;
  activeChapterId: string | null;
  language: string;
  styles: Record<string, string>;
  onDeleteChapter: (chapterId: string) => void | Promise<void>;
  onEditChapter: (chapter: Chapter) => void;
  t: TranslationFn;
};

export default function StructureChapterCard({
  chapter,
  deletingChapterId,
  activeChapterId,
  language,
  styles,
  onDeleteChapter,
  onEditChapter,
  t,
}: StructureChapterCardProps) {
  const chapterTitle = language === 'fi' ? chapter.titleFi : chapter.titleEn;
  const chapterDescription = language === 'fi' ? chapter.descriptionFi : chapter.descriptionEn;
  const subChapterCount = chapter.subChapters?.length ?? 0;

  return (
    <div
      className={`${styles.structureSidebarCard} ${
        activeChapterId === chapter.id ? styles.structureSidebarCardActive : ''
      }`}
    >
      <div className={styles.structureSidebarCardBody}>
        <p className={styles.chapterOrderLabel}>
          {t('edit.chapters.orderLabel', { defaultValue: 'Chapter' })} {chapter.orderIndex}
        </p>
        <h4 className={styles.chapterTitle}>{chapterTitle}</h4>
        <p
          className={`${styles.chapterDescriptionPreview} ${styles.sidebarPreview}`}
          title={chapterDescription}
        >
          {chapterDescription}
        </p>
        <div className={styles.chapterMeta}>
          <span>
            {subChapterCount}{' '}
            {t('edit.chapters.subchapterCount', {
              defaultValue: 'subchapters',
            })}
          </span>
        </div>
      </div>

      <div className={styles.structureSidebarButtonRow}>
        <button type="button" className={styles.inlineAction} onClick={() => onEditChapter(chapter)}>
          {t('edit.chapters.editAction', {
            defaultValue: 'Open',
          })}
        </button>
        <button
          type="button"
          className={styles.inlineDanger}
          disabled={deletingChapterId === chapter.id}
          onClick={() => void onDeleteChapter(chapter.id)}
        >
          {deletingChapterId === chapter.id
            ? t('edit.chapters.deleting', { defaultValue: 'Deleting...' })
            : t('courseActions.delete', { defaultValue: 'Delete' })}
        </button>
      </div>
    </div>
  );
}
