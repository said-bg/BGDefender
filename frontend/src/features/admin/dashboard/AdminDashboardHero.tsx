import { useAuth } from '@/hooks';
import styles from './AdminDashboardHero.module.css';
import type { AdminDashboardT } from './adminDashboard.types';

interface AdminDashboardHeroProps {
  t: AdminDashboardT;
}

export default function AdminDashboardHero({ t }: AdminDashboardHeroProps) {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.lastName || 'admin';

  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <div className={styles.heroCopy}>
        <h1 className={styles.title}>
          {t('welcomeTitle', { name: displayName })}
        </h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>
    </section>
  );
}
