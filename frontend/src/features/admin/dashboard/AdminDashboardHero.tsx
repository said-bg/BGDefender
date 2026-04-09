import styles from './AdminDashboardHero.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

interface AdminDashboardHeroProps {
  t: AdminDashboardT;
}

export default function AdminDashboardHero({ t }: AdminDashboardHeroProps) {
  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <div className={styles.heroCopy}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>
          {t('subtitle', {
            defaultValue:
              'Keep the course catalog organized and move quickly between course management and author updates.',
          })}
        </p>
      </div>
    </section>
  );
}
