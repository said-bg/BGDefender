import Link from 'next/link';
import { Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import styles from './CourseLockedPanel.module.css';

type AccessState = 'public' | 'checking' | 'login_required' | 'premium_required' | 'granted';

interface CourseLockedPanelProps {
  accessState: AccessState;
  t: TFunction<'courses', undefined>;
}

export default function CourseLockedPanel({ accessState, t }: CourseLockedPanelProps) {
  return (
    <div className={styles.lockedPanel}>
      {accessState === 'login_required' ? (
        <p className={styles.lockedText}>
          <Trans
            t={t}
            i18nKey="detail.loginRequiredPromptInline"
            components={{
              loginLink: <Link href="/auth/login" className={styles.lockedInlineLink} />,
            }}
          />
        </p>
      ) : (
        <p className={styles.lockedText}>
          {accessState === 'checking'
            ? t('detail.checkingAccessText')
            : t('detail.premiumRequiredPrompt')}
        </p>
      )}
    </div>
  );
}
