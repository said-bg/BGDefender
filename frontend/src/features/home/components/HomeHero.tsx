import Link from 'next/link';
import HomeHeroVisual from './HomeHeroVisual';
import styles from './HomeHero.module.css';

type HeroAction = {
  href: string;
  label: string;
  secondary?: boolean;
};

type HomeHeroProps = {
  description?: string;
  compact?: boolean;
  eyebrow?: string;
  heroTitle: string;
  highlights?: string[];
  actions?: HeroAction[];
  t: (key: string) => string;
};

export default function HomeHero({
  compact = false,
  description,
  eyebrow,
  heroTitle,
  highlights,
  actions,
  t,
}: HomeHeroProps) {
  const resolvedDescription = description ?? t('page.heroDescription');
  const resolvedEyebrow = eyebrow ?? t('page.heroEyebrow');
  const resolvedActions = actions ?? [
    {
      href: '#free-courses',
      label: t('page.exploreCourses'),
    },
    {
      href: '#premium-courses',
      label: t('page.viewPremium'),
      secondary: true,
    },
  ];
  const resolvedHighlights = highlights ?? [
    t('page.highlightExpert'),
    t('page.highlightLabs'),
    t('page.highlightCertificates'),
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroShell}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{resolvedEyebrow}</p>
          <h1 className={styles.heading}>{heroTitle}</h1>
          <p className={styles.subheading}>{resolvedDescription}</p>

          {!compact ? (
            <>
              <div className={styles.heroActions}>
                {resolvedActions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={action.secondary ? styles.secondaryAction : styles.primaryAction}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>

              <div className={styles.heroHighlights}>
                {resolvedHighlights.map((highlight) => (
                  <span key={highlight} className={styles.highlightPill}>
                    {highlight}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {!compact ? <HomeHeroVisual t={t} /> : null}
      </div>
    </section>
  );
}
