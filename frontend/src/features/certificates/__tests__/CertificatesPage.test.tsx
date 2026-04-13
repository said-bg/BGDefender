import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import CertificatesPage from '../CertificatesPage';
import { CertificateStatus, type CertificateRecord } from '@/types/api';

const mockUseCertificatesPage = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('../hooks/useCertificatesPage', () => ({
  __esModule: true,
  default: () => mockUseCertificatesPage(),
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
  }),
}));

const translate = (key: string, options?: { date?: string }) => {
  const values: Record<string, string> = {
    eyebrow: 'Certificates',
    title: 'My certificates',
    subtitle:
      'Keep every earned certificate in one place and complete your profile whenever a passed course is waiting for certificate generation.',
    summaryTotal: 'Total records',
    summaryIssued: 'Issued certificates',
    summaryPending: 'Pending profile completion',
    libraryTitle: 'Certificate library',
    libraryDescription:
      'Issued certificates and passed courses waiting for a complete profile all appear here.',
    previewTitle: 'Certificate preview',
    previewDescription:
      'A clean certificate template now, with room to swap in a custom branded design later.',
    issuedBadge: 'Issued',
    completeProfile: 'Complete profile',
    pendingTitle: 'Complete your profile to generate this certificate',
    certificateHeading: 'Certificate of Completion',
    certificateLead: 'This certifies that',
    certificateSubLead: 'has successfully completed the course',
    issuedDateLabel: 'Issued on',
    certificateCodeLabel: 'Certificate ID',
    institutionName: 'BG Defender Academy',
    institutionLocation: 'Cybersecurity Training Platform',
    issuerLabel: 'Issuer',
    programLabel: 'Program director',
    brandNote: 'Issued by BG Defender Academy',
  };

  if (key === 'issuedOn' && options?.date) {
    return `Issued on ${options.date}`;
  }

  return values[key] ?? key;
};

const createCertificate = (
  overrides: Partial<CertificateRecord> = {},
): CertificateRecord => ({
  id: 'certificate-1',
  courseId: 'course-1',
  certificateCode: 'BGD-2026-ABCD1234',
  status: CertificateStatus.ISSUED,
  firstName: 'Ait',
  lastName: 'Baha',
  courseTitleEn: 'Course Security Basics',
  courseTitleFi: 'Course Security Basics',
  issuedAt: '2026-04-09T10:00:00.000Z',
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
  ...overrides,
});

describe('CertificatesPage', () => {
  afterEach(() => {
    mockUseCertificatesPage.mockReset();
  });

  it('renders the preview for an issued certificate', () => {
    mockUseCertificatesPage.mockReturnValue({
      certificates: [createCertificate()],
      error: null,
      hasIncompleteProfile: false,
      loading: false,
      selectedCertificate: createCertificate(),
      selectedCertificateId: 'certificate-1',
      selectedCertificateName: 'Ait Baha',
      selectedCertificateTitle: 'Course Security Basics',
      setSelectedCertificateId: jest.fn(),
      summary: { total: 1, issued: 1, pending: 0 },
      t: translate,
    });

    render(<CertificatesPage />);

    expect(screen.getByText('My certificates')).toBeInTheDocument();
    expect(screen.getByText('Certificate of Completion')).toBeInTheDocument();
    expect(screen.getByText('Ait Baha')).toBeInTheDocument();
    expect(screen.getAllByText('Course Security Basics')).toHaveLength(2);
    expect(screen.getByText('BGD-2026-ABCD1234')).toBeInTheDocument();
  });

  it('renders the profile completion prompt for pending certificates', () => {
    mockUseCertificatesPage.mockReturnValue({
      certificates: [
        createCertificate({
          id: 'certificate-2',
          status: CertificateStatus.PENDING_PROFILE,
          issuedAt: null,
          firstName: null,
          lastName: null,
        }),
      ],
      error: null,
      hasIncompleteProfile: true,
      loading: false,
      selectedCertificate: createCertificate({
        id: 'certificate-2',
        status: CertificateStatus.PENDING_PROFILE,
        issuedAt: null,
        firstName: null,
        lastName: null,
      }),
      selectedCertificateId: 'certificate-2',
      selectedCertificateName: 'learner',
      selectedCertificateTitle: 'Course Security Basics',
      setSelectedCertificateId: jest.fn(),
      summary: { total: 1, issued: 0, pending: 1 },
      t: translate,
    });

    render(<CertificatesPage />);

    expect(
      screen.getByText('Complete your profile to generate this certificate'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Complete profile' })).toBeInTheDocument();
  });
});
