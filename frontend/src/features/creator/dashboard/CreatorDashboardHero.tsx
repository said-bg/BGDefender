import { useAuth } from '@/hooks';
import heroStyles from '@/features/admin/dashboard/AdminDashboardHero.module.css';
import type { AdminDashboardT } from '@/features/admin/dashboard/adminDashboard.types';

interface CreatorDashboardHeroProps {
  t: AdminDashboardT;
}

export default function CreatorDashboardHero({ t }: CreatorDashboardHeroProps) {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.lastName || 'creator';

  return (
    <section className={heroStyles.hero}>
      <p className={heroStyles.eyebrow}>{t('creatorDashboard.eyebrow')}</p>
      <div className={heroStyles.heroCopy}>
        <h1 className={heroStyles.title}>
          {t('creatorDashboard.welcomeTitle', { name: displayName })}
        </h1>
        <p className={heroStyles.subtitle}>{t('creatorDashboard.subtitle')}</p>
      </div>
    </section>
  );
}
