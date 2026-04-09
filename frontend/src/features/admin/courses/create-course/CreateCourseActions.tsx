import Link from 'next/link';
import styles from './CreateCoursePage.module.css';

interface CreateCourseActionsProps {
  isSubmitting: boolean;
  submitError: string | null;
  submitMessage: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function CreateCourseActions({
  isSubmitting,
  submitError,
  submitMessage,
  t,
}: CreateCourseActionsProps) {
  return (
    <>
      {submitMessage ? <p className={styles.successMessage}>{submitMessage}</p> : null}
      {submitError ? <p className={styles.errorMessage}>{submitError}</p> : null}

      <div className={styles.actions}>
        <Link href="/admin/courses" className={styles.secondaryAction}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Link>
        <button type="submit" className={styles.primaryAction} disabled={isSubmitting}>
          {isSubmitting
            ? t('create.creating', { defaultValue: 'Creating course...' })
            : t('create.submit', { defaultValue: 'Create course' })}
        </button>
      </div>
    </>
  );
}
