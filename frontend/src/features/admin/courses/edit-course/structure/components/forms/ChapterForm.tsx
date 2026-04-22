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
  const orderIndex = Math.max(1, Number(chapterForm.orderIndex) || 1);

  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.sectionTitle}>
          {editingChapterId
            ? t('edit.chapters.editTitle')
            : t('edit.chapters.createTitle')}
        </h3>
        <p className={styles.sectionDescription}>{t('edit.chapters.formDescription')}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('create.titleEn')}</span>
          <input
            value={chapterForm.titleEn}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                titleEn: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.titleEnPlaceholder')}
          />
        </label>

        <label className={styles.field}>
          <span>{t('create.titleFi')}</span>
          <input
            value={chapterForm.titleFi}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                titleFi: event.target.value,
              }))
            }
            placeholder={t('edit.chapters.titleFiPlaceholder')}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{t('edit.chapters.descriptionEn')}</span>
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
            placeholder={t('edit.chapters.descriptionEnPlaceholder')}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{t('edit.chapters.descriptionFi')}</span>
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
            placeholder={t('edit.chapters.descriptionFiPlaceholder')}
          />
        </label>

        <label className={styles.field}>
          <span>{t('edit.chapters.orderInput')}</span>
          <div className={styles.orderEditor}>
            <div className={styles.orderChip}>#{orderIndex}</div>
            <input
              type="number"
              min="1"
              className={styles.orderNumberInput}
              value={chapterForm.orderIndex}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  orderIndex: event.target.value,
                }))
              }
            />
            <div className={styles.orderStepper}>
              <button
                type="button"
                className={styles.orderStepButton}
                onClick={() =>
                  onChange((previous) => ({
                    ...previous,
                    orderIndex: String(Math.max(1, (Number(previous.orderIndex) || 1) - 1)),
                  }))
                }
              >
                -
              </button>
              <button
                type="button"
                className={styles.orderStepButton}
                onClick={() =>
                  onChange((previous) => ({
                    ...previous,
                    orderIndex: String(Math.max(1, (Number(previous.orderIndex) || 1) + 1)),
                  }))
                }
              >
                +
              </button>
            </div>
          </div>
          <p className={styles.orderHint}>
            {t('edit.chapters.orderHint', {
              defaultValue: 'Existing chapters are shifted automatically to keep the order unique.',
            })}
          </p>
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
                ? t('edit.chapters.saving')
                : t('edit.chapters.creating')
              : editingChapterId
                ? t('edit.chapters.save')
                : t('edit.chapters.create')}
          </button>
        </div>
      </form>
    </section>
  );
}
