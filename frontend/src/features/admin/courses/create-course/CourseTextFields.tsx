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
        <span>{t('create.titleEn')}</span>
        <input
          value={form.titleEn}
          onChange={(event) => setField('titleEn', event.target.value)}
          placeholder={t('create.titleEnPlaceholder')}
        />
      </label>

      <label className={styles.field}>
        <span>{t('create.titleFi')}</span>
        <input
          value={form.titleFi}
          onChange={(event) => setField('titleFi', event.target.value)}
          placeholder={t('create.titleFiPlaceholder')}
        />
      </label>

      <label className={styles.fieldWide}>
        <span>{t('create.descriptionEn')}</span>
        <textarea
          className={styles.textareaField}
          rows={5}
          value={form.descriptionEn}
          onChange={(event) => setField('descriptionEn', event.target.value)}
          placeholder={t('create.descriptionEnPlaceholder')}
        />
      </label>

      <label className={styles.fieldWide}>
        <span>{t('create.descriptionFi')}</span>
        <textarea
          className={styles.textareaField}
          rows={5}
          value={form.descriptionFi}
          onChange={(event) => setField('descriptionFi', event.target.value)}
          placeholder={t('create.descriptionFiPlaceholder')}
        />
      </label>
    </>
  );
}
