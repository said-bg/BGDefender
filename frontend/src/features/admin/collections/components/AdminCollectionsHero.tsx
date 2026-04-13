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
