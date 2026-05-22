'use client';

import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks';
import { formatSiteDate } from '@/lib/datetime';
import {
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import certificateService from '@/services/certificates';
import { CertificateStatus, type CertificateRecord, UserRole } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import CertificateDocument from './components/CertificateDocument';
import {
  getCertificateFullName,
  getCertificateLocalizedTitle,
} from './lib/certificates.utils';
import styles from './PrintCertificatePage.module.css';

function PrintCertificatePageContent() {
  const { t, i18n } = useTranslation('certificates');
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAutoPrintedRef = useRef(false);

  useEffect(() => {
    const certificateId = params?.id;

    if (!certificateId || typeof certificateId !== 'string') {
      setError(t('printLoadFailed'));
      setLoading(false);
      return;
    }

    const loadCertificate = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await certificateService.getMyCertificate(certificateId);
        setCertificate(response);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, t('printLoadFailed')));
      } finally {
        setLoading(false);
      }
    };

    void loadCertificate();
  }, [params, t]);

  useEffect(() => {
    if (
      !certificate ||
      certificate.status !== CertificateStatus.ISSUED ||
      searchParams.get('autoprint') !== '1' ||
      hasAutoPrintedRef.current
    ) {
      return;
    }

    hasAutoPrintedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [certificate, searchParams]);

  const issuedDate = useMemo(() => {
    if (!certificate?.issuedAt) {
      return '-';
    }

    return formatSiteDate(certificate.issuedAt, i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [certificate, i18n.language]);

  const certificateName = certificate
    ? getCertificateFullName(certificate, user)
    : '';
  const certificateTitle = certificate
    ? getCertificateLocalizedTitle(certificate, i18n.language)
    : '';

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarCopy}>
            <h1 className={styles.title}>{t('printTitle')}</h1>
            <p className={styles.description}>{t('printDescription')}</p>
          </div>
          <div className={styles.actions}>
            <Link
              href={localizePathname('/certificates', activeLocale)}
              className={styles.backLink}
            >
              {t('backToCertificates')}
            </Link>
            <button
              type="button"
              className={styles.printButton}
              onClick={() => window.print()}
              disabled={!certificate || certificate.status !== CertificateStatus.ISSUED}
            >
              {t('printNow')}
            </button>
          </div>
        </div>

        {loading ? (
          <p className={styles.loading}>{t('printLoading')}</p>
        ) : error || !certificate ? (
          <p className={styles.error}>{error ?? t('printLoadFailed')}</p>
        ) : (
          <div className={styles.frame}>
            <CertificateDocument
              certificate={certificate}
              certificateName={certificateName}
              certificateTitle={certificateTitle}
              issuedDate={issuedDate}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrintCertificatePage() {
  return (
    <ProtectedRoute
      requiredRole={[UserRole.USER, UserRole.CREATOR]}
      unauthorizedRedirect="/admin"
    >
      <PrintCertificatePageContent />
    </ProtectedRoute>
  );
}
