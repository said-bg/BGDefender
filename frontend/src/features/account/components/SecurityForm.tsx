import type { FormEvent } from 'react';
import type { PasswordCheck } from '../account.types';
import styles from './AccountForms.module.css';

type SecurityFormProps = {
  confirmPassword: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  currentPassword: string;
  currentPasswordLabel: string;
  currentPasswordPlaceholder: string;
  description: string;
  error: string | null;
  isSaving: boolean;
  message: string | null;
  newPassword: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  passwordChecks: PasswordCheck[];
  saveLabel: string;
  savingLabel: string;
  title: string;
  onConfirmPasswordChange: (value: string) => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function SecurityForm({
  confirmPassword,
  confirmPasswordLabel,
  confirmPasswordPlaceholder,
  currentPassword,
  currentPasswordLabel,
  currentPasswordPlaceholder,
  description,
  error,
  isSaving,
  message,
  newPassword,
  newPasswordLabel,
  newPasswordPlaceholder,
  onConfirmPasswordChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit,
  passwordChecks,
  saveLabel,
  savingLabel,
  title,
}: SecurityFormProps) {
  return (
    <section className={styles.formCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>

      <form className={`${styles.form} ${styles.securityForm}`} onSubmit={onSubmit}>
        <label className={styles.fieldWide}>
          <span>{currentPasswordLabel}</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
            placeholder={currentPasswordPlaceholder}
          />
        </label>

        <label className={styles.fieldWide}>
          <span>{newPasswordLabel}</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            placeholder={newPasswordPlaceholder}
          />
          {newPassword ? (
            <div className={styles.passwordRequirements}>
              {passwordChecks.map((requirement) => (
                <div key={requirement.key} className={styles.passwordRequirement}>
                  <span
                    className={`${styles.requirementDot} ${
                      requirement.isValid
                        ? styles.requirementDotValid
                        : styles.requirementDotInvalid
                    }`}
                  />
                  <span
                    className={`${styles.requirementLabel} ${
                      requirement.isValid
                        ? styles.requirementLabelValid
                        : styles.requirementLabelInvalid
                    }`}
                  >
                    {requirement.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </label>

        <label className={styles.fieldWide}>
          <span>{confirmPasswordLabel}</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder={confirmPasswordPlaceholder}
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