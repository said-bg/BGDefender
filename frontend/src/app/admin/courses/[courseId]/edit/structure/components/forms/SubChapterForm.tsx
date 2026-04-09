'use client';

import { Dispatch, FormEvent, SetStateAction } from 'react';
import { Chapter } from '@/services/courseService';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import featureStyles from '../../StructurePage.module.css';
import SubChapterContentFields from './SubChapterContentFields';
import SubChapterParentField from './SubChapterParentField';
import { SubChapterFormState, TranslationFn } from '../../types';

const styles = { ...formStyles, ...sharedStyles, ...featureStyles };

type EditCourseSubChapterFormProps = {
  availableParentChapter: Chapter | null;
  chapters: Chapter[];
  editingSubChapterId: string | null;
  isSubmittingSubChapter: boolean;
  language: string;
  onChange: Dispatch<SetStateAction<SubChapterFormState>>;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  subChapterError: string | null;
  subChapterForm: SubChapterFormState;
  subChapterMessage: string | null;
  t: TranslationFn;
};

export default function EditCourseSubChapterForm({
  availableParentChapter,
  chapters,
  editingSubChapterId,
  isSubmittingSubChapter,
  language,
  onChange,
  onReset,
  onSubmit,
  subChapterError,
  subChapterForm,
  subChapterMessage,
  t,
}: EditCourseSubChapterFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          {editingSubChapterId
            ? t('edit.subchapters.editTitle', { defaultValue: 'Edit subchapter' })
            : t('edit.subchapters.createTitle', { defaultValue: 'Create subchapter' })}
        </h3>
        <p className={styles.sectionDescription}>
          {t('edit.subchapters.formDescription', {
            defaultValue:
              'Attach the subchapter to a chapter, then we will plug real lesson content into it next.',
          })}
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t('edit.subchapters.emptyWithoutChapterTitle', {
              defaultValue: 'Create a chapter first',
            })}
          </p>
          <p className={styles.emptyDescription}>
            {t('edit.subchapters.emptyWithoutChapterDescription', {
              defaultValue:
                'Subchapters live inside chapters, so start by creating at least one chapter above.',
            })}
          </p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <SubChapterParentField
            availableParentChapter={availableParentChapter}
            chapters={chapters}
            editingSubChapterId={editingSubChapterId}
            language={language}
            onChange={onChange}
            subChapterForm={subChapterForm}
            t={t}
          />

          <SubChapterContentFields
            onChange={onChange}
            subChapterForm={subChapterForm}
            t={t}
          />

          {subChapterMessage ? <p className={styles.successMessage}>{subChapterMessage}</p> : null}
          {subChapterError ? <p className={styles.errorMessage}>{subChapterError}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryAction} onClick={onReset}>
              {editingSubChapterId
                ? t('edit.subchapters.cancelEdit', {
                    defaultValue: 'Cancel subchapter edit',
                  })
                : t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button type="submit" className={styles.primaryAction} disabled={isSubmittingSubChapter}>
              {isSubmittingSubChapter
                ? editingSubChapterId
                  ? t('edit.subchapters.saving', { defaultValue: 'Saving subchapter...' })
                  : t('edit.subchapters.creating', {
                      defaultValue: 'Creating subchapter...',
                    })
                : editingSubChapterId
                  ? t('edit.subchapters.save', { defaultValue: 'Save subchapter' })
                  : t('edit.subchapters.create', { defaultValue: 'Create subchapter' })}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

