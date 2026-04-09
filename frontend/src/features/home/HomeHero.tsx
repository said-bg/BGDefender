import HomeHeroVisual from './HomeHeroVisual';
import styles from './HomeHero.module.css';

type HomeHeroProps = {
  compact?: boolean;
  heroTitle: string;
  t: (key: string) => string;
};

export default function HomeHero({ compact = false, heroTitle, t }: HomeHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroShell}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{t('page.heroEyebrow')}</p>
          <h1 className={styles.heading}>{heroTitle}</h1>
          <p className={styles.subheading}>{t('page.heroDescription')}</p>

          {!compact ? (
            <>
              <div className={styles.heroActions}>
                <a href="#free-courses" className={styles.primaryAction}>
                  {t('page.exploreCourses')}
                </a>
                <a href="#premium-courses" className={styles.secondaryAction}>
                  {t('page.viewPremium')}
                </a>
              </div>

              <div className={styles.heroHighlights}>
                <span className={styles.highlightPill}>{t('page.highlightExpert')}</span>
                <span className={styles.highlightPill}>{t('page.highlightLabs')}</span>
                <span className={styles.highlightPill}>{t('page.highlightCertificates')}</span>
              </div>
            </>
          ) : null}
        </div>

        {!compact ? <HomeHeroVisual t={t} /> : null}
      </div>
    </section>
  );
}
