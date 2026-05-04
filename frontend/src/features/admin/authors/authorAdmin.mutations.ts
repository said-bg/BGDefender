import { Author } from '@/services/course';
import authorService, {
  CreateAuthorRequest,
  UpdateAuthorRequest,
} from '@/services/authors';
import { getApiErrorMessage } from '@/utils/apiError';
import { AuthorFormState } from './types';

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
        t('authors.failedToLoad'),
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
        t('authors.photoUploadFailed'),
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
        message: t('authors.updated'),
      };
    }

    const author = await authorService.createAuthor(payload as CreateAuthorRequest);
    return {
      author,
      message: t('authors.created'),
    };
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        editingAuthorId
          ? t('authors.updateFailed')
          : t('authors.createFailed'),
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
        t('authors.deleteFailed'),
      ),
    );
  }
}

