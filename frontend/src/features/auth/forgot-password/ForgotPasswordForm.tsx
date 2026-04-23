'use client';

import Link from 'next/link';
import sharedStyles from '../AuthFormShared.module.css';
import styles from './ForgotPassword.module.css';
import { useForgotPasswordForm } from './useForgotPasswordForm';

export function ForgotPasswordForm() {
  const { errors, form, handleChange, handleSubmit, isLoading, success, t } =
    useForgotPasswordForm();

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{t('forgotPassword.title')}</h1>
          <p className={sharedStyles.subtitle}>{t('forgotPassword.subtitle')}</p>
        </div>

        {success && (
          <div className={styles.successMessage}>{t('forgotPassword.successMessage')}</div>
        )}

        {errors.form && !success && (
          <div className={sharedStyles.errorMessage}>{errors.form}</div>
        )}

        {!success && <div className={styles.infoMessage}>{t('forgotPassword.infoMessage')}</div>}

        {!success ? (
          <form className={sharedStyles.form} onSubmit={handleSubmit}>
            <div className={sharedStyles.formGroup}>
              <label htmlFor="email" className={sharedStyles.label}>
                {t('forgotPassword.email')}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className={sharedStyles.input}
                placeholder={t('forgotPassword.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && (
                <span className={sharedStyles.fieldError}>{errors.email}</span>
              )}
            </div>

            <button type="submit" className={sharedStyles.button} disabled={isLoading}>
              {isLoading ? (
                <span className={sharedStyles.buttonLoading}>
                  <span className={sharedStyles.spinner}></span>
                  {t('forgotPassword.sending')}
                </span>
              ) : (
                t('forgotPassword.submit')
              )}
            </button>
          </form>
        ) : null}

        <div className={sharedStyles.footer}>
          <Link href="/login" className={sharedStyles.footerLink}>
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
