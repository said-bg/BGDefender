'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ContactPage.module.css';

const SUPPORT_EMAIL = 'support@bgdefender.com';

type RequestType = 'general' | 'support' | 'creator' | 'premium';

type ContactFormState = {
  name: string;
  email: string;
  message: string;
};

const INITIAL_FORM_STATE: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

export default function ContactPage() {
  const { t } = useTranslation('contact');
  const [requestType, setRequestType] = useState<RequestType>('general');
  const [formState, setFormState] = useState<ContactFormState>(INITIAL_FORM_STATE);

  const requestTypes = useMemo(
    () =>
      [
        {
          id: 'general',
          title: t('types.general.title', { defaultValue: 'General information' }),
          description: t('types.general.description', {
            defaultValue: 'Questions about the platform, courses, or availability.',
          }),
        },
        {
          id: 'support',
          title: t('types.support.title', { defaultValue: 'Technical support' }),
          description: t('types.support.description', {
            defaultValue: 'Something is not working as expected? We can help.',
          }),
        },
        {
          id: 'creator',
          title: t('types.creator.title', { defaultValue: 'Creator access' }),
          description: t('types.creator.description', {
            defaultValue: 'Request access to create and manage learning content.',
          }),
        },
        {
          id: 'premium',
          title: t('types.premium.title', { defaultValue: 'Premium access' }),
          description: t('types.premium.description', {
            defaultValue: 'Ask about premium access, tailored plans, or upgrades.',
          }),
        },
      ] satisfies Array<{ id: RequestType; title: string; description: string }>,
    [t],
  );

  const activeRequestType =
    requestTypes.find((type) => type.id === requestType) ?? requestTypes[0];
  const requestTypeLabel = activeRequestType.title;
  const normalizedSubject = t('mail.defaultSubject', {
    defaultValue: '{{requestType}} request',
    requestType: requestTypeLabel,
  });

  const mailtoHref = useMemo(() => {
    const lines = [
      `${t('mail.labels.name', { defaultValue: 'Name' })}: ${formState.name || '-'}`,
      `${t('mail.labels.email', { defaultValue: 'Email' })}: ${formState.email || '-'}`,
      `${t('mail.labels.requestType', { defaultValue: 'Request type' })}: ${requestTypeLabel}`,
      '',
      `${t('mail.labels.message', { defaultValue: 'Message' })}:`,
      formState.message || '-',
    ];

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      normalizedSubject,
    )}&body=${encodeURIComponent(lines.join('\n'))}`;
  }, [
    formState.email,
    formState.message,
    formState.name,
    normalizedSubject,
    requestTypeLabel,
    t,
  ]);

  const hasRequiredFields =
    formState.name.trim().length > 0 &&
    formState.email.trim().length > 0 &&
    formState.message.trim().length > 0;

  const updateField = (field: keyof ContactFormState, value: string) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.contactShell}>
          <div className={styles.headerBlock}>
            <p className={styles.eyebrow}>
              {t('hero.eyebrow', { defaultValue: 'Contact BG Defender' })}
            </p>
            <h1 className={styles.title}>
              {t('contact.simpleTitle', {
                defaultValue: 'Contact the team',
              })}
            </h1>
            <p className={styles.description}>
              {t('contact.simpleDescription', {
                defaultValue:
                  'Choose a topic, write your message, and we will prepare the email for you.',
              })}
            </p>
          </div>

          <article id="contact-form" className={styles.formCard}>
            <div className={styles.typeRow}>
              {requestTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`${styles.typeButton} ${
                    requestType === type.id ? styles.typeButtonActive : ''
                  }`}
                  onClick={() => setRequestType(type.id)}
                >
                  <strong className={styles.typeTitle}>{type.title}</strong>
                </button>
              ))}
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t('fields.name', { defaultValue: 'Full name' })}
                </span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder={t('fields.namePlaceholder', { defaultValue: 'Your name' })}
                  className={styles.input}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  {t('fields.email', { defaultValue: 'Email address' })}
                </span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder={t('fields.emailPlaceholder', { defaultValue: 'you@example.com' })}
                  className={styles.input}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>
                  {t('fields.message', { defaultValue: 'Message' })}
                </span>
                <textarea
                  value={formState.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  placeholder={t('contact.messagePlaceholder', {
                    defaultValue: 'Write your message here.',
                  })}
                  className={`${styles.input} ${styles.textarea}`}
                  rows={8}
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <a
                href={hasRequiredFields ? mailtoHref : undefined}
                className={`${styles.primaryAction} ${!hasRequiredFields ? styles.actionDisabled : ''}`}
                aria-disabled={!hasRequiredFields}
              >
                {t('form.primaryAction', { defaultValue: 'Prepare email' })}
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.secondaryAction}>
                {t('contact.directEmail', { defaultValue: 'Or email us directly' })}
              </a>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
