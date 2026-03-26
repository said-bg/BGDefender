/**
 * Forgot Password Form Component
 */

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '@/services/auth';
import { validateEmail } from '@/utils/validation';
import { handleAuthError } from '@/utils/apiError';
import styles from './ForgotPassword.module.css';

interface FormState {
  email: string;
}

interface FormErrors {
  email?: string;
  form?: string;
}

/**
 * Forgot Password Form Component
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation('auth');
  // Form state
  const [form, setForm] = useState<FormState>({
    email: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Handle form input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Clear global form error when user starts typing
    if (errors.form) {
      setErrors((prev) => ({
        ...prev,
        form: undefined,
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate email
    if (!form.email) {
      newErrors.email = t('forgotPassword.emailRequired');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('forgotPassword.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call forgot password API
      await forgotPassword({ email: form.email });

      // Success
      setSuccess(true);
      setForm({ email: '' });
    } catch (err) {
      // Handle API errors using centralized helper
      const errorMessage = handleAuthError(err, 'forgotPassword.failed', t);
      setErrors({ form: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t('forgotPassword.title')}</h1>
          <p className={styles.subtitle}>{t('forgotPassword.subtitle')}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={styles.successMessage}>
            ✓ {t('forgotPassword.successMessage')}
          </div>
        )}

        {/* Error Message */}
        {errors.form && !success && (
          <div className={styles.errorMessage}>
            ✕ {errors.form}
          </div>
        )}

        {/* Info Message */}
        {!success && (
          <div className={styles.infoMessage}>
            ℹ️ {t('forgotPassword.infoMessage')}
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Email Field */}
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
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>

            {/* Submit Button */}
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

        {/* Footer */}
        <div className={styles.footer}>
          <Link href="/auth/login" className={styles.footerLink}>
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
