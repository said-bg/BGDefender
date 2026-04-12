import { isProfileComplete, getHomeWelcomeName } from '../lib/home.utils';

describe('home.utils', () => {
  it('prefers the first name for the welcome title', () => {
    expect(
      getHomeWelcomeName({
        firstName: 'Said',
        email: 'ait@example.com',
      }),
    ).toBe('Said');
  });

  it('falls back to the email username when no first name exists', () => {
    expect(
      getHomeWelcomeName({
        firstName: null,
        email: 'ait@example.com',
      }),
    ).toBe('ait');
  });

  it('detects whether the learner profile is complete', () => {
    expect(
      isProfileComplete({
        firstName: 'Ait',
        lastName: 'Baha',
      }),
    ).toBe(true);

    expect(
      isProfileComplete({
        firstName: 'Ait',
        lastName: null,
      }),
    ).toBe(false);
  });
});
