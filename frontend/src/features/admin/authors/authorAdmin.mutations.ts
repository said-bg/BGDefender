import { Author } from '@/services/course';
import authorService, {
  CreateAuthorRequest,
  UpdateAuthorRequest,
} from '@/services/authors';
import { getApiErrorMessage } from '@/utils/apiError';
import { AuthorFormState } from './types';

const DEFAULT_LOAD_ERROR = 'Failed to load authors.';
const DEFAULT_UPLOAD_ERROR = 'Failed to upload author photo.';
const DEFAULT_CREATE_ERROR = 'Failed to create author.';
const DEFAULT_UPDATE_ERROR = 'Failed to update author.';
const DEFAULT_DELETE_ERROR = 'Failed to delete author.';

export async function loadAuthors(
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  try {
    const response = await authorService.getAuthors(100, 0);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        t('authors.failedToLoad', {
          defaultValue: DEFAULT_LOAD_ERROR,
        }),
      ),
    );
  }
}

export async function uploadAuthorPhoto(
  file: File,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  try {
    return await authorService.uploadAuthorPhoto(file);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        t('authors.photoUploadFailed', {
          defaultValue: DEFAULT_UPLOAD_ERROR,
        }),
      ),
    );
  }
}

export function buildAuthorPayload(
  form: AuthorFormState,
): CreateAuthorRequest | UpdateAuthorRequest {
  return {
    name: form.name.trim(),
    roleEn: form.roleEn.trim() || undefined,
    roleFi: form.roleFi.trim() || undefined,
    biographyEn: form.biographyEn.trim() || undefined,
    biographyFi: form.biographyFi.trim() || undefined,
    photo: form.photo.trim() || undefined,
  };
}

export async function saveAuthor(
  form: AuthorFormState,
  editingAuthorId: string | null,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const payload = buildAuthorPayload(form);

  try {
    if (editingAuthorId) {
      const author = await authorService.updateAuthor(editingAuthorId, payload);
      return {
        author,
        message: t('authors.updated', {
          defaultValue: 'Author updated successfully.',
        }),
      };
    }

    const author = await authorService.createAuthor(payload as CreateAuthorRequest);
    return {
      author,
      message: t('authors.created', {
        defaultValue: 'Author created successfully.',
      }),
    };
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        editingAuthorId
          ? t('authors.updateFailed', { defaultValue: DEFAULT_UPDATE_ERROR })
          : t('authors.createFailed', { defaultValue: DEFAULT_CREATE_ERROR }),
      ),
    );
  }
}

export async function deleteAuthor(
  author: Author,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  try {
    await authorService.deleteAuthor(author.id);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        t('authors.deleteFailed', {
          defaultValue: DEFAULT_DELETE_ERROR,
        }),
      ),
    );
  }
}

