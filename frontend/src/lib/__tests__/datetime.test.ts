import { formatSiteDate, SITE_TIME_ZONE } from '../datetime';

describe('datetime helpers', () => {
  it('formats time values in the Finland site timezone', () => {
    const formatted = formatSiteDate('2026-04-10T10:30:00.000Z', 'en', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(formatted).toContain('13:30');
    expect(formatted).toMatch(/10 Apr|Apr 10/);
  });

  it('exports the expected site timezone', () => {
    expect(SITE_TIME_ZONE).toBe('Europe/Helsinki');
  });
});
