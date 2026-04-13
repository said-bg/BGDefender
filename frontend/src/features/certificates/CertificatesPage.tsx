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
            {t('eyebrow')}
          </p>
          <h1 className={styles.title}>
            {t('title')}
          </h1>
          <p className={styles.subtitle}>
            {t('subtitle')}
          </p>
        </header>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryTotal')}
            </span>
            <strong className={styles.summaryValue}>{summary.total}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryIssued')}
            </span>
            <strong className={styles.summaryValue}>{summary.issued}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>
              {t('summaryPending')}
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
