'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_LOCALE, getLocaleFromPathname, localizePathname } from '@/lib/locale';
import styles from './AdminCollectionsHero.module.css';

type CollectionsTranslate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type AdminCollectionsHeroProps = {
  t: CollectionsTranslate;
};

export default function AdminCollectionsHero({
  t,
}: AdminCollectionsHeroProps) {
  const pathname = usePathname();
  const activeLocale = getLocaleFromPathname(pathname || '/') ?? DEFAULT_LOCALE;

  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <Link href={localizePathname('/admin', activeLocale)} className={styles.backLink}>
          {t('backToOverview')}
        </Link>
        <p className={styles.eyebrow}>
          {t('collections.eyebrow')}
        </p>
        <h1 className={styles.title}>
          {t('collections.title')}
        </h1>
        <p className={styles.subtitle}>
          {t('collections.subtitle')}
        </p>
      </div>
    </section>
  );
}
