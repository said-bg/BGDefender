import styles from './CreateCoursePage.module.css';
import type { CreateCourseFormState, SetCreateCourseField } from './types';

interface CourseTextFieldsProps {
  form: CreateCourseFormState;
  setField: SetCreateCourseField;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function CourseTextFields({ form, setField, t }: CourseTextFieldsProps) {
  return (
    <>
      <label className={styles.field}>
        <span>{t('create.titleEn', { defaultValue: 'Title (English)' })}</span>
        <input
          value={form.titleEn}
          onChange={(event) => setField('titleEn', event.target.value)}
          placeholder={t('create.titleEnPlaceholder', {
            defaultValue: 'Enter the English course title',
          })}
        />
      </label>

      <label className={styles.field}>
        <span>{t('create.titleFi', { defaultValue: 'Title (Finnish)' })}</span>
        <input
          value={form.titleFi}
          onChange={(event) => setField('titleFi', event.target.value)}
          placeholder={t('create.titleFiPlaceholder', {
            defaultValue: 'Enter the Finnish course title',
          })}
        />
      </label>

      <label className={styles.fieldWide}>
        <span>
          {t('create.descriptionEn', {
            defaultValue: 'Description / Overview (English)',
          })}
        </span>
        <textarea
          className={styles.textareaField}
          rows={5}
          value={form.descriptionEn}
          onChange={(event) => setField('descriptionEn', event.target.value)}
          placeholder={t('create.descriptionEnPlaceholder', {
            defaultValue: 'Write the English course overview shown on the overview tab.',
          })}
        />
      </label>

      <label className={styles.fieldWide}>
        <span>
          {t('create.descriptionFi', {
            defaultValue: 'Description / Overview (Finnish)',
          })}
        </span>
        <textarea
          className={styles.textareaField}
          rows={5}
          value={form.descriptionFi}
          onChange={(event) => setField('descriptionFi', event.target.value)}
          placeholder={t('create.descriptionFiPlaceholder', {
            defaultValue: 'Write the Finnish course overview shown on the overview tab.',
          })}
        />
      </label>
    </>
  );
}
