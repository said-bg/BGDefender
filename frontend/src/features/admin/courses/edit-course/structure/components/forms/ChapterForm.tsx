'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import featureStyles from '../../StructurePage.module.css';
import { ChapterFormState, TranslationFn } from '../../types';

const styles = { ...formStyles, ...sharedStyles, ...featureStyles };

type EditCourseChapterFormProps = {
  chapterForm: ChapterFormState;
  chapterMessage: string | null;
  chapterError: string | null;
  editingChapterId: string | null;
  isSubmittingChapter: boolean;
  onChange: Dispatch<SetStateAction<ChapterFormState>>;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: TranslationFn;
};

export default function EditCourseChapterForm({
  chapterForm,
  chapterMessage,
  chapterError,
  editingChapterId,
  isSubmittingChapter,
  onChange,
  onReset,
  onSubmit,
  t,
}: EditCourseChapterFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          {editingChapterId
            ? t('edit.chapters.editTitle', { defaultValue: 'Edit chapter' })
            : t('edit.chapters.createTitle', { defaultValue: 'Create chapter' })}
        </h3>
        <p className={styles.sectionDescription}>
          {t('edit.chapters.formDescription', {
            defaultValue:
              'Add the chapter shell now. Subchapters will be the next step right after this one.',
          })}
        </p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('create.titleEn', { defaultValue: 'Title (English)' })}</span>
          <input
            value={chapterForm.titleEn}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                titleEn: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.titleEnPlaceholder', {
              defaultValue: 'Enter the English chapter title',
            })}
          />
        </label>

        <label className={styles.field}>
          <span>{t('create.titleFi', { defaultValue: 'Title (Finnish)' })}</span>
          <input
            value={chapterForm.titleFi}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                titleFi: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.titleFiPlaceholder', {
              defaultValue: 'Enter the Finnish chapter title',
            })}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{t('edit.chapters.descriptionEn', { defaultValue: 'Description (English)' })}</span>
          <textarea
            className={styles.textareaField}
            rows={5}
            value={chapterForm.descriptionEn}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                descriptionEn: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.descriptionEnPlaceholder', {
              defaultValue: 'Write the English chapter description.',
            })}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{t('edit.chapters.descriptionFi', { defaultValue: 'Description (Finnish)' })}</span>
          <textarea
            className={styles.textareaField}
            rows={5}
            value={chapterForm.descriptionFi}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                descriptionFi: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.descriptionFiPlaceholder', {
              defaultValue: 'Write the Finnish chapter description.',
            })}
          />
        </label>

        <label className={styles.field}>
          <span>{t('edit.chapters.orderInput', { defaultValue: 'Order' })}</span>
          <input
            type="number"
            min="1"
            value={chapterForm.orderIndex}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                orderIndex: event.target.value,
              }))
            }
          />
        </label>

        {chapterMessage ? <p className={styles.successMessage}>{chapterMessage}</p> : null}
        {chapterError ? <p className={styles.errorMessage}>{chapterError}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryAction} onClick={onReset}>
            {editingChapterId
              ? t('edit.chapters.cancelEdit', { defaultValue: 'Cancel chapter edit' })
              : t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button type="submit" className={styles.primaryAction} disabled={isSubmittingChapter}>
            {isSubmittingChapter
              ? editingChapterId
                ? t('edit.chapters.saving', { defaultValue: 'Saving chapter...' })
                : t('edit.chapters.creating', { defaultValue: 'Creating chapter...' })
              : editingChapterId
                ? t('edit.chapters.save', { defaultValue: 'Save chapter' })
                : t('edit.chapters.create', { defaultValue: 'Create chapter' })}
          </button>
        </div>
      </form>
    </section>
  );
}

