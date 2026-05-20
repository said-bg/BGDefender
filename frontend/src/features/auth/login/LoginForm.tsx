'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import sharedStyles from '../AuthFormShared.module.css';
import styles from './Login.module.css';
import { useLoginForm } from './useLoginForm';

export function LoginForm() {
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const { displayedFormError, errors, form, handleChange, handleSubmit, isLoading, t } =
    useLoginForm();
  const emailErrorId = errors.email ? 'login-email-error' : undefined;
  const passwordErrorId = errors.password ? 'login-password-error' : undefined;
  const formErrorId = displayedFormError ? 'login-form-error' : undefined;

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{t('login.title')}</h1>
          <p className={sharedStyles.subtitle}>{t('login.subtitle')}</p>
        </div>

        {displayedFormError && (
          <div id={formErrorId} className={sharedStyles.errorMessage} role="alert">
            {displayedFormError}
          </div>
        )}

        <form className={sharedStyles.form} onSubmit={handleSubmit}>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="email" className={sharedStyles.label}>
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className={sharedStyles.input}
              placeholder={t('login.emailPlaceholder')}
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

          <div className={sharedStyles.formGroup}>
            <label htmlFor="password" className={sharedStyles.label}>
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              className={sharedStyles.input}
              placeholder={t('login.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={passwordErrorId}
            />
            {errors.password && (
              <span id={passwordErrorId} className={sharedStyles.fieldError} role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className={sharedStyles.button} disabled={isLoading}>
            {isLoading ? (
              <span className={sharedStyles.buttonLoading}>
                <span className={sharedStyles.spinner}></span>
                {t('login.signingIn')}
              </span>
            ) : (
              t('login.submit')
            )}
          </button>
        </form>

        <div className={sharedStyles.footer}>
          <div className={styles.footerLinks}>
            <Link
              href={localizePathname('/forgot-password', activeLocale)}
              className={sharedStyles.footerLink}
            >
              {t('login.forgotPassword')}
            </Link>

            <div className={styles.footerLinksRow}>
              <span>{t('login.noAccount')}</span>
              <Link
                href={localizePathname('/register', activeLocale)}
                className={sharedStyles.footerLink}
              >
                {t('login.signup')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
