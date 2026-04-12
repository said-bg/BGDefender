import type { Author } from '@/services/course';
import { buildAuthorPayload } from '../authorAdmin.mutations';
import {
  getAuthorInitials,
  getLocalizedAuthorBio,
  getLocalizedAuthorRole,
  sortAuthorsByUpdatedAt,
} from '../authorAdmin.utils';

const createAuthor = (overrides: Partial<Author> = {}): Author => ({
  id: 'author-1',
  name: 'Alex Morgan',
  roleEn: 'Security Engineer',
  roleFi: 'Tietoturva-asiantuntija',
  biographyEn: 'English biography',
  biographyFi: 'Finnish biography',
  photo: '/author.jpg',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('authorAdmin.utils', () => {
  // Keeps author cards readable even when the stored name has odd spacing.
  it('builds author initials from the first two name parts', () => {
    expect(getAuthorInitials('  ada   lovelace  byron ')).toBe('AL');
    expect(getAuthorInitials('Grace')).toBe('G');
    expect(getAuthorInitials('   ')).toBe('A');
  });

  // Protects the library list from mutating API data while still showing newest authors first.
  it('sorts authors by latest update without mutating the original list', () => {
    const older = createAuthor({
      id: 'older',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const newer = createAuthor({
      id: 'newer',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    const authors = [older, newer];

    expect(sortAuthorsByUpdatedAt(authors)).toEqual([newer, older]);
    expect(authors).toEqual([older, newer]);
  });

  // Makes the admin bilingual UI resilient when one translation is missing.
  it('returns localized role and biography with fallback values', () => {
    const author = createAuthor({
      roleFi: undefined,
      biographyEn: undefined,
    });

    expect(getLocalizedAuthorRole(author, 'fi')).toBe('Security Engineer');
    expect(getLocalizedAuthorRole(author, 'en')).toBe('Security Engineer');
    expect(getLocalizedAuthorBio(author, 'fi')).toBe('Finnish biography');
    expect(getLocalizedAuthorBio(author, 'en')).toBe('Finnish biography');
  });

  // Keeps author create/update payloads clean before they reach the API service.
  it('builds a trimmed author payload and omits empty optional fields', () => {
    expect(
      buildAuthorPayload({
        name: '  Dana Scully  ',
        roleEn: '  Incident Responder  ',
        roleFi: '',
        biographyEn: '  Handles triage.  ',
        biographyFi: '   ',
        photo: '  /authors/dana.jpg  ',
      }),
    ).toEqual({
      name: 'Dana Scully',
      roleEn: 'Incident Responder',
      roleFi: undefined,
      biographyEn: 'Handles triage.',
      biographyFi: undefined,
      photo: '/authors/dana.jpg',
    });
  });
});

