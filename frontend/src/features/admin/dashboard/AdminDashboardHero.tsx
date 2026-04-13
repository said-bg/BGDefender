import { useAuth } from '@/hooks';
import styles from './AdminDashboardHero.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

interface AdminDashboardHeroProps {
  language: string;
  t: AdminDashboardT;
}

export default function AdminDashboardHero({ language, t }: AdminDashboardHeroProps) {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.lastName || 'admin';
  const welcomeFallback =
    language === 'fi' ? 'Tervetuloa, {{name}}' : 'Welcome, {{name}}';

  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <div className={styles.heroCopy}>
        <h1 className={styles.title}>
          {t('welcomeTitle', {
            defaultValue: welcomeFallback,
            name: displayName,
          })}
        </h1>
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
