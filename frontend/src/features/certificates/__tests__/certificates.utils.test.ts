import {
  getCertificateFullName,
  getCertificateLocalizedTitle,
  getCertificateSummary,
} from '../lib/certificates.utils';
import { CertificateStatus, UserPlan, UserRole, type CertificateRecord, type User } from '@/types/api';

const createCertificate = (
  overrides: Partial<CertificateRecord> = {},
): CertificateRecord => ({
  id: 'certificate-1',
  courseId: 'course-1',
  certificateCode: 'BGD-2026-ABCD1234',
  status: CertificateStatus.ISSUED,
  firstName: 'Ait',
  lastName: 'Baha',
  courseTitleEn: 'Cybersecurity Foundations',
  courseTitleFi: 'Kyberturvallisuuden perusteet',
  issuedAt: '2026-04-09T10:00:00.000Z',
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
  ...overrides,
});

const user: User = {
  id: 1,
  email: 'learner@example.com',
  firstName: 'Said',
  lastName: 'User',
  occupation: null,
  role: UserRole.USER,
  plan: UserPlan.FREE,
  isActive: true,
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
};

describe('certificates.utils', () => {
  it('returns the localized course title', () => {
    const certificate = createCertificate();

    expect(getCertificateLocalizedTitle(certificate, 'en')).toBe('Cybersecurity Foundations');
    expect(getCertificateLocalizedTitle(certificate, 'fi')).toBe('Kyberturvallisuuden perusteet');
  });

  it('prefers the certificate snapshot name and falls back to the user profile', () => {
    expect(getCertificateFullName(createCertificate(), user)).toBe('Ait Baha');
    expect(
      getCertificateFullName(
        createCertificate({ firstName: null, lastName: null }),
        user,
      ),
    ).toBe('Said User');
  });

  it('builds the certificate summary counts', () => {
    expect(
      getCertificateSummary([
        createCertificate(),
        createCertificate({
          id: 'certificate-2',
          status: CertificateStatus.PENDING_PROFILE,
          issuedAt: null,
        }),
      ]),
    ).toEqual({
      total: 2,
      issued: 1,
      pending: 1,
    });
  });
});
