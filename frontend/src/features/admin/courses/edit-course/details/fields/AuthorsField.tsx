import Link from 'next/link';
import { Author } from '@/services/course';
import detailStyles from '../DetailsPage.module.css';
import formStyles from '../../shared/EditCourseForm.module.css';
import sharedStyles from '../../shared/EditCoursePage.module.css';

type AuthorsFieldProps = {
  authors: Author[];
  authorsError: string | null;
  language: string;
  onToggleAuthor: (authorId: string) => void;
  selectedAuthorIds: string[];
  selectedAuthors: Author[];
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function AuthorsField({
  authors,
  authorsError,
  language,
  onToggleAuthor,
  selectedAuthorIds,
  selectedAuthors,
  t,
}: AuthorsFieldProps) {
  return (
    <div className={formStyles.fieldWide}>
      <div className={detailStyles.fieldHeader}>
        <span className={detailStyles.fieldLabel}>
          {t('create.authors', { defaultValue: 'Authors' })}
        </span>
        <Link href="/admin/authors" className={detailStyles.inlineLink}>
          {t('manageAuthors', { defaultValue: 'Manage authors' })}
        </Link>
      </div>
      <p className={sharedStyles.helperText}>
        {t('create.authorsDescription', {
          defaultValue:
            'Select one or more authors that should appear on the course overview.',
        })}
      </p>

      {authorsError ? (
        <p className={sharedStyles.errorMessage}>{authorsError}</p>
      ) : (
        <>
          <div className={detailStyles.authorGrid}>
            {authors.map((author) => {
              const selected = selectedAuthorIds.includes(author.id);

              return (
                <button
                  key={author.id}
                  type="button"
                  className={`${detailStyles.authorChip} ${selected ? detailStyles.authorChipSelected : ''}`}
                  onClick={() => onToggleAuthor(author.id)}
                >
                  <span className={detailStyles.authorName}>{author.name}</span>
                  <span className={detailStyles.authorRole}>
                    {language === 'fi'
                      ? author.roleFi || author.roleEn
                      : author.roleEn || author.roleFi}
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



