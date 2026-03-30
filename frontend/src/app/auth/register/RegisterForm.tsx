/**
 * Register Form Component
 */

'use client';

import { FormEvent, useState, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useModalStore } from '@/store/modalStore';
import { validateEmail, validatePassword } from '@/utils/validation';
import { handleAuthError } from '@/utils/apiError';
import styles from './Register.module.css';

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

type ErrorAction =
  | { type: 'SET'; payload: FormErrors }
  | { type: 'CLEAR_FIELD'; payload: keyof FormErrors }
  | { type: 'CLEAR' };

const errorsReducer = (state: FormErrors, action: ErrorAction): FormErrors => {
  switch (action.type) {
    case 'SET':
      return action.payload;
    case 'CLEAR_FIELD':
      return { ...state, [action.payload]: undefined };
    case 'CLEAR':
      return {};
    default:
      return state;
  }
};

/**
 * Register Form Component
 */
export function RegisterForm() {
  const router = useRouter();
  const { t, i18n } = useTranslation('auth');
  const { register, isLoading, error: authError, setError } = useAuth();
  const { showModal, closeModal } = useModalStore();

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, dispatch] = useReducer(errorsReducer, {});

  useEffect(() => {
    dispatch({ type: 'CLEAR' });
    if (authError) {
      setError(null);
    }
  }, [authError, i18n.language, setError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field-specific error
    if (errors[name as keyof FormErrors]) {
      dispatch({ type: 'CLEAR_FIELD', payload: name as keyof FormErrors });
    }
    
    // Clear global form errors when user starts typing
    if (errors.form) {
      dispatch({ type: 'CLEAR_FIELD', payload: 'form' });
    }
    
    // Clear auth store error when user starts typing
    if (authError) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email) {
      newErrors.email = t('register.emailRequired');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('register.emailInvalid');
    }

    if (!form.password) {
      newErrors.password = t('register.passwordRequired');
    } else {
      const passwordValidation = validatePassword(form.password);
      if (!passwordValidation.isValid) {
        const firstError = passwordValidation.errors[0];
        // Translate error code to message
        if (firstError.code === 'minLength') {
          newErrors.password = t('password.minLength');
        } else if (firstError.code === 'noUppercase') {
          newErrors.password = t('password.noUppercase');
        } else if (firstError.code === 'noNumber') {
          newErrors.password = t('password.noNumber');
        }
      }
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('register.confirmPasswordRequired');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('register.passwordsMismatch');
    }

    dispatch({ type: 'SET', payload: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(form.email, form.password);

      const modalId = showModal({
        type: 'success',
        title: t('alerts.accountCreated'),
        message: t('alerts.accountCreatedMessage'),
      });

      setTimeout(() => {
        closeModal(modalId);
        router.replace('/auth/login');
      }, 1000);

      setForm({ email: '', password: '', confirmPassword: '' });
    } catch (err) {
      const errorMessage = handleAuthError(err, 'register.failed', t);
      dispatch({ type: 'SET', payload: { form: errorMessage } });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('register.title')}</h1>
          <p className={styles.subtitle}>{t('register.subtitle')}</p>
        </div>

        {(errors.form || authError) && (
          <div className={styles.errorMessage}>
            ✕ {errors.form || authError}
          </div>
        )}

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
            {errors.email && <span className={styles.error}>{errors.email}</span>}
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
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}

            {form.password && (
              <div className={styles.passwordInfo}>
                {t('register.passwordRequirements')}
                <div className={styles.passwordRequirement}>
                  <span
                    className={`${styles.requirementIcon} ${
                      form.password.length >= 8
                        ? styles.requirementIconValid
                        : styles.requirementIconInvalid
                    }`}
                  >
                    {form.password.length >= 8 ? '✓' : '✕'}
                  </span>
                  <span
                    className={`${styles.requirementText} ${
                      form.password.length >= 8
                        ? styles.requirementTextValid
                        : styles.requirementTextInvalid
                    }`}
                  >
                    {t('register.requirement1')}
                  </span>
                </div>
                <div className={styles.passwordRequirement}>
                  <span
                    className={`${styles.requirementIcon} ${
                      /[A-Z]/.test(form.password)
                        ? styles.requirementIconValid
                        : styles.requirementIconInvalid
                    }`}
                  >
                    {/[A-Z]/.test(form.password) ? '✓' : '✕'}
                  </span>
                  <span
                    className={`${styles.requirementText} ${
                      /[A-Z]/.test(form.password)
                        ? styles.requirementTextValid
                        : styles.requirementTextInvalid
                    }`}
                  >
                    {t('register.requirement2')}
                  </span>
                </div>
                <div className={styles.passwordRequirement}>
                  <span
                    className={`${styles.requirementIcon} ${
                      /[0-9]/.test(form.password)
                        ? styles.requirementIconValid
                        : styles.requirementIconInvalid
                    }`}
                  >
                    {/[0-9]/.test(form.password) ? '✓' : '✕'}
                  </span>
                  <span
                    className={`${styles.requirementText} ${
                      /[0-9]/.test(form.password)
                        ? styles.requirementTextValid
                        : styles.requirementTextInvalid
                    }`}
                  >
                    {t('register.requirement3')}
                  </span>
                </div>
              </div>
            )}
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
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.buttonLoading}>
                <span className={styles.spinner}></span>
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
