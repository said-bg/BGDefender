import Link from 'next/link';
import type { TranslationFn } from '@/types/i18n';
import sharedStyles from '../../shared/EditCoursePage.module.css';

type CourseDetailsActionsProps = {
  isSubmitting: boolean;
  submitError: string | null;
  submitMessage: string | null;
  t: TranslationFn;
};

export default function CourseDetailsActions({
  isSubmitting,
  submitError,
  submitMessage,
  t,
}: CourseDetailsActionsProps) {
  return (
    <>
      {submitMessage ? <p className={sharedStyles.successMessage}>{submitMessage}</p> : null}
      {submitError ? <p className={sharedStyles.errorMessage}>{submitError}</p> : null}

      <div className={sharedStyles.actions}>
        <Link href="/admin/courses" className={sharedStyles.secondaryAction}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Link>
        <button type="submit" className={sharedStyles.primaryAction} disabled={isSubmitting}>
          {isSubmitting
            ? t('edit.saving', { defaultValue: 'Saving changes...' })
            : t('edit.submit', { defaultValue: 'Save changes' })}
        </button>
      </div>
    </>
  );
}
