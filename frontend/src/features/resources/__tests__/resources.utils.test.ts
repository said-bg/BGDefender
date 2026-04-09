import { ResourceSource, ResourceType, type Resource } from '@/types/api';
import { getResourcesSummary } from '@/features/resources/resources.utils';

const buildResource = (
  id: string,
  type: ResourceType,
  source: ResourceSource,
): Resource => ({
  id,
  title: `Resource ${id}`,
  description: null,
  type,
  fileUrl: type === ResourceType.FILE ? `/uploads/${id}.pdf` : null,
  filename: type === ResourceType.FILE ? `${id}.pdf` : null,
  mimeType: type === ResourceType.FILE ? 'application/pdf' : null,
  linkUrl: type === ResourceType.LINK ? `https://example.com/${id}` : null,
  source,
  assignedUserId: 1,
  assignedUser: {
    id: 1,
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
  },
  createdByUserId: source === ResourceSource.USER ? 1 : 99,
  createdAt: '2026-04-09T00:00:00.000Z',
  updatedAt: '2026-04-09T00:00:00.000Z',
});

describe('getResourcesSummary', () => {
  it('counts each resource bucket cleanly', () => {
    const summary = getResourcesSummary([
      buildResource('1', ResourceType.FILE, ResourceSource.ADMIN),
      buildResource('2', ResourceType.FILE, ResourceSource.USER),
      buildResource('3', ResourceType.LINK, ResourceSource.ADMIN),
    ]);

    expect(summary).toEqual({
      adminShared: 2,
      files: 2,
      links: 1,
      mine: 1,
      total: 3,
    });
  });

  it('returns zeroes for an empty resource list', () => {
    expect(getResourcesSummary([])).toEqual({
      adminShared: 0,
      files: 0,
      links: 0,
      mine: 0,
      total: 0,
    });
  });
});
