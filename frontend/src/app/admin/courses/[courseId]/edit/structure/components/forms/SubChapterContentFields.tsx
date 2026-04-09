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
        <span>{t('create.titleEn', { defaultValue: 'Title (English)' })}</span>
        <input
          value={subChapterForm.titleEn}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              titleEn: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.titleEnPlaceholder', {
            defaultValue: 'Enter the English subchapter title',
          })}
        />
      </label>

      <label className={formStyles.field}>
        <span>{t('create.titleFi', { defaultValue: 'Title (Finnish)' })}</span>
        <input
          value={subChapterForm.titleFi}
          onChange={(event) =>
            onChange((previous) => ({
              ...previous,
              titleFi: event.target.value,
            }))
          }
          placeholder={t('edit.subchapters.titleFiPlaceholder', {
            defaultValue: 'Enter the Finnish subchapter title',
          })}
        />
      </label>

      <label className={formStyles.fieldWide}>
        <span>{t('edit.subchapters.descriptionEn', { defaultValue: 'Description (English)' })}</span>
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
          placeholder={t('edit.subchapters.descriptionEnPlaceholder', {
            defaultValue: 'Write the English subchapter description.',
          })}
        />
      </label>

      <label className={formStyles.fieldWide}>
        <span>{t('edit.subchapters.descriptionFi', { defaultValue: 'Description (Finnish)' })}</span>
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
          placeholder={t('edit.subchapters.descriptionFiPlaceholder', {
            defaultValue: 'Write the Finnish subchapter description.',
          })}
        />
      </label>

      <label className={formStyles.field}>
        <span>{t('edit.subchapters.orderInput', { defaultValue: 'Order' })}</span>
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
