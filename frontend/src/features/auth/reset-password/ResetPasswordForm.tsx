'use client';

import sharedStyles from '../AuthFormShared.module.css';
import ResetPasswordRequirements from './ResetPasswordRequirements';
import styles from './ResetPassword.module.css';
import { useResetPasswordForm } from './useResetPasswordForm';

export function ResetPasswordForm() {
  const reset = useResetPasswordForm();

  if (!reset.token) {
    return null;
  }

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{reset.t('resetPassword.title')}</h1>
          <p className={sharedStyles.subtitle}>{reset.t('resetPassword.subtitle')}</p>
        </div>

        {reset.formError ? (
          <div className={sharedStyles.errorMessage}>{reset.formError}</div>
        ) : null}

        <form onSubmit={reset.handleSubmit} className={sharedStyles.form}>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="newPassword" className={sharedStyles.label}>
              {reset.t('resetPassword.newPassword')}
            </label>
            <input
              id="newPassword"
              type="password"
              className={sharedStyles.input}
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

          <div className={sharedStyles.formGroup}>
            <label htmlFor="confirmPassword" className={sharedStyles.label}>
              {reset.t('resetPassword.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={sharedStyles.input}
              value={reset.confirmPassword}
              onChange={reset.handleConfirmPasswordChange}
              disabled={reset.loading}
              placeholder={reset.t('resetPassword.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {reset.fieldErrors.confirmPassword ? (
              <div className={sharedStyles.fieldError}>
                {reset.fieldErrors.confirmPassword}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={reset.loading || !reset.isFormValid}
          >
            {reset.loading ? <span className={sharedStyles.spinner} /> : null}
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
