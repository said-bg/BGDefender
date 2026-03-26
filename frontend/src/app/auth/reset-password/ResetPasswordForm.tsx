'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useModalStore } from '@/store/modalStore';
import { resetPassword } from '@/services/auth';
import { validatePassword } from '@/utils/validation';
import { handleAuthError } from '@/utils/apiError';
import styles from './ResetPassword.module.css';

/**
 * Reset Password Form Component
 * Used when user opens reset-password link from email
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation('auth');
  const { setError } = useAuth();
  const { showModal, closeModal } = useModalStore();
  const hasAppliedLanguage = useRef(false);
  const hasShownInvalidModal = useRef(false);
  
  // Get reset token and language from URL
  const token = searchParams.get('token');
  const langParam = searchParams.get('lang');
  
  // Change language if provided in URL (on mount only)
  useEffect(() => {
    if (!hasAppliedLanguage.current && langParam && ['en', 'fi'].includes(langParam)) {
      if (i18n.language !== langParam) {
        i18n.changeLanguage(langParam);
      }
      hasAppliedLanguage.current = true;
    }
  }, [langParam, i18n]); // ✅ Seulement langParam - s'exécute UNE FOIS au mount
  
  // Clear form errors when language changes (for retrying with new language)
  useEffect(() => {
    setFormError('');
    setFieldErrors({});
  }, [i18n.language]);
  
  // Show invalid token modal if no token
  useEffect(() => {
    if (!token && !hasShownInvalidModal.current) {
      hasShownInvalidModal.current = true;
      showModal({
        type: 'error',
        title: t('alerts.invalidResetLink'),
        message: t('alerts.invalidResetLinkMessage'),
        confirmLabel: t('alerts.requestNewResetLink'),
        cancelLabel: t('alerts.cancel'),
        onConfirm: () => {
          router.push('/auth/forgot-password');
        },
        onCancel: () => {
          router.push('/auth/login');
        },
      });
    }
  }, [token, t, showModal, router]);
  
  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string[];
    confirmPassword?: string;
  }>({});

  // Validate password on change
  const passwordValidation = validatePassword(newPassword);
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmPasswordValid = newPassword === confirmPassword && confirmPassword !== '';
  const isFormValid = isPasswordValid && isConfirmPasswordValid && token;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      setFormError(t('resetPassword.invalidToken'));
      return;
    }

    // Validate
    const newErrors: typeof fieldErrors = {};

    if (!isPasswordValid) {
      // Translate error codes to messages
      newErrors.newPassword = passwordValidation.errors.map((error) => {
        if (error.code === 'minLength') {
          return t('password.minLength');
        } else if (error.code === 'noUppercase') {
          return t('password.noUppercase');
        } else if (error.code === 'noNumber') {
          return t('password.noNumber');
        }
        return 'Invalid password';
      });
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('resetPassword.passwordsMismatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      await resetPassword({
        token,
        newPassword: newPassword,
      });
      
      // Success - show modal
      const modalId = showModal({
        type: 'success',
        title: t('alerts.passwordResetSuccess'),
        message: t('alerts.passwordResetSuccessMessage'),
      });

      // Auto-redirect after 1 second
      setTimeout(() => {
        closeModal(modalId);
        router.push('/auth/login');
      }, 1000);
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = handleAuthError(error, 'resetPassword.failed', t);
      
      // Check if token is expired/invalid
      if (errorMessage.toLowerCase().includes('expired') || 
          errorMessage.toLowerCase().includes('invalid') || 
          errorMessage.toLowerCase().includes('used') ||
          errorMessage.toLowerCase().includes('vanhentunut')) {
        setFormError('');
        showModal({
          type: 'error',
          title: t('alerts.invalidResetLink'),
          message: t('alerts.invalidResetLinkMessage'),
          confirmLabel: t('alerts.requestNewResetLink'),
          onConfirm: () => {
            router.replace('/auth/forgot-password');
          },
        });
      } else if (errorMessage.toLowerCase().includes('same') || 
                 errorMessage.toLowerCase().includes('different') ||
                 errorMessage.toLowerCase().includes('erilainen')) {
        // Same password error (works for EN and FI messages)
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

  // Clear field error on input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.newPassword;
      return newErrors;
    });
    // Clear form error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.confirmPassword;
      return newErrors;
    });
    // Clear form error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  // If no token, don't render the form (modal will show)
  if (!token) {
    return null;
  }

  // Main form
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{t('resetPassword.title')}</h1>
        <p className={styles.subtext}>{t('resetPassword.subtitle')}</p>

        {formError && (
          <div className={styles.errorMessage}>{formError}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* New Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              {t('resetPassword.newPassword')}
            </label>
            <input
              id="newPassword"
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={handlePasswordChange}
              disabled={loading}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {fieldErrors.newPassword && (
              <div className={styles.passwordRequirements}>
                {fieldErrors.newPassword.map((error, idx) => (
                  <div key={idx} className={styles.requirementItem}>
                    <span className={`${styles.requirementIcon} ${styles.requirementInvalid}`}>
                      ✕
                    </span>
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}
            {!fieldErrors.newPassword && newPassword && (
              <div className={styles.passwordRequirements}>
                <div className={styles.requirementItem}>
                  <span className={`${styles.requirementIcon} ${passwordValidation.isValid ? styles.requirementValid : styles.requirementInvalid}`}>
                    {passwordValidation.isValid ? '✓' : '✕'}
                  </span>
                  <span>{t('resetPassword.requirement1')}</span>
                </div>
                <div className={styles.requirementItem}>
                  <span className={`${styles.requirementIcon} ${/[A-Z]/.test(newPassword) ? styles.requirementValid : styles.requirementInvalid}`}>
                    {/[A-Z]/.test(newPassword) ? '✓' : '✕'}
                  </span>
                  <span>{t('resetPassword.requirement2')}</span>
                </div>
                <div className={styles.requirementItem}>
                  <span className={`${styles.requirementIcon} ${/[0-9]/.test(newPassword) ? styles.requirementValid : styles.requirementInvalid}`}>
                    {/[0-9]/.test(newPassword) ? '✓' : '✕'}
                  </span>
                  <span>{t('resetPassword.requirement3')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              {t('resetPassword.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading}
              placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <div className={styles.fieldError}>{fieldErrors.confirmPassword}</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.button}
            disabled={loading || !isFormValid}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? t('resetPassword.resetting') : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
