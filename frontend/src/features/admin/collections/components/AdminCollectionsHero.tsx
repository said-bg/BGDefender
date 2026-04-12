'use client';

import Link from 'next/link';
import styles from '../AdminCollectionsPage.module.css';

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
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <Link href="/admin" className={styles.backLink}>
          {t('backToOverview', { defaultValue: 'Back to dashboard' })}
        </Link>
        <p className={styles.eyebrow}>
          {t('collections.eyebrow', { defaultValue: 'Curated sections' })}
        </p>
        <h1 className={styles.title}>
          {t('collections.title', { defaultValue: 'Manage collections' })}
        </h1>
        <p className={styles.subtitle}>
          {t('collections.subtitle', {
            defaultValue:
              'Create custom learner sections, give them the title you want, and decide exactly which published courses should appear inside each collection.',
          })}
        </p>
      </div>
    </section>
  );
}
