'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import sharedStyles from '../AuthFormShared.module.css';
import styles from './ForgotPassword.module.css';
import { useForgotPasswordForm } from './useForgotPasswordForm';

export function ForgotPasswordForm() {
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const { errors, form, handleChange, handleSubmit, isLoading, success, t } =
    useForgotPasswordForm();
  const emailErrorId = errors.email ? 'forgot-password-email-error' : undefined;
  const formErrorId = errors.form && !success ? 'forgot-password-form-error' : undefined;

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{t('forgotPassword.title')}</h1>
          <p className={sharedStyles.subtitle}>{t('forgotPassword.subtitle')}</p>
        </div>

        {success && (
          <div className={styles.successMessage} role="status" aria-live="polite">
            {t('forgotPassword.successMessage')}
          </div>
        )}

        {errors.form && !success && (
          <div id={formErrorId} className={sharedStyles.errorMessage} role="alert">
            {errors.form}
          </div>
        )}

        {!success && (
          <div className={styles.infoMessage} role="status" aria-live="polite">
            {t('forgotPassword.infoMessage')}
          </div>
        )}

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
                aria-invalid={Boolean(errors.email)}
                aria-describedby={emailErrorId}
              />
              {errors.email && (
                <span id={emailErrorId} className={sharedStyles.fieldError} role="alert">
                  {errors.email}
                </span>
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
          <Link
            href={localizePathname('/login', activeLocale)}
            className={sharedStyles.footerLink}
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
