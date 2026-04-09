import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '@/services/auth';
import { handleAuthError } from '@/utils/apiError';
import { validateEmail } from '@/utils/validation';
import type { ForgotPasswordFormErrors, ForgotPasswordFormState } from './forgotPassword.types';

const initialForm: ForgotPasswordFormState = {
  email: '',
};

export function useForgotPasswordForm() {
  const { t } = useTranslation('auth');
  const [form, setForm] = useState<ForgotPasswordFormState>(initialForm);
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearFieldErrors = (name: keyof ForgotPasswordFormErrors) => {
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }));
    }

    if (errors.form) {
      setErrors((previous) => ({ ...previous, form: undefined }));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof ForgotPasswordFormState;

    setForm((previous) => ({ ...previous, [fieldName]: value }));
    clearFieldErrors(fieldName);
  };

  const validateForm = () => {
    const nextErrors: ForgotPasswordFormErrors = {};

    if (!form.email) {
      nextErrors.email = t('forgotPassword.emailRequired');
    } else if (!validateEmail(form.email)) {
      nextErrors.email = t('forgotPassword.emailInvalid');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({ email: form.email });
      setSuccess(true);
      setForm(initialForm);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'forgotPassword.failed', t);
      setErrors({ form: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    errors,
    form,
    handleChange,
    handleSubmit,
    isLoading,
    success,
    t,
  };
}
