'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendContactRequest } from '@/services/contact';
import type { ContactRequestType } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import { validateEmail } from '@/utils/validation';
import styles from './ContactPage.module.css';

const SUPPORT_EMAIL = 'support@bgdefender.com';

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

type ContactFormErrors = Partial<
  Record<keyof ContactFormState | 'form', string>
>;

const INITIAL_FORM_STATE: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

export default function ContactPage() {
  const { t } = useTranslation('contact');
  const [requestType, setRequestType] = useState<ContactRequestType>('general');
  const [formState, setFormState] = useState<ContactFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const requestTypes = useMemo(
    () =>
      [
        {
          id: 'general',
          title: t('types.general.title'),
          description: t('types.general.description'),
        },
        {
          id: 'support',
          title: t('types.support.title'),
          description: t('types.support.description'),
        },
        {
          id: 'creator',
          title: t('types.creator.title'),
          description: t('types.creator.description'),
        },
        {
          id: 'premium',
          title: t('types.premium.title'),
          description: t('types.premium.description'),
        },
      ] satisfies Array<{ id: ContactRequestType; title: string; description: string }>,
    [t],
  );

  const activeRequestType =
    requestTypes.find((type) => type.id === requestType) ?? requestTypes[0];

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }

    if (errors.form) {
      setErrors((previous) => ({ ...previous, form: undefined }));
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const nextErrors: ContactFormErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = t('validation.nameRequired');
    }

    if (!formState.email.trim()) {
      nextErrors.email = t('validation.emailRequired');
    } else if (!validateEmail(formState.email.trim())) {
      nextErrors.email = t('validation.emailInvalid');
    }

    if (!formState.message.trim()) {
      nextErrors.message = t('validation.messageRequired');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSending(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await sendContactRequest({
        requestType,
        name: formState.name.trim(),
        email: formState.email.trim(),
        message: formState.message.trim(),
      });

      setFormState(INITIAL_FORM_STATE);
      setSuccessMessage(response.message);
    } catch (error) {
      setErrors({
        form: getApiErrorMessage(error, t('form.failed')),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <header className={styles.headerBlock}>
          <p className={styles.eyebrow}>{t('hero.eyebrow')}</p>
          <h1 className={styles.title}>{t('hero.title')}</h1>
          <p className={styles.description}>{t('hero.description')}</p>
        </header>

        <article id="contact-form" className={styles.formPanel}>
          {successMessage ? (
            <div className={styles.successMessage}>{successMessage}</div>
          ) : null}

          {errors.form ? <div className={styles.errorMessage}>{errors.form}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.topicBlock}>
              <label className={styles.topicLabel}>{t('fields.requestType')}</label>
              <div className={styles.typeRow}>
                {requestTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`${styles.typeButton} ${
                      requestType === type.id ? styles.typeButtonActive : ''
                    }`}
                    onClick={() => setRequestType(type.id)}
                    aria-pressed={requestType === type.id}
                    disabled={isSending}
                  >
                    {type.title}
                  </button>
                ))}
              </div>
              <p className={styles.topicDescription}>{activeRequestType.description}</p>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('fields.name')}</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder={t('fields.namePlaceholder')}
                  className={styles.input}
                  disabled={isSending}
                />
                {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('fields.email')}</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder={t('fields.emailPlaceholder')}
                  className={styles.input}
                  disabled={isSending}
                />
                {errors.email ? <span className={styles.fieldError}>{errors.email}</span> : null}
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>{t('fields.message')}</span>
                <textarea
                  value={formState.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  placeholder={t('fields.messagePlaceholder')}
                  className={`${styles.input} ${styles.textarea}`}
                  rows={8}
                  disabled={isSending}
                />
                {errors.message ? (
                  <span className={styles.fieldError}>{errors.message}</span>
                ) : null}
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={`${styles.primaryAction} ${isSending ? styles.actionDisabled : ''}`}
                disabled={isSending}
              >
                {isSending ? t('form.sending') : t('form.primaryAction')}
              </button>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.secondaryAction}>
                {t('form.secondaryAction')}
              </a>
            </div>
          </form>

          <p className={styles.formNote}>{t('form.note')}</p>
        </article>
      </section>
    </main>
  );
}
