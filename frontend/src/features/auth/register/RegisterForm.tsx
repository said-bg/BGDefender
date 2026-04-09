'use client';

import Link from 'next/link';
import PasswordRequirements from './PasswordRequirements';
import styles from './Register.module.css';
import { useRegisterForm } from './useRegisterForm';

export function RegisterForm() {
  const { authError, errors, form, handleChange, handleSubmit, isLoading, t } =
    useRegisterForm();
  const displayedFormError = errors.form || authError;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('register.title')}</h1>
          <p className={styles.subtitle}>{t('register.subtitle')}</p>
        </div>

        {displayedFormError ? (
          <div className={styles.errorMessage}>x {displayedFormError}</div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              {t('register.email')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className={styles.input}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              {t('register.password')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              className={styles.input}
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password ? (
              <span className={styles.error}>{errors.password}</span>
            ) : null}
            <PasswordRequirements
              password={form.password}
              requirement1={t('register.requirement1')}
              requirement2={t('register.requirement2')}
              requirement3={t('register.requirement3')}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              {t('register.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              className={styles.input}
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.confirmPassword ? (
              <span className={styles.error}>{errors.confirmPassword}</span>
            ) : null}
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.buttonLoading}>
                <span className={styles.spinner} />
                {t('register.creating')}
              </span>
            ) : (
              t('register.submit')
            )}
          </button>
        </form>

        <div className={styles.footer}>
          {t('register.footer')}{' '}
          <Link href="/auth/login" className={styles.footerLink}>
            {t('register.footerLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;