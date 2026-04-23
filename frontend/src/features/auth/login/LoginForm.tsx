'use client';

import Link from 'next/link';
import sharedStyles from '../AuthFormShared.module.css';
import styles from './Login.module.css';
import { useLoginForm } from './useLoginForm';

export function LoginForm() {
  const { displayedFormError, errors, form, handleChange, handleSubmit, isLoading, t } =
    useLoginForm();

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{t('login.title')}</h1>
          <p className={sharedStyles.subtitle}>{t('login.subtitle')}</p>
        </div>

        {displayedFormError && (
          <div className={sharedStyles.errorMessage}>{displayedFormError}</div>
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
            />
            {errors.email && <span className={sharedStyles.fieldError}>{errors.email}</span>}
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
            />
            {errors.password && (
              <span className={sharedStyles.fieldError}>{errors.password}</span>
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
            <Link href="/forgot-password" className={sharedStyles.footerLink}>
              {t('login.forgotPassword')}
            </Link>

            <div className={styles.footerLinksRow}>
              <span>{t('login.noAccount')}</span>
              <Link href="/register" className={sharedStyles.footerLink}>
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
