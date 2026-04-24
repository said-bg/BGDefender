'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Author } from '@/services/course';
import {
  filterAuthors,
  getAuthorInitials,
  getLocalizedAuthorBio,
  getLocalizedAuthorRole,
} from './authorAdmin.utils';
import libraryStyles from './AuthorLibrary.module.css';
import pageStyles from '@/features/admin/authors/AdminAuthorsPage.module.css';

type AuthorLibraryProps = {
  authors: Author[];
  deletingAuthorId: string | null;
  language: string;
  loadError: string | null;
  loading: boolean;
  onDelete: (author: Author) => void;
  onEdit: (author: Author) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function AuthorLibrary({
  authors,
  deletingAuthorId,
  language,
  loadError,
  loading,
  onDelete,
  onEdit,
  t,
}: AuthorLibraryProps) {
  const [search, setSearch] = useState('');
  const filteredAuthors = useMemo(
    () => filterAuthors(authors, search, language),
    [authors, language, search],
  );

  return (
    <section className={pageStyles.listCard}>
      <div className={pageStyles.cardHeader}>
        <h2 className={pageStyles.sectionTitle}>
          {t('authors.listTitle', { defaultValue: 'Author library' })}
        </h2>
        <p className={pageStyles.sectionDescription}>
          {t('authors.listDescription', {
            defaultValue:
              'Every author you create here becomes reusable across all course forms.',
          })}
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={libraryStyles.searchInput}
        placeholder={t('authors.searchPlaceholder', {
          defaultValue: 'Search authors by name, role, or biography',
        })}
      />

      {loading ? (
        <p className={pageStyles.helperMessage}>
          {t('loading', { defaultValue: 'Loading admin data...' })}
        </p>
      ) : loadError ? (
        <p className={pageStyles.errorMessage}>{loadError}</p>
      ) : authors.length === 0 ? (
        <div className={pageStyles.emptyState}>
          <h3 className={pageStyles.emptyTitle}>
            {t('authors.emptyTitle', { defaultValue: 'No authors yet' })}
          </h3>
          <p className={pageStyles.emptyDescription}>
            {t('authors.emptyDescription', {
              defaultValue:
                'Create the first author profile and it will be ready for course assignment right away.',
            })}
          </p>
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div className={pageStyles.emptyState}>
          <h3 className={pageStyles.emptyTitle}>
            {t('authors.searchEmptyTitle', { defaultValue: 'No matching authors' })}
          </h3>
          <p className={pageStyles.emptyDescription}>
            {t('authors.searchEmptyDescription', {
              defaultValue: 'Try another name, role, or biography keyword.',
            })}
          </p>
        </div>
      ) : (
        <div className={libraryStyles.authorList}>
          {filteredAuthors.map((author) => {
            const localizedRole = getLocalizedAuthorRole(author, language);
            const localizedBio = getLocalizedAuthorBio(author, language);

            return (
              <article key={author.id} className={libraryStyles.authorCard}>
                <div className={libraryStyles.authorHeader}>
                    <div className={libraryStyles.authorIdentity}>
                      {author.photo ? (
                        <>
                          <Image
                            src={author.photo}
                            alt={author.name}
                            className={libraryStyles.authorAvatar}
                            width={56}
                            height={56}
                            unoptimized
                            loading="lazy"
                          />
                        </>
                      ) : (
                        <div className={libraryStyles.authorAvatarFallback}>
                          {getAuthorInitials(author.name)}
                        </div>
                      )}

                    <div>
                      <h3 className={libraryStyles.authorName}>{author.name}</h3>
                      <p className={libraryStyles.authorRole}>
                        {localizedRole || t('authors.noRole', { defaultValue: 'No role added yet' })}
                      </p>
                    </div>
                  </div>
                  <div className={libraryStyles.authorActions}>
                    <button
                      type="button"
                      className={libraryStyles.inlineAction}
                      onClick={() => onEdit(author)}
                    >
                      {t('authors.editAction', { defaultValue: 'Edit author' })}
                    </button>
                    <button
                      type="button"
                      className={libraryStyles.inlineDanger}
                      onClick={() => onDelete(author)}
                      disabled={deletingAuthorId === author.id}
                    >
                      {deletingAuthorId === author.id
                        ? t('authors.deleting', { defaultValue: 'Deleting...' })
                        : t('authors.delete', { defaultValue: 'Delete' })}
                    </button>
                  </div>
                </div>

                {localizedBio ? <p className={libraryStyles.authorBio}>{localizedBio}</p> : null}
                {author.photo ? <p className={libraryStyles.authorMeta}>{author.photo}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

