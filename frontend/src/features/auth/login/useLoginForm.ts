import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useReducer, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { handleAuthError } from '@/utils/apiError';
import { validateEmail } from '@/utils/validation';
import type { LoginErrorAction, LoginFormErrors, LoginFormState } from './login.types';

const initialForm: LoginFormState = {
  email: '',
  password: '',
};

const errorsReducer = (state: LoginFormErrors, action: LoginErrorAction): LoginFormErrors => {
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

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const { t, i18n } = useTranslation('auth');
  const { login, isLoading, error: authError, setError } = useAuth();
  const [form, setForm] = useState<LoginFormState>(initialForm);
  const [errors, dispatch] = useReducer(errorsReducer, {});

  useEffect(() => {
    dispatch({ type: 'CLEAR' });
    if (authError) {
      setError(null);
    }
  }, [authError, i18n.language, setError]);

  const clearFieldErrors = (name: keyof LoginFormErrors) => {
    if (errors[name]) {
      dispatch({ type: 'CLEAR_FIELD', payload: name });
    }

    if (errors.form) {
      dispatch({ type: 'CLEAR_FIELD', payload: 'form' });
    }

    if (authError) {
      setError(null);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof LoginFormState;

    setForm((previous) => ({ ...previous, [fieldName]: value }));
    clearFieldErrors(fieldName);
  };

  const validateForm = () => {
    const nextErrors: LoginFormErrors = {};

    if (!form.email) {
      nextErrors.email = t('login.emailRequired');
    } else if (!validateEmail(form.email)) {
      nextErrors.email = t('login.emailInvalid');
    }

    if (!form.password) {
      nextErrors.password = t('login.passwordRequired');
    }

    dispatch({ type: 'SET', payload: nextErrors });
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(form.email, form.password);
      router.replace(redirectPath);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'login.failed', t);
      dispatch({ type: 'SET', payload: { form: errorMessage } });
    }
  };

  return {
    displayedFormError: errors.form || authError,
    errors,
    form,
    handleChange,
    handleSubmit,
    isLoading,
    t,
  };
}
