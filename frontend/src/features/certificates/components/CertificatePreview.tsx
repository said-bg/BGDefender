'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CertificateStatus, type CertificateRecord } from '@/types/api';
import styles from './CertificatePreview.module.css';

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
          {t('previewTitle')}
        </h2>
        <p className={styles.sectionDescription}>
          {t('previewDescription')}
        </p>
      </div>

      {selectedCertificate?.status === CertificateStatus.PENDING_PROFILE ? (
        <div className={styles.profilePrompt}>
          <h3 className={styles.profilePromptTitle}>
            {t('pendingTitle')}
          </h3>
          <p className={styles.profilePromptCopy}>
            {t('pendingDescription')}
          </p>
          <Link href="/account" className={styles.profileAction}>
            {t('completeProfile')}
          </Link>
        </div>
      ) : null}

      {selectedCertificate ? (
        <div className={styles.certificateFrame}>
          <div className={styles.certificateHeader}>
            <div className={styles.certificateInstitution}>
              <p className={styles.institutionName}>
                {t('institutionName')}
              </p>
              <p className={styles.institutionLocation}>
                {t('institutionLocation')}
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
            {t('certificateHeading')}
          </h3>
          <p className={styles.certificateLead}>
            {t('certificateLead')}
          </p>
          <p className={styles.recipientName}>
            {selectedCertificateName || t('learnerFallback')}
          </p>
          <p className={styles.certificateSubLead}>
            {t('certificateSubLead')}
          </p>
          <p className={styles.courseName}>{selectedCertificateTitle}</p>

          <div className={styles.certificateFooter}>
            <div className={styles.footerCard}>
              <span className={styles.footerLabel}>
                {t('issuedDateLabel')}
              </span>
              <span className={styles.footerValue}>{issuedDate}</span>
            </div>
            <div className={styles.footerCard}>
              <span className={styles.footerLabel}>
                {t('certificateCodeLabel')}
              </span>
              <span className={styles.footerValue}>{selectedCertificate.certificateCode}</span>
            </div>
          </div>

          <div className={styles.certificateSignatures}>
            <div className={styles.signatureBlock}>
              <span className={styles.signatureLine} />
              <span className={styles.signatureLabel}>
                {t('issuerLabel')}
              </span>
            </div>
            <div className={styles.signatureBlock}>
              <span className={styles.signatureLine} />
              <span className={styles.signatureLabel}>
                {t('programLabel')}
              </span>
            </div>
          </div>

          <p className={styles.brandNote}>
            {t('brandNote')}
          </p>
        </div>
      ) : (
        <p className={styles.helperText}>
          {hasIncompleteProfile
            ? t('noSelectionWithProfilePrompt')
            : t('noSelection')}
        </p>
      )}
    </section>
  );
}
