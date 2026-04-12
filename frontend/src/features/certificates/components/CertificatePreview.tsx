'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CertificateStatus, type CertificateRecord } from '@/types/api';
import styles from '../CertificatesPage.module.css';

type CertificatePreviewProps = {
  hasIncompleteProfile: boolean;
  language: string;
  selectedCertificate: CertificateRecord | null;
  selectedCertificateName: string;
  selectedCertificateTitle: string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CertificatePreview({
  hasIncompleteProfile,
  language,
  selectedCertificate,
  selectedCertificateName,
  selectedCertificateTitle,
  t,
}: CertificatePreviewProps) {
  const issuedDate = (() => {
    if (!selectedCertificate?.issuedAt) {
      return '-';
    }

    return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(selectedCertificate.issuedAt));
  })();

  return (
    <section className={styles.previewCard}>
      <div className={styles.previewHeader}>
        <h2 className={styles.sectionTitle}>
          {t('previewTitle', { defaultValue: 'Certificate preview' })}
        </h2>
        <p className={styles.sectionDescription}>
          {t('previewDescription', {
            defaultValue:
              'A clean certificate template now, with room to swap in a custom branded design later.',
          })}
        </p>
      </div>

      {selectedCertificate?.status === CertificateStatus.PENDING_PROFILE ? (
        <div className={styles.profilePrompt}>
          <h3 className={styles.profilePromptTitle}>
            {t('pendingTitle', {
              defaultValue: 'Complete your profile to generate this certificate',
            })}
          </h3>
          <p className={styles.profilePromptCopy}>
            {t('pendingDescription', {
              defaultValue:
                'You already passed the certifying course. Add your first and last name in your profile and we will issue the certificate automatically.',
            })}
          </p>
          <Link href="/account" className={styles.profileAction}>
            {t('completeProfile', { defaultValue: 'Complete profile' })}
          </Link>
        </div>
      ) : null}

      {selectedCertificate ? (
        <div className={styles.certificateFrame}>
          <div className={styles.certificateHeader}>
            <div className={styles.certificateInstitution}>
              <p className={styles.institutionName}>
                {t('institutionName', { defaultValue: 'BG Defender Academy' })}
              </p>
              <p className={styles.institutionLocation}>
                {t('institutionLocation', {
                  defaultValue: 'Cybersecurity Training Platform',
                })}
              </p>
            </div>
            <div className={styles.certificateLogoWrap}>
              <Image
                src="/assets/images/bgdefender.jpeg"
                alt="BG Defender"
                width={70}
                height={70}
                className={styles.certificateLogo}
              />
            </div>
          </div>
          <h3 className={styles.certificateHeading}>
            {t('certificateHeading', {
              defaultValue: 'Certificate of Completion',
            })}
          </h3>
          <p className={styles.certificateLead}>
            {t('certificateLead', { defaultValue: 'This certifies that' })}
          </p>
          <p className={styles.recipientName}>
            {selectedCertificateName || t('learnerFallback', { defaultValue: 'Learner' })}
          </p>
          <p className={styles.certificateSubLead}>
            {t('certificateSubLead', {
              defaultValue: 'has successfully completed the course',
            })}
          </p>
          <p className={styles.courseName}>{selectedCertificateTitle}</p>

          <div className={styles.certificateFooter}>
            <div className={styles.footerCard}>
              <span className={styles.footerLabel}>
                {t('issuedDateLabel', { defaultValue: 'Issued on' })}
              </span>
              <span className={styles.footerValue}>{issuedDate}</span>
            </div>
            <div className={styles.footerCard}>
              <span className={styles.footerLabel}>
                {t('certificateCodeLabel', { defaultValue: 'Certificate ID' })}
              </span>
              <span className={styles.footerValue}>{selectedCertificate.certificateCode}</span>
            </div>
          </div>

          <div className={styles.certificateSignatures}>
            <div className={styles.signatureBlock}>
              <span className={styles.signatureLine} />
              <span className={styles.signatureLabel}>
                {t('issuerLabel', { defaultValue: 'Issuer' })}
              </span>
            </div>
            <div className={styles.signatureBlock}>
              <span className={styles.signatureLine} />
              <span className={styles.signatureLabel}>
                {t('programLabel', { defaultValue: 'Program director' })}
              </span>
            </div>
          </div>

          <p className={styles.brandNote}>
            {t('brandNote', { defaultValue: 'Issued by BG Defender Academy' })}
          </p>
        </div>
      ) : (
        <p className={styles.helperText}>
          {hasIncompleteProfile
            ? t('noSelectionWithProfilePrompt', {
                defaultValue:
                  'Once you pass a certifying course, complete your profile and your certificate will appear here.',
              })
            : t('noSelection', {
                defaultValue: 'Select a certificate from the list to preview it here.',
              })}
        </p>
      )}
    </section>
  );
}
