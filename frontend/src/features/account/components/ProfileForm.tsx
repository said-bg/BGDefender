import type { FormEvent } from 'react';
import type { ProfileFormState } from '../account.types';
import styles from './AccountForms.module.css';

type ProfileFormProps = {
  description: string;
  error: string | null;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  isSaving: boolean;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  message: string | null;
  occupationLabel: string;
  occupationPlaceholder: string;
  saveLabel: string;
  savingLabel: string;
  title: string;
  value: ProfileFormState;
  onChange: (value: ProfileFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileForm({
  description,
  error,
  firstNameLabel,
  firstNamePlaceholder,
  isSaving,
  lastNameLabel,
  lastNamePlaceholder,
  message,
  occupationLabel,
  occupationPlaceholder,
  onChange,
  onSubmit,
  saveLabel,
  savingLabel,
  title,
  value,
}: ProfileFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{firstNameLabel}</span>
          <input
            value={value.firstName}
            onChange={(event) => onChange({ ...value, firstName: event.target.value })}
            placeholder={firstNamePlaceholder}
          />
        </label>

        <label className={styles.field}>
          <span>{lastNameLabel}</span>
          <input
            value={value.lastName}
            onChange={(event) => onChange({ ...value, lastName: event.target.value })}
            placeholder={lastNamePlaceholder}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{occupationLabel}</span>
          <input
            value={value.occupation}
            onChange={(event) => onChange({ ...value, occupation: event.target.value })}
            placeholder={occupationPlaceholder}
          />
        </label>

        {message ? <p className={styles.successMessage}>{message}</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <button type="submit" className={styles.primaryButton} disabled={isSaving}>
          {isSaving ? savingLabel : saveLabel}
        </button>
      </form>
    </section>
  );
}