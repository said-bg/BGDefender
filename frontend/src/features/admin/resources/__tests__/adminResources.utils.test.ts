import { getAdminResourceUserLabel } from '../adminResources.utils';

describe('adminResources.utils', () => {
  it('returns full name when available', () => {
    expect(
      getAdminResourceUserLabel({
        firstName: 'Ait',
        lastName: 'Baha',
        email: 'test@example.com',
      }),
    ).toBe('Ait Baha');
  });

  it('falls back to email when no name exists', () => {
    expect(
      getAdminResourceUserLabel({
        firstName: null,
        lastName: null,
        email: 'test@example.com',
      }),
    ).toBe('test@example.com');
  });
});
