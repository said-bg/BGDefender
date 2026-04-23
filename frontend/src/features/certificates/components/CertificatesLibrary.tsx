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
        {t('libraryTitle', { defaultValue: 'Certificate library' })}
      </h2>
      <p className={styles.sectionDescription}>
        {t('libraryDescription', {
          defaultValue:
            'Issued certificates and passed courses waiting for a complete profile all appear here.',
        })}
      </p>

      {loading ? (
        <p className={styles.helperText}>
          {t('loading', { defaultValue: 'Loading certificates...' })}
        </p>
      ) : error ? (
        <p className={styles.errorText}>{error}</p>
      ) : certificates.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>
            {t('emptyTitle', { defaultValue: 'No certificates yet' })}
          </h3>
          <p className={styles.emptyDescription}>
            {t('emptyDescription', {
              defaultValue:
                'Once you pass a certifying course final test, your certificate record will appear here.',
            })}
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
                      defaultValue: 'Issued on {{date}}',
                      date: new Date(certificate.issuedAt).toLocaleDateString(),
                    })
                  : t('pendingMeta', {
                      defaultValue: 'Waiting for profile completion before issuance',
                    })}
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
                    ? t('issuedBadge', { defaultValue: 'Issued' })
                    : t('pendingBadge', { defaultValue: 'Pending profile' })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
