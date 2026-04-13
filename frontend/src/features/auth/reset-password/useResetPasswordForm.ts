import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '@/services/auth';
import { useAuth } from '@/hooks';
import { useModalStore } from '@/store/modalStore';
import { handleAuthError } from '@/utils/apiError';
import { validatePassword } from '@/utils/validation';
import type { ResetPasswordFieldErrors } from './resetPassword.types';

const isResetLinkError = (message: string) => {
  const normalized = message.toLowerCase();
  return ['expired', 'invalid', 'used', 'vanhentunut'].some((fragment) =>
    normalized.includes(fragment),
  );
};

const isSamePasswordError = (message: string) => {
  const normalized = message.toLowerCase();
  return ['same', 'different', 'erilainen'].some((fragment) =>
    normalized.includes(fragment),
  );
};

export function useResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation('auth');
  const { setError } = useAuth();
  const { showModal, closeModal } = useModalStore();
  const hasAppliedLanguage = useRef(false);
  const hasShownInvalidModal = useRef(false);
  const token = searchParams.get('token');
  const langParam = searchParams.get('lang');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});

  useEffect(() => {
    if (!hasAppliedLanguage.current && langParam && ['en', 'fi'].includes(langParam)) {
      if (i18n.language !== langParam) {
        void i18n.changeLanguage(langParam);
      }
      hasAppliedLanguage.current = true;
    }
  }, [langParam, i18n]);

  useEffect(() => {
    setFormError('');
    setFieldErrors({});
  }, [i18n.language]);

  useEffect(() => {
    if (!token && !hasShownInvalidModal.current) {
      hasShownInvalidModal.current = true;
      showModal({
        type: 'error',
        title: t('alerts.invalidResetLink'),
        message: t('alerts.invalidResetLinkMessage'),
        confirmLabel: t('alerts.requestNewResetLink'),
        cancelLabel: t('alerts.cancel'),
        onConfirm: () => router.push('/forgot-password'),
        onCancel: () => router.push('/login'),
      });
    }
  }, [token, t, showModal, router]);

  const passwordValidation = validatePassword(newPassword);
  const isConfirmPasswordValid = newPassword === confirmPassword && confirmPassword !== '';
  const isFormValid = passwordValidation.isValid && isConfirmPasswordValid && Boolean(token);

  const passwordChecks = [
    { key: 'length', label: t('resetPassword.requirement1'), isValid: newPassword.length >= 8 },
    { key: 'uppercase', label: t('resetPassword.requirement2'), isValid: /[A-Z]/.test(newPassword) },
    { key: 'number', label: t('resetPassword.requirement3'), isValid: /[0-9]/.test(newPassword) },
  ];

  const buildFieldErrors = () => {
    const nextErrors: ResetPasswordFieldErrors = {};

    if (!passwordValidation.isValid) {
      nextErrors.newPassword = passwordValidation.errors.map((error) => {
        if (error.code === 'minLength') {
          return t('password.minLength');
        }
        if (error.code === 'noUppercase') {
          return t('password.noUppercase');
        }
        if (error.code === 'noNumber') {
          return t('password.noNumber');
        }
        return t('password.invalid', { defaultValue: 'Invalid password' });
      });
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = t('resetPassword.passwordsMismatch');
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setFormError(t('resetPassword.invalidToken'));
      return;
    }

    const nextErrors = buildFieldErrors();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      await resetPassword({ token, newPassword });
      const modalId = showModal({
        type: 'success',
        title: t('alerts.passwordResetSuccess'),
        message: t('alerts.passwordResetSuccessMessage'),
      });

      setTimeout(() => {
        closeModal(modalId);
        router.push('/login');
      }, 1000);
    } catch (error) {
      const errorMessage = handleAuthError(error, 'resetPassword.failed', t);

      if (isResetLinkError(errorMessage)) {
        setFormError('');
        showModal({
          type: 'error',
          title: t('alerts.invalidResetLink'),
          message: t('alerts.invalidResetLinkMessage'),
          confirmLabel: t('alerts.requestNewResetLink'),
          onConfirm: () => router.replace('/forgot-password'),
        });
      } else if (isSamePasswordError(errorMessage)) {
        setFormError('');
        showModal({
          type: 'warning',
          title: t('alerts.samePassword'),
          message: t('alerts.samePasswordMessage'),
          confirmLabel: t('alerts.ok'),
        });
      } else {
        setFormError(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value);
    setFieldErrors((previous) => ({ ...previous, newPassword: undefined }));
    if (formError) {
      setFormError('');
    }
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }));
    if (formError) {
      setFormError('');
    }
  };

  return {
    confirmPassword,
    fieldErrors,
    formError,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleSubmit,
    isFormValid,
    loading,
    newPassword,
    passwordChecks,
    t,
    token,
  };
}
