'use client';

import ResetPasswordRequirements from './ResetPasswordRequirements';
import styles from './ResetPassword.module.css';
import { useResetPasswordForm } from './useResetPasswordForm';

export function ResetPasswordForm() {
  const reset = useResetPasswordForm();

  if (!reset.token) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{reset.t('resetPassword.title')}</h1>
        <p className={styles.subtext}>{reset.t('resetPassword.subtitle')}</p>

        {reset.formError ? (
          <div className={styles.errorMessage}>{reset.formError}</div>
        ) : null}

        <form onSubmit={reset.handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              {reset.t('resetPassword.newPassword')}
            </label>
            <input
              id="newPassword"
              type="password"
              className={styles.input}
              value={reset.newPassword}
              onChange={reset.handlePasswordChange}
              disabled={reset.loading}
              placeholder={reset.t('resetPassword.newPasswordPlaceholder')}
              autoComplete="new-password"
            />
            <ResetPasswordRequirements
              errors={reset.fieldErrors.newPassword}
              password={reset.newPassword}
              passwordChecks={reset.passwordChecks}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              {reset.t('resetPassword.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.input}
              value={reset.confirmPassword}
              onChange={reset.handleConfirmPasswordChange}
              disabled={reset.loading}
              placeholder={reset.t('resetPassword.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {reset.fieldErrors.confirmPassword ? (
              <div className={styles.fieldError}>{reset.fieldErrors.confirmPassword}</div>
            ) : null}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={reset.loading || !reset.isFormValid}
          >
            {reset.loading ? <span className={styles.spinner} /> : null}
            {reset.loading
              ? reset.t('resetPassword.resetting')
              : reset.t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordForm;