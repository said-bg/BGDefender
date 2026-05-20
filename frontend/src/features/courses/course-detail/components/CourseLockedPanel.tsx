import Link from 'next/link';
import { Trans } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  getLocaleFromPathname,
  localizePathname,
} from '@/lib/locale';
import styles from './CourseLockedPanel.module.css';

type AccessState = 'public' | 'checking' | 'login_required' | 'premium_required' | 'granted';

interface CourseLockedPanelProps {
  accessState: AccessState;
  t: TFunction<'courses', undefined>;
}

export default function CourseLockedPanel({ accessState, t }: CourseLockedPanelProps) {
  const loginHref = (() => {
    if (typeof window === 'undefined') {
      return '/login';
    }

    const pathnameLocale = getLocaleFromPathname(window.location.pathname);
    const loginPath = pathnameLocale
      ? localizePathname('/login', pathnameLocale)
      : '/login';

    return `${loginPath}?redirect=${encodeURIComponent(
      `${window.location.pathname}${window.location.search}`,
    )}`;
  })();

  return (
    <div className={styles.lockedPanel}>
      {accessState === 'login_required' ? (
        <p className={styles.lockedText}>
          <Trans
            t={t}
            i18nKey="detail.loginRequiredPromptInline"
            components={{
              loginLink: <Link href={loginHref} className={styles.lockedInlineLink} />,
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
