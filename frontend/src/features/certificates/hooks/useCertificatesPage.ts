'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import certificateService from '@/services/certificates';
import { useAuth } from '@/hooks';
import { CertificateStatus, type CertificateRecord } from '@/types/api';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  getCertificateFullName,
  getCertificateLocalizedTitle,
  getCertificateSummary,
} from '../lib/certificates.utils';

export default function useCertificatesPage() {
  const { t, i18n } = useTranslation('certificates');
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await certificateService.getMyCertificates();
        setCertificates(response);
        setSelectedCertificateId((previous) => previous ?? response[0]?.id ?? null);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            t('loadFailed', { defaultValue: 'Failed to load your certificates.' }),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCertificates();
  }, [t]);

  const selectedCertificate = useMemo(
    () =>
      certificates.find((certificate) => certificate.id === selectedCertificateId) ??
      certificates[0] ??
      null,
    [certificates, selectedCertificateId],
  );

  const selectedCertificateTitle = selectedCertificate
    ? getCertificateLocalizedTitle(selectedCertificate, i18n.language)
    : '';

  const selectedCertificateName = selectedCertificate
    ? getCertificateFullName(selectedCertificate, user)
    : '';

  return {
    certificates,
    error,
    loading,
    selectedCertificate,
    selectedCertificateId,
    selectedCertificateName,
    selectedCertificateTitle,
    setSelectedCertificateId,
    summary: getCertificateSummary(certificates),
    t,
    user,
    hasIncompleteProfile: Boolean(
      user && (!user.firstName?.trim() || !user.lastName?.trim()),
    ),
    hasIssuedCertificate: Boolean(
      certificates.some((certificate) => certificate.status === CertificateStatus.ISSUED),
    ),
  };
}
