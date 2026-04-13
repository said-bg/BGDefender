'use client';

import Link from 'next/link';
import styles from './Login.module.css';
import { useLoginForm } from './useLoginForm';

export function LoginForm() {
  const { displayedFormError, errors, form, handleChange, handleSubmit, isLoading, t } =
    useLoginForm();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('login.title')}</h1>
          <p className={styles.subtitle}>{t('login.subtitle')}</p>
        </div>

        {displayedFormError && <div className={styles.errorMessage}>{displayedFormError}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className={styles.input}
              placeholder={t('login.emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              className={styles.input}
              placeholder={t('login.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.buttonLoading}>
                <span className={styles.spinner}></span>
                {t('login.signingIn')}
              </span>
            ) : (
              t('login.submit')
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <div className={styles.footerLinks}>
            <Link href="/forgot-password" className={styles.footerLink}>
              {t('login.forgotPassword')}
            </Link>

            <div className={styles.footerLinksRow}>
              <span>{t('login.noAccount')}</span>
              <Link href="/register" className={styles.footerLink}>
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
