import { Dispatch, SetStateAction } from 'react';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import { SubChapterFormState, TranslationFn } from '../../types';

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
        <input
          type="number"
          min="1"
          value={subChapterForm.orderIndex}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              orderIndex: event.target.value,
            }))
          }
        />
      </label>
    </>
  );
}
