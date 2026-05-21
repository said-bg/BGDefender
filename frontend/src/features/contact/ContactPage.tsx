'use client';

import type { FormEvent, ReactNode, SVGProps } from 'react';
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

type ContactFormErrors = Partial<Record<keyof ContactFormState | 'form', string>>;

const INITIAL_FORM_STATE: ContactFormState = {
  name: '',
  email: '',
  message: '',
};

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <path d="m5.5 8 6.5 5 6.5-5" />
    </svg>
  );
}

function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.2l2.8 1.8" />
    </svg>
  );
}

function IconHeadset(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 13a7 7 0 0 1 14 0" />
      <rect x="4" y="12" width="3.5" height="6.5" rx="1.5" />
      <rect x="16.5" y="12" width="3.5" height="6.5" rx="1.5" />
      <path d="M7.5 19c1 1 2.5 1.5 4.5 1.5h1.5" />
    </svg>
  );
}

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 18.5c1.7-3 4-4.5 6.5-4.5s4.8 1.5 6.5 4.5" />
    </svg>
  );
}

function IconSend(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 3 10 14" />
      <path d="m21 3-7 18-4-7-7-4 18-7Z" />
    </svg>
  );
}

function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2.2" />
      <path d="M8.5 10.5V8.4A3.6 3.6 0 0 1 12 4.8a3.6 3.6 0 0 1 3.5 3.6v2.1" />
    </svg>
  );
}

function IconChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

function ContactIllustration() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <svg
        className={styles.illustrationGraphic}
        viewBox="20 30 500 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id="contactGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(0 -18) translate(210 168) rotate(90) scale(156 238)"
          >
            <stop offset="0" stopColor="#FFF4D8" />
            <stop offset="0.58" stopColor="#FFF8EB" stopOpacity="0.92" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          
          <filter id="contactLetterShadow" x="60" y="0" width="300" height="340" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#F5B64F" floodOpacity="0.16" />
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.06" />
          </filter>
          
          <filter id="contactEnvelopeShadow" x="20" y="120" width="360" height="260" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#F6BF5F" floodOpacity="0.22" />
          </filter>
          
          <filter id="contactPlaneShadow" x="384" y="28" width="114" height="90" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#FFAE32" floodOpacity="0.2" />
          </filter>
        </defs>

        <ellipse cx="206" cy="170" rx="224" ry="132" fill="url(#contactGlow)" />

        {/* Petits losanges décoratifs */}
        <path d="M52 148L58 155L65 148L58 141L52 148Z" fill="#FFEBC3" fillOpacity="0.7" />
        <path d="M344 96L350 103L357 96L350 89L344 96Z" fill="#FFEBC3" fillOpacity="0.7" />
        <path d="M404 228L410 235L417 228L410 221L404 228Z" fill="#FFEBC3" fillOpacity="0.7" />

        {/* 1. Fond intérieur de l'enveloppe (Plus haut pour un meilleur ratio) */}
        <rect x="74" y="160" width="232" height="142" fill="#D9820B" />

        {/* 2. La feuille de papier (Design flat, carré, avec coin corné) */}
        <g filter="url(#contactLetterShadow)">
          {/* Corps du papier */}
          <path d="M102 28 L244 28 L284 68 L284 278 L102 278 Z" fill="#F8FAFC" />
          {/* Coin plié */}
          <path d="M244 28 L244 68 L284 68 Z" fill="#CBD5E1" />
        </g>
        
        {/* Lignes grises simulant le texte sur le papier */}
        <rect x="126" y="80" width="134" height="6" rx="3" fill="#CBD5E1" />
        <rect x="126" y="108" width="134" height="6" rx="3" fill="#CBD5E1" />
        <rect x="126" y="136" width="134" height="6" rx="3" fill="#CBD5E1" />
        <rect x="126" y="164" width="134" height="6" rx="3" fill="#CBD5E1" />
        <rect x="126" y="192" width="90" height="6" rx="3" fill="#CBD5E1" />
        
        {/* Trajets en pointillés de l'avion */}
        <path
          d="M212 252C236 257 260 252 281 238C296 228 310 212 323 188"
          stroke="#F2B13A"
          strokeWidth="3.4"
          strokeDasharray="8 9"
          strokeLinecap="round"
        />
        <path
          d="M316 184C311 177 311 169 317 164C324 159 333 160 337 168C341 176 336 184 329 185C324 185 320 185 316 184Z"
          stroke="#F2B13A"
          strokeWidth="3.4"
          strokeDasharray="8 9"
          strokeLinecap="round"
        />
        <path
          d="M332 185C353 175 372 157 390 133C402 117 414 100 426 84"
          stroke="#F2B13A"
          strokeWidth="3.4"
          strokeDasharray="8 9"
          strokeLinecap="round"
        />

        {/* 3. Devant de l'enveloppe (Ajusté pour être plus grand et net) */}
        <g filter="url(#contactEnvelopeShadow)">
          {/* Rabat gauche */}
          <path d="M74 160 L190 230 L74 302 Z" fill="#F5A623" />
          {/* Rabat droit */}
          <path d="M306 160 L190 230 L306 302 Z" fill="#F5A623" />
          {/* Rabat inférieur (vient se superposer au centre) */}
          <path d="M74 302 L190 220 L306 302 Z" fill="#FFC867" />
        </g>

        {/* 4. L'avion en papier */}
        <g filter="url(#contactPlaneShadow)">
          <path d="M402 56L486 42L438 98L427 76L402 56Z" fill="#FF9F11" />
          <path d="M434 56L486 42L427 76L434 56Z" fill="#FFC15C" />
        </g>
        <path d="M427 76L438 98" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M486 42L427 76" stroke="#FFF6E1" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ContactInfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className={styles.infoCard}>
      <div className={styles.infoIconWrap}>{icon}</div>
      <div className={styles.infoCopy}>
        <h3 className={styles.infoTitle}>{title}</h3>
        <p className={styles.infoDescription}>{description}</p>
      </div>
    </article>
  );
}

export default function ContactPage() {
  const { t } = useTranslation('contact');
  const [requestType, setRequestType] = useState<ContactRequestType>('general');
  const [formState, setFormState] = useState<ContactFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const nameErrorId = errors.name ? 'contact-name-error' : undefined;
  const emailErrorId = errors.email ? 'contact-email-error' : undefined;
  const messageErrorId = errors.message ? 'contact-message-error' : undefined;
  const formErrorId = errors.form ? 'contact-form-error' : undefined;

  const requestTypes = useMemo(
    () =>
      [
        { id: 'general', title: t('types.general.title') },
        { id: 'support', title: t('types.support.title') },
        { id: 'creator', title: t('types.creator.title') },
        { id: 'premium', title: t('types.premium.title') },
      ] satisfies Array<{ id: ContactRequestType; title: string }>,
    [t],
  );

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
      setRequestType('general');
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
      <section className={styles.shell}>
        <section className={styles.infoPanel}>
          <p className={styles.eyebrow}>{t('hero.eyebrow')}</p>
          <h1 className={styles.title}>{t('hero.title')}</h1>
          <p className={styles.description}>{t('hero.description')}</p>

          <ContactIllustration />

          <div className={styles.infoStack}>
            <ContactInfoCard
              icon={<IconMail className={styles.infoIcon} />}
              title={t('details.emailTitle')}
              description={SUPPORT_EMAIL}
            />
            <ContactInfoCard
              icon={<IconClock className={styles.infoIcon} />}
              title={t('details.responseTitle')}
              description={t('details.responseDescription')}
            />
            <ContactInfoCard
              icon={<IconHeadset className={styles.infoIcon} />}
              title={t('details.supportTitle')}
              description={t('details.supportDescription')}
            />
          </div>
        </section>

        <article id="contact-form" className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{t('form.title')}</h2>
            <p className={styles.formDescription}>{t('form.description')}</p>
          </div>

          {successMessage ? (
            <div className={styles.successMessage} role="status" aria-live="polite">
              {successMessage}
            </div>
          ) : null}

          {errors.form ? (
            <div id={formErrorId} className={styles.errorMessage} role="alert">
              {errors.form}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('fields.name')}</span>
                <div className={styles.inputWrap}>
                  <IconUser className={styles.inputIcon} />
                  <input
                    type="text"
                    autoComplete="name"
                    value={formState.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder={t('fields.namePlaceholder')}
                    className={styles.input}
                    disabled={isSending}
                  />
                </div>
                {errors.name ? (
                  <span id={nameErrorId} className={styles.fieldError} role="alert">
                    {errors.name}
                  </span>
                ) : null}
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>{t('fields.email')}</span>
                <div className={styles.inputWrap}>
                  <IconMail className={styles.inputIcon} />
                  <input
                    type="email"
                    autoComplete="email"
                    value={formState.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder={t('fields.emailPlaceholder')}
                    className={styles.input}
                    disabled={isSending}
                  />
                </div>
                {errors.email ? (
                  <span id={emailErrorId} className={styles.fieldError} role="alert">
                    {errors.email}
                  </span>
                ) : null}
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>{t('fields.subject')}</span>
                <div className={`${styles.inputWrap} ${styles.selectWrap}`}>
                  <select
                    value={requestType}
                    onChange={(event) =>
                      setRequestType(event.target.value as ContactRequestType)
                    }
                    className={`${styles.input} ${styles.selectInput}`}
                    disabled={isSending}
                  >
                    {requestTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.title}
                      </option>
                    ))}
                  </select>
                  <IconChevron className={styles.selectIcon} />
                </div>
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.fieldLabel}>{t('fields.message')}</span>
                <textarea
                  autoComplete="off"
                  value={formState.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  placeholder={t('fields.messagePlaceholder')}
                  className={`${styles.input} ${styles.textarea}`}
                  rows={8}
                  disabled={isSending}
                />
                {errors.message ? (
                  <span id={messageErrorId} className={styles.fieldError} role="alert">
                    {errors.message}
                  </span>
                ) : null}
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={`${styles.primaryAction} ${isSending ? styles.actionDisabled : ''}`}
                disabled={isSending}
              >
                <IconSend className={styles.buttonIcon} />
                {isSending ? t('form.sending') : t('form.primaryAction')}
              </button>
            </div>

            <p className={styles.privacyNote}>
              <IconLock className={styles.privacyIcon} />
              <span>{t('form.privacyNote')}</span>
            </p>

            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.secondaryAction}>
              {t('form.secondaryAction')}
            </a>
          </form>
        </article>
      </section>
    </main>
  );
}
