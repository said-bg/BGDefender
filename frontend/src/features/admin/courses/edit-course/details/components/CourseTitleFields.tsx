import { Dispatch, SetStateAction } from 'react';
import type { TranslationFn } from '@/types/i18n';
import formStyles from '../../shared/EditCourseForm.module.css';
import { EditCourseFormState } from '../types';

type CourseTitleFieldsProps = {
  form: EditCourseFormState;
  setForm: Dispatch<SetStateAction<EditCourseFormState>>;
  t: TranslationFn;
};

export default function CourseTitleFields({
  form,
  setForm,
  t,
}: CourseTitleFieldsProps) {
  return (
    <>
      <label className={formStyles.field}>
        <span>{t('create.titleEn', { defaultValue: 'Title (English)' })}</span>
        <input
          value={form.titleEn}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, titleEn: event.target.value }))
          }
          placeholder={t('create.titleEnPlaceholder', {
            defaultValue: 'Enter the English course title',
          })}
        />
      </label>

      <label className={formStyles.field}>
        <span>{t('create.titleFi', { defaultValue: 'Title (Finnish)' })}</span>
        <input
          value={form.titleFi}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, titleFi: event.target.value }))
          }
          placeholder={t('create.titleFiPlaceholder', {
            defaultValue: 'Enter the Finnish course title',
          })}
        />
      </label>
    </>
  );
}
