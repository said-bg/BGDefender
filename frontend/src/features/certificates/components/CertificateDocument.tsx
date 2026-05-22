'use client';

import Image from 'next/image';
import type { CertificateRecord } from '@/types/api';
import { getCertificateSignerLabel } from '../lib/certificates.utils';
import styles from './CertificatePreview.module.css';

type CertificateDocumentProps = {
  certificate: CertificateRecord;
  certificateName: string;
  certificateTitle: string;
  issuedDate: string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CertificateDocument({
  certificate,
  certificateName,
  certificateTitle,
  issuedDate,
  t,
}: CertificateDocumentProps) {
  const renderSignatureBlock = (
    signer: CertificateRecord['director'] | CertificateRecord['programDirector'],
    fallbackLabel: string,
  ) => (
    <div className={styles.signatureBlock}>
      {signer?.signatureData ? (
        <img
          src={signer.signatureData}
          alt=""
          className={styles.signatureArtwork}
        />
      ) : (
        <div className={styles.signatureArtworkPlaceholder} />
      )}
      <span className={styles.signatureLine} />
      {signer?.fullName ? (
        <span className={styles.signatureName}>{signer.fullName}</span>
      ) : null}
      <span className={styles.signatureLabel}>
        {getCertificateSignerLabel(signer ?? null, fallbackLabel)}
      </span>
    </div>
  );

  return (
    <div className={styles.certificateFrame}>
      <div className={styles.certificateHeader}>
        <div className={styles.certificateInstitution}>
          <p className={styles.institutionName}>{t('institutionName')}</p>
          <p className={styles.institutionLocation}>{t('institutionLocation')}</p>
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
      <h3 className={styles.certificateHeading}>{t('certificateHeading')}</h3>
      <p className={styles.certificateLead}>{t('certificateLead')}</p>
      <p className={styles.recipientName}>{certificateName || t('learnerFallback')}</p>
      <p className={styles.certificateSubLead}>{t('certificateSubLead')}</p>
      <p className={styles.courseName}>{certificateTitle}</p>

      <div className={styles.certificateFooter}>
        <div className={styles.footerCard}>
          <span className={styles.footerLabel}>{t('issuedDateLabel')}</span>
          <span className={styles.footerValue}>{issuedDate}</span>
        </div>
        <div className={styles.footerCard}>
          <span className={styles.footerLabel}>{t('certificateCodeLabel')}</span>
          <span className={styles.footerValue}>{certificate.certificateCode}</span>
        </div>
      </div>

      <div className={styles.certificateSignatures}>
        {renderSignatureBlock(certificate.director ?? null, t('issuerLabel'))}
        {renderSignatureBlock(certificate.programDirector ?? null, t('programLabel'))}
      </div>

      <p className={styles.brandNote}>{t('brandNote')}</p>
    </div>
  );
}
