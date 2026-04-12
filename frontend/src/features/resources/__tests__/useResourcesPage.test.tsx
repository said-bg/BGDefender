import { act, renderHook, waitFor } from '@testing-library/react';
import useResourcesPage from '../hooks/useResourcesPage';
import { ResourceSource, ResourceType, type Resource } from '@/types/api';

const translate = (key: string, options?: { defaultValue?: string; name?: string }) => {
  if (options?.name && options.defaultValue?.includes('{{name}}')) {
    return options.defaultValue.replace('{{name}}', options.name);
  }

  return options?.defaultValue ?? key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

const mockGetMyResources = jest.fn();
const mockCreateMyResource = jest.fn();
const mockDeleteMyResource = jest.fn();
const mockUploadResource = jest.fn();

jest.mock('@/services', () => ({
  resourceService: {
    getMyResources: (...args: unknown[]) => mockGetMyResources(...args),
    createMyResource: (...args: unknown[]) => mockCreateMyResource(...args),
    deleteMyResource: (...args: unknown[]) => mockDeleteMyResource(...args),
    uploadResource: (...args: unknown[]) => mockUploadResource(...args),
  },
}));

const createResource = (
  overrides: Partial<Resource> = {},
): Resource => ({
  id: 'resource-1',
  title: 'Incident checklist',
  description: 'Useful internal checklist',
  type: ResourceType.FILE,
  fileUrl: 'https://example.com/resource.pdf',
  filename: 'resource.pdf',
  mimeType: 'application/pdf',
  linkUrl: null,
  source: ResourceSource.ADMIN,
  assignedUserId: 1,
  assignedUser: {
    id: 1,
    email: 'user@example.com',
    firstName: 'Said',
    lastName: 'User',
  },
  createdByUserId: 99,
  createdAt: '2026-04-09T10:00:00.000Z',
  updatedAt: '2026-04-09T10:00:00.000Z',
  ...overrides,
});

describe('useResourcesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyResources.mockResolvedValue([]);
    mockCreateMyResource.mockResolvedValue(createResource());
    mockDeleteMyResource.mockResolvedValue(undefined);
    mockUploadResource.mockResolvedValue({
      url: 'https://example.com/uploaded.pdf',
      filename: 'uploaded.pdf',
      mimeType: 'application/pdf',
    });
    window.confirm = jest.fn(() => true);
  });

  it('loads resources and builds the summary from the returned list', async () => {
    mockGetMyResources.mockResolvedValue([
      createResource(),
      createResource({
        id: 'resource-2',
        type: ResourceType.LINK,
        fileUrl: null,
        filename: null,
        mimeType: null,
        linkUrl: 'https://example.com',
        source: ResourceSource.USER,
        createdByUserId: 1,
      }),
    ]);

    const { result } = renderHook(() => useResourcesPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.filteredResources).toHaveLength(2);
    expect(result.current.summary).toEqual({
      adminShared: 1,
      files: 1,
      links: 1,
      mine: 1,
      total: 2,
    });
  });

  it('validates required data before creating a resource', async () => {
    const { result } = renderHook(() => useResourcesPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe('A title is required.');
    expect(mockCreateMyResource).not.toHaveBeenCalled();
  });

  it('creates a link resource and reloads the list', async () => {
    mockGetMyResources
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        createResource({
          id: 'resource-2',
          type: ResourceType.LINK,
          fileUrl: null,
          filename: null,
          mimeType: null,
          linkUrl: 'https://example.com/private',
          source: ResourceSource.USER,
          createdByUserId: 1,
        }),
      ]);

    const { result } = renderHook(() => useResourcesPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateForm('type', ResourceType.LINK);
      result.current.updateForm('title', 'Private reference');
      result.current.updateForm('linkUrl', 'https://example.com/private');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockCreateMyResource).toHaveBeenCalledWith({
      description: null,
      fileUrl: undefined,
      filename: undefined,
      linkUrl: 'https://example.com/private',
      mimeType: undefined,
      title: 'Private reference',
      type: ResourceType.LINK,
    });

    await waitFor(() =>
      expect(result.current.message).toBe('Resource saved successfully.'),
    );
    expect(result.current.filteredResources).toHaveLength(1);
  });

  it('does not allow deleting admin-shared resources from the user space', async () => {
    mockGetMyResources.mockResolvedValue([createResource()]);

    const { result } = renderHook(() => useResourcesPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(result.current.filteredResources[0]);
    });

    expect(result.current.error).toBe(
      'Admin-shared resources cannot be deleted from your space.',
    );
    expect(mockDeleteMyResource).not.toHaveBeenCalled();
  });

  it('deletes a user-uploaded resource after confirmation', async () => {
    mockGetMyResources
      .mockResolvedValueOnce([
        createResource({
          id: 'resource-3',
          source: ResourceSource.USER,
          createdByUserId: 1,
        }),
      ])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useResourcesPage());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleDelete(result.current.filteredResources[0]);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteMyResource).toHaveBeenCalledWith('resource-3');
    await waitFor(() =>
      expect(result.current.message).toBe('Resource deleted successfully.'),
    );
  });
});
