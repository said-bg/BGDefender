'use client';

import { FormEvent, useState, useEffect, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { validateEmail } from '@/utils/validation';
import { handleAuthError } from '@/utils/apiError';
import styles from './Login.module.css';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { t, i18n } = useTranslation('auth');

  const { login, isLoading, error: authError, setError } = useAuth();

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
  });

  const [errors, dispatch] = useReducer(errorsReducer, {});

  useEffect(() => {
    dispatch({ type: 'CLEAR' });
  }, [i18n.language]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      dispatch({ type: 'CLEAR_FIELD', payload: name as keyof FormErrors });
    }

    if (errors.form) {
      dispatch({ type: 'CLEAR_FIELD', payload: 'form' });
    }

    if (authError) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email) {
      newErrors.email = t('login.emailRequired');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('login.emailInvalid');
    }

    if (!form.password) {
      newErrors.password = t('login.passwordRequired');
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
      await login(form.email, form.password);
      router.replace(redirectPath);
    } catch (err) {
      const errorMessage = handleAuthError(err, 'login.failed', t);
      dispatch({ type: 'SET', payload: { form: errorMessage } });
    }
  };

  const displayedFormError = errors.form || authError;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('login.title')}</h1>
          <p className={styles.subtitle}>{t('login.subtitle')}</p>
        </div>

        {displayedFormError && (
          <div className={styles.errorMessage}>
            ✕ {displayedFormError}
          </div>
        )}

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
              placeholder="you@example.com"
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
              placeholder="••••••••"
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
            <Link href="/auth/forgot-password" className={styles.footerLink}>
              {t('login.forgotPassword')}
            </Link>

            <div className={styles.footerLinksRow}>
              <span>{t('login.noAccount')}</span>
              <Link href="/auth/register" className={styles.footerLink}>
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