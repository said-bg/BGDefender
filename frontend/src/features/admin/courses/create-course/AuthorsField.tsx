'use client';

import Link from 'next/link';
import { Author } from '@/services/course';
import detailStyles from './CreateCourseDetails.module.css';
import pageStyles from './CreateCoursePage.module.css';

type AuthorsFieldProps = {
  authors: Author[];
  authorsError: string | null;
  authorIds: string[];
  i18nLanguage: string;
  loadingAuthors: boolean;
  selectedAuthors: Author[];
  onToggleAuthor: (authorId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function AuthorsField({
  authors,
  authorsError,
  authorIds,
  i18nLanguage,
  loadingAuthors,
  selectedAuthors,
  onToggleAuthor,
  t,
}: AuthorsFieldProps) {
  return (
    <div className={pageStyles.fieldWide}>
      <div className={detailStyles.fieldHeader}>
        <span className={detailStyles.fieldLabel}>
          {t('create.authors')}
        </span>
        <Link href="/admin/authors" className={detailStyles.inlineLink}>
          {t('manageAuthors')}
        </Link>
      </div>
      <p className={pageStyles.helperText}>
        {t('create.authorsDescription')}
      </p>

      {loadingAuthors ? (
        <p className={pageStyles.helperMessage}>
          {t('create.authorsLoading')}
        </p>
      ) : authorsError ? (
        <p className={pageStyles.errorMessage}>{authorsError}</p>
      ) : (
        <>
          <div className={detailStyles.authorGrid}>
            {authors.map((author) => {
              const selected = authorIds.includes(author.id);

              return (
                <button
                  key={author.id}
                  type="button"
                  className={`${detailStyles.authorChip} ${selected ? detailStyles.authorChipSelected : ''}`}
                  onClick={() => onToggleAuthor(author.id)}
                >
                  <span className={detailStyles.authorName}>{author.name}</span>
                  <span className={detailStyles.authorRole}>
                    {i18nLanguage === 'fi' ? author.roleFi || author.roleEn : author.roleEn || author.roleFi}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAuthors.length > 0 ? (
            <div className={detailStyles.selectedAuthors}>
              {selectedAuthors.map((author) => (
                <span key={author.id} className={detailStyles.selectedAuthorToken}>
                  {author.name}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

