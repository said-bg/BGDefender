'use client';

import Link from 'next/link';
import styles from './ForgotPassword.module.css';
import { useForgotPasswordForm } from './useForgotPasswordForm';

export function ForgotPasswordForm() {
  const { errors, form, handleChange, handleSubmit, isLoading, success, t } =
    useForgotPasswordForm();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('forgotPassword.title')}</h1>
          <p className={styles.subtitle}>{t('forgotPassword.subtitle')}</p>
        </div>

        {success && (
          <div className={styles.successMessage}>{t('forgotPassword.successMessage')}</div>
        )}

        {errors.form && !success && (
          <div className={styles.errorMessage}>{errors.form}</div>
        )}

        {!success && <div className={styles.infoMessage}>{t('forgotPassword.infoMessage')}</div>}

        {!success ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                {t('forgotPassword.email')}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className={styles.input}
                placeholder={t('forgotPassword.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>

            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? (
                <span className={styles.buttonLoading}>
                  <span className={styles.spinner}></span>
                  {t('forgotPassword.sending')}
                </span>
              ) : (
                t('forgotPassword.submit')
              )}
            </button>
          </form>
        ) : null}

        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
