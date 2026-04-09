import type { PasswordRequirement } from './resetPassword.types';
import styles from './ResetPasswordRequirements.module.css';

type ResetPasswordRequirementsProps = {
  errors?: string[];
  password: string;
  passwordChecks: PasswordRequirement[];
};

export default function ResetPasswordRequirements({
  errors,
  password,
  passwordChecks,
}: ResetPasswordRequirementsProps) {
  if (errors?.length) {
    return (
      <div className={styles.passwordRequirements}>
        {errors.map((error) => (
          <div key={error} className={styles.requirementItem}>
            <span className={`${styles.requirementIcon} ${styles.requirementInvalid}`}>
              x
            </span>
            <span>{error}</span>
          </div>
        ))}
      </div>
    );
  }

  if (!password) {
    return null;
  }

  return (
    <div className={styles.passwordRequirements}>
      {passwordChecks.map((requirement) => (
        <div key={requirement.key} className={styles.requirementItem}>
          <span
            className={`${styles.requirementIcon} ${
              requirement.isValid ? styles.requirementValid : styles.requirementInvalid
            }`}
          >
            {requirement.isValid ? 'OK' : 'x'}
          </span>
          <span>{requirement.label}</span>
        </div>
      ))}
    </div>
  );
}
