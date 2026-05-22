'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import certificateService from '@/services/certificates';
import { CertificateStatus, type CertificateRecord } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
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
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleOpenPdf = async () => {
    if (!selectedCertificate) {
      return;
    }

    const previewWindow = window.open('', '_blank');

    try {
      setPdfLoading(true);
      setPdfError(null);
      const pdfBlob = await certificateService.getMyCertificatePdf(
        selectedCertificate.id,
        language,
      );
      const objectUrl = window.URL.createObjectURL(pdfBlob);

      if (previewWindow) {
        previewWindow.location.href = objectUrl;
      } else {
        window.open(objectUrl, '_blank');
      }

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60_000);
    } catch (error) {
      if (previewWindow) {
        previewWindow.close();
      }
      setPdfError(getApiErrorMessage(error, t('pdfFailed')));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <section className={styles.previewCard}>
      <div className={styles.previewHeader}>
        <h2 className={styles.sectionTitle}>
          {t('previewTitle')}
        </h2>
        <p className={styles.sectionDescription}>
          {t('previewDescription')}
        </p>
        {selectedCertificate?.status === CertificateStatus.ISSUED ? (
          <button
            type="button"
            className={styles.profileAction}
            onClick={() => void handleOpenPdf()}
            disabled={pdfLoading}
          >
            {pdfLoading ? t('pdfOpening') : t('downloadPdf')}
          </button>
        ) : null}
        {pdfError ? <p className={styles.helperText}>{pdfError}</p> : null}
      </div>

      {selectedCertificate?.status === CertificateStatus.PENDING_PROFILE ? (
        <div className={styles.profilePrompt}>
          <h3 className={styles.profilePromptTitle}>
            {t('pendingTitle')}
          </h3>
          <p className={styles.profilePromptCopy}>
            {t('pendingDescription')}
          </p>
          <Link
            href={localizePathname('/account', activeLocale)}
            className={styles.profileAction}
          >
            {t('completeProfile')}
          </Link>
        </div>
      ) : null}

      {selectedCertificate ? (
        <div className={styles.downloadCard}>
          <div className={styles.downloadMeta}>
            <span className={styles.downloadLabel}>{t('downloadReadyLabel')}</span>
            <strong className={styles.downloadName}>
              {selectedCertificateName || t('learnerFallback')}
            </strong>
            <p className={styles.downloadCourse}>{selectedCertificateTitle}</p>
          </div>

          <div className={styles.downloadDetails}>
            <div className={styles.downloadDetail}>
              <span className={styles.downloadDetailLabel}>
                {t('certificateCodeLabel')}
              </span>
              <strong className={styles.downloadDetailValue}>
                {selectedCertificate.certificateCode}
              </strong>
            </div>
            <div className={styles.downloadDetail}>
              <span className={styles.downloadDetailLabel}>
                {t('downloadFormatLabel')}
              </span>
              <strong className={styles.downloadDetailValue}>PDF</strong>
            </div>
          </div>
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
