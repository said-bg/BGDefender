import Image from 'next/image';
import styles from './HomeHeroVisual.module.css';

interface HomeHeroVisualProps {
  t: (key: string) => string;
}

export default function HomeHeroVisual({ t }: HomeHeroVisualProps) {
  return (
    <div className={styles.heroVisual}>
      <div className={styles.heroVisualFrame}>
        <div className={styles.heroImageWrap}>
          <Image
            src="/assets/images/home-bg.png"
            alt="BG Defender home hero"
            fill
            priority
            loading="eager"
            className={styles.heroImage}
            sizes="(max-width: 960px) 100vw, 48vw"
          />
        </div>

        <div className={styles.heroVisualCaption}>
          <span className={styles.heroMetaText}>{t('page.featuredCourse')}</span>
          <p className={styles.heroVisualTitle}>{t('page.heroFallbackTitle')}</p>
          <p className={styles.heroVisualDescription}>{t('page.heroFeaturedDescription')}</p>
        </div>
      </div>
    </div>
  );
}
