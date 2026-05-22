import {
  CertificateStatus,
  type CertificateRecord,
  type CertificateSignerDisplayRecord,
  type User,
} from '@/types/api';

export const getCertificateLocalizedTitle = (
  certificate: CertificateRecord,
  language: string,
) => (language === 'fi' ? certificate.courseTitleFi || certificate.courseTitleEn : certificate.courseTitleEn || certificate.courseTitleFi);

export const getCertificateFullName = (certificate: CertificateRecord, user: User | null) => {
  const snapshotName = [certificate.firstName, certificate.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (snapshotName) {
    return snapshotName;
  }

  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return profileName || user?.email?.split('@')[0] || '';
};

export const getCertificateSummary = (certificates: CertificateRecord[]) => ({
  total: certificates.length,
  issued: certificates.filter(
    (certificate) => certificate.status === CertificateStatus.ISSUED,
  ).length,
  pending: certificates.filter(
    (certificate) => certificate.status === CertificateStatus.PENDING_PROFILE,
  ).length,
});

const DEFAULT_DIRECTOR_TITLES = new Set(['Director', 'Johtaja']);
const DEFAULT_PROGRAM_DIRECTOR_TITLES = new Set([
  'Program Director',
  'Program director',
  'Koulutusohjelman johtaja',
]);

export const getCertificateSignerLabel = (
  signer: CertificateSignerDisplayRecord | null | undefined,
  fallbackLabel: string,
) => {
  if (!signer?.title?.trim()) {
    return fallbackLabel;
  }

  if (
    signer.role === 'director' &&
    DEFAULT_DIRECTOR_TITLES.has(signer.title.trim())
  ) {
    return fallbackLabel;
  }

  if (
    signer.role === 'program_director' &&
    DEFAULT_PROGRAM_DIRECTOR_TITLES.has(signer.title.trim())
  ) {
    return fallbackLabel;
  }

  return signer.title;
};
