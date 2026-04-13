'use client';

import { memo } from 'react';
import { Chapter, PedagogicalContent, SubChapter } from '@/services/course';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import featureStyles from '../../ContentPage.module.css';

const styles = { ...formStyles, ...sharedStyles, ...sidebarStyles, ...featureStyles };

type ContentWorkbenchProps = {
  contentBlocks: PedagogicalContent[];
  deletingContentId: string | null;
  editingContentId: string | null;
  language: string;
  onCreate: () => void;
  onDelete: (chapterId: string, subChapterId: string, contentId: string) => void;
  onEdit: (chapter: Chapter, subChapter: SubChapter, content: PedagogicalContent) => void;
  selectedChapter: Chapter | null;
  selectedSubChapter: SubChapter | null;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ContentWorkbench({
  contentBlocks,
  deletingContentId,
  editingContentId,
  language,
  onCreate,
  onDelete,
  onEdit,
  selectedChapter,
  selectedSubChapter,
  t,
}: ContentWorkbenchProps) {
  if (!selectedChapter || !selectedSubChapter) {
    return (
        <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>{t('edit.contentBlocks.emptyWithoutSubChapterTitle')}</p>
      </div>
    );
  }

  return (
    <section className={styles.contentWorkbench}>
      <div className={styles.chapterCardHeader}>
        <div className={styles.cardHeader}>
          <h3 className={styles.sectionTitle}>
            {language === 'fi' ? selectedSubChapter.titleFi : selectedSubChapter.titleEn}
          </h3>
        </div>

        <button type="button" className={styles.inlineAction} onClick={onCreate}>
          {t('edit.contentBlocks.addBlock')}
        </button>
      </div>

      {contentBlocks.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{t('edit.contentBlocks.emptyTitle')}</p>
        </div>
      ) : (
        <div className={styles.contentBlocksCompact}>
          {contentBlocks.map((content) => (
            <article
              key={content.id}
              className={`${styles.contentBlockCard} ${
                editingContentId === content.id ? styles.contentBlockCardActive : ''
              }`}
            >
              <div className={styles.chapterCardHeader}>
                <div>
                  <p className={styles.chapterOrderLabel}>
                    {t('edit.contentBlocks.orderLabel')} {content.orderIndex}
                  </p>
                  <h4 className={styles.contentBlockTitle}>
                    {language === 'fi' ? content.titleFi : content.titleEn}
                  </h4>
                </div>
              </div>

              <div className={styles.chapterCardActions}>
                <button
                  type="button"
                  className={styles.inlineAction}
                  onClick={() => onEdit(selectedChapter, selectedSubChapter, content)}
                >
                  {t('edit.contentBlocks.editAction')}
                </button>
                <button
                  type="button"
                  className={styles.inlineDanger}
                  disabled={deletingContentId === content.id}
                  onClick={() => onDelete(selectedChapter.id, selectedSubChapter.id, content.id)}
                >
                  {deletingContentId === content.id
                    ? t('edit.contentBlocks.deleting')
                    : t('courseActions.delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(ContentWorkbench);
