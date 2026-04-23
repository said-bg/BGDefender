'use client';

import Link from 'next/link';
import sharedStyles from '../AuthFormShared.module.css';
import PasswordRequirements from './PasswordRequirements';
import { useRegisterForm } from './useRegisterForm';

export function RegisterForm() {
  const { authError, errors, form, handleChange, handleSubmit, isLoading, t } =
    useRegisterForm();
  const displayedFormError = errors.form || authError;

  return (
    <div className={sharedStyles.container}>
      <div className={sharedStyles.card}>
        <div className={sharedStyles.header}>
          <h1 className={sharedStyles.title}>{t('register.title')}</h1>
          <p className={sharedStyles.subtitle}>{t('register.subtitle')}</p>
        </div>

        {displayedFormError ? (
          <div className={sharedStyles.errorMessage}>x {displayedFormError}</div>
        ) : null}

        <form className={sharedStyles.form} onSubmit={handleSubmit}>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="email" className={sharedStyles.label}>
              {t('register.email')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              className={sharedStyles.input}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.email ? (
              <span className={sharedStyles.fieldError}>{errors.email}</span>
            ) : null}
          </div>

          <div className={sharedStyles.formGroup}>
            <label htmlFor="password" className={sharedStyles.label}>
              {t('register.password')}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              className={sharedStyles.input}
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password ? (
              <span className={sharedStyles.fieldError}>{errors.password}</span>
            ) : null}
            <PasswordRequirements
              password={form.password}
              requirement1={t('register.requirement1')}
              requirement2={t('register.requirement2')}
              requirement3={t('register.requirement3')}
            />
          </div>

          <div className={sharedStyles.formGroup}>
            <label htmlFor="confirmPassword" className={sharedStyles.label}>
              {t('register.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              className={sharedStyles.input}
              placeholder="********"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.confirmPassword ? (
              <span className={sharedStyles.fieldError}>{errors.confirmPassword}</span>
            ) : null}
          </div>

          <button type="submit" className={sharedStyles.button} disabled={isLoading}>
            {isLoading ? (
              <span className={sharedStyles.buttonLoading}>
                <span className={sharedStyles.spinner} />
                {t('register.creating')}
              </span>
            ) : (
              t('register.submit')
            )}
          </button>
        </form>

        <div className={sharedStyles.footer}>
          {t('register.footer')}{' '}
          <Link href="/login" className={sharedStyles.footerLink}>
            {t('register.footerLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
