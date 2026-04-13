'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useTranslation } from 'react-i18next';
import CertificatePreview from './components/CertificatePreview';
import CertificatesLibrary from './components/CertificatesLibrary';
import useCertificatesPage from './hooks/useCertificatesPage';
import styles from './CertificatesPage.module.css';
import { UserRole } from '@/types/api';

function CertificatesPageContent() {
  const {
    certificates,
    error,
    hasIncompleteProfile,
    loading,
    selectedCertificate,
    selectedCertificateId,
    selectedCertificateName,
    selectedCertificateTitle,
    setSelectedCertificateId,
    summary,
    t,
  } = useCertificatesPage();
  const { i18n } = useTranslation('certificates');

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>
            {t('eyebrow', { defaultValue: 'Certificates' })}
          </p>
          <h1 className={styles.title}>
            {t('title', { defaultValue: 'My certificates' })}
          </h1>
          <p className={styles.subtitle}>
            {t('subtitle', {
              defaultValue:
                'Keep every earned certificate in one place and complete your profile whenever a passed course is waiting for certificate generation.',
            })}
          </p>
        </header>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryTotal', { defaultValue: 'Total records' })}
            </span>
            <strong className={styles.summaryValue}>{summary.total}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryIssued', { defaultValue: 'Issued certificates' })}
            </span>
            <strong className={styles.summaryValue}>{summary.issued}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryPending', { defaultValue: 'Pending profile completion' })}
            </span>
            <strong className={styles.summaryValue}>{summary.pending}</strong>
          </article>
        </section>

        <section className={styles.layout}>
          <CertificatesLibrary
            certificates={certificates}
            error={error}
            language={i18n.language}
            loading={loading}
            selectedCertificateId={selectedCertificateId}
            onSelect={setSelectedCertificateId}
            t={t}
          />

          <CertificatePreview
            hasIncompleteProfile={hasIncompleteProfile}
            language={i18n.language}
            selectedCertificate={loading ? null : selectedCertificate}
            selectedCertificateName={selectedCertificateName}
            selectedCertificateTitle={selectedCertificateTitle}
            t={t}
          />
        </section>
      </section>
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <ProtectedRoute
      requiredRole={[UserRole.USER, UserRole.CREATOR]}
      unauthorizedRedirect="/admin"
    >
      <CertificatesPageContent />
    </ProtectedRoute>
  );
}
