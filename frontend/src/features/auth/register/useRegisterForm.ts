import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useModalStore } from '@/store/modalStore';
import { handleAuthError } from '@/utils/apiError';
import { validateEmail, validatePassword } from '@/utils/validation';
import type { RegisterErrorAction, RegisterFormErrors, RegisterFormState } from './register.types';

const errorsReducer = (
  state: RegisterFormErrors,
  action: RegisterErrorAction,
): RegisterFormErrors => {
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

const initialForm: RegisterFormState = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function useRegisterForm() {
  const router = useRouter();
  const { t, i18n } = useTranslation('auth');
  const { register, isLoading, error: authError, setError } = useAuth();
  const { showModal, closeModal } = useModalStore();
  const [form, setForm] = useState<RegisterFormState>(initialForm);
  const [errors, dispatch] = useReducer(errorsReducer, {});

  useEffect(() => {
    dispatch({ type: 'CLEAR' });
    if (authError) {
      setError(null);
    }
  }, [authError, i18n.language, setError]);

  const clearFieldErrors = (name: keyof RegisterFormErrors) => {
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
    const fieldName = name as keyof RegisterFormState;

    setForm((previous) => ({ ...previous, [fieldName]: value }));
    clearFieldErrors(fieldName);
  };

  const validateForm = () => {
    const nextErrors: RegisterFormErrors = {};

    if (!form.email) {
      nextErrors.email = t('register.emailRequired');
    } else if (!validateEmail(form.email)) {
      nextErrors.email = t('register.emailInvalid');
    }

    if (!form.password) {
      nextErrors.password = t('register.passwordRequired');
    } else {
      const passwordValidation = validatePassword(form.password);
      const firstError = passwordValidation.errors[0];

      if (firstError?.code === 'minLength') {
        nextErrors.password = t('password.minLength');
      } else if (firstError?.code === 'noUppercase') {
        nextErrors.password = t('password.noUppercase');
      } else if (firstError?.code === 'noNumber') {
        nextErrors.password = t('password.noNumber');
      }
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = t('register.confirmPasswordRequired');
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = t('register.passwordsMismatch');
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

      setForm(initialForm);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'register.failed', t);
      dispatch({ type: 'SET', payload: { form: errorMessage } });
    }
  };

  return {
    authError,
    errors,
    form,
    handleChange,
    handleSubmit,
    isLoading,
    t,
  };
}