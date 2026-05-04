'use client';

import { CertificateStatus, type CertificateRecord } from '@/types/api';
import styles from './CertificatesLibrary.module.css';

type CertificatesLibraryProps = {
  certificates: CertificateRecord[];
  error: string | null;
  language: string;
  loading: boolean;
  selectedCertificateId: string | null;
  onSelect: (id: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function CertificatesLibrary({
  certificates,
  error,
  language,
  loading,
  selectedCertificateId,
  onSelect,
  t,
}: CertificatesLibraryProps) {
  return (
    <section className={styles.listCard}>
      <h2 className={styles.sectionTitle}>
        {t('libraryTitle')}
      </h2>
      <p className={styles.sectionDescription}>
        {t('libraryDescription')}
      </p>

      {loading ? (
        <p className={styles.helperText}>
          {t('loading')}
        </p>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : certificates.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>
            {t('emptyTitle')}
          </h3>
          <p className={styles.emptyDescription}>
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <div className={styles.certificateList}>
          {certificates.map((certificate) => (
            <button
              key={certificate.id}
              type="button"
              className={`${styles.certificateCard} ${
                certificate.id === selectedCertificateId ? styles.certificateCardActive : ''
              }`}
              onClick={() => onSelect(certificate.id)}
            >
              <h3 className={styles.certificateTitle}>
                {language === 'fi'
                  ? certificate.courseTitleFi || certificate.courseTitleEn
                  : certificate.courseTitleEn || certificate.courseTitleFi}
              </h3>
              <p className={styles.certificateMeta}>
                {certificate.issuedAt
                  ? t('issuedOn', {
                      date: new Date(certificate.issuedAt).toLocaleDateString(),
                    })
                  : t('pendingMeta')}
              </p>
              <div className={styles.badgeRow}>
                <span
                  className={`${styles.badge} ${
                    certificate.status === CertificateStatus.ISSUED
                      ? styles.badgeIssued
                      : styles.badgePending
                  }`}
                >
                  {certificate.status === CertificateStatus.ISSUED
                    ? t('issuedBadge')
                    : t('pendingBadge')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
