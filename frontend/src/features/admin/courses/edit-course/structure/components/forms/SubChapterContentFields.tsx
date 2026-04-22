import { Dispatch, SetStateAction } from 'react';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import featureStyles from '../../StructurePage.module.css';
import { SubChapterFormState, TranslationFn } from '../../types';

const styles = { ...formStyles, ...sharedStyles, ...featureStyles };

type SubChapterContentFieldsProps = {
  onChange: Dispatch<SetStateAction<SubChapterFormState>>;
  subChapterForm: SubChapterFormState;
  t: TranslationFn;
};

export default function SubChapterContentFields({
  onChange,
  subChapterForm,
  t,
}: SubChapterContentFieldsProps) {
  const orderIndex = Math.max(1, Number(subChapterForm.orderIndex) || 1);

  return (
    <>
      <label className={formStyles.field}>
        <span>{t('create.titleEn')}</span>
        <input
          value={subChapterForm.titleEn}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              titleEn: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.titleEnPlaceholder')}
        />
      </label>

      <label className={formStyles.field}>
        <span>{t('create.titleFi')}</span>
        <input
          value={subChapterForm.titleFi}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              titleFi: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.titleFiPlaceholder')}
        />
      </label>

      <label className={formStyles.fieldWide}>
        <span>{t('edit.subchapters.descriptionEn')}</span>
        <textarea
          className={formStyles.textareaField}
          rows={4}
          value={subChapterForm.descriptionEn}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              descriptionEn: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.descriptionEnPlaceholder')}
        />
      </label>

      <label className={formStyles.fieldWide}>
        <span>{t('edit.subchapters.descriptionFi')}</span>
        <textarea
          className={formStyles.textareaField}
          rows={4}
          value={subChapterForm.descriptionFi}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              descriptionFi: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.descriptionFiPlaceholder')}
        />
      </label>

      <label className={formStyles.field}>
        <span>{t('edit.subchapters.orderInput')}</span>
        <div className={styles.orderEditor}>
          <div className={styles.orderChip}>#{orderIndex}</div>
          <input
            type="number"
            min="1"
            className={styles.orderNumberInput}
            value={subChapterForm.orderIndex}
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
          {t('edit.subchapters.orderHint', {
            defaultValue: 'Existing subchapters are shifted automatically to keep the order unique.',
          })}
        </p>
      </label>
    </>
  );
}
