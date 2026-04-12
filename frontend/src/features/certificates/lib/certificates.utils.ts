import { CertificateStatus, type CertificateRecord, type User } from '@/types/api';

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
