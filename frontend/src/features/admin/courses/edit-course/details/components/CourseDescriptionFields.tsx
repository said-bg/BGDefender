import { Dispatch, SetStateAction } from 'react';
import type { TranslationFn } from '@/types/i18n';
import formStyles from '../../shared/EditCourseForm.module.css';
import { EditCourseFormState } from '../lib/details.types';

type CourseDescriptionFieldsProps = {
  form: EditCourseFormState;
  setForm: Dispatch<SetStateAction<EditCourseFormState>>;
  t: TranslationFn;
};

export default function CourseDescriptionFields({
  form,
  setForm,
  t,
}: CourseDescriptionFieldsProps) {
  return (
    <>
      <label className={formStyles.fieldWide}>
        <span>
          {t('create.descriptionEn', {
            defaultValue: 'Description / Overview (English)',
          })}
        </span>
        <textarea
          className={formStyles.textareaField}
          rows={5}
          value={form.descriptionEn}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, descriptionEn: event.target.value }))
          }
          placeholder={t('create.descriptionEnPlaceholder', {
            defaultValue: 'Write the English course overview shown on the overview tab.',
          })}
        />
      </label>

      <label className={formStyles.fieldWide}>
        <span>
          {t('create.descriptionFi', {
            defaultValue: 'Description / Overview (Finnish)',
          })}
        </span>
        <textarea
          className={formStyles.textareaField}
          rows={5}
          value={form.descriptionFi}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, descriptionFi: event.target.value }))
          }
          placeholder={t('create.descriptionFiPlaceholder', {
            defaultValue: 'Write the Finnish course overview shown on the overview tab.',
          })}
        />
      </label>
    </>
  );
}
