import styles from '../AccountPage.module.css';

type AccountHeroProps = {
  avatarText: string;
  displayName: string;
  isAdmin: boolean;
  isStandardUser: boolean;
  planLabel: string;
  planToneClass: string;
  roleLabel: string;
  roleToneClass: string;
  title: string;
  subtitle: string;
};

export default function AccountHero({
  avatarText,
  displayName,
  isAdmin,
  isStandardUser,
  planLabel,
  planToneClass,
  roleLabel,
  roleToneClass,
  subtitle,
  title,
}: AccountHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroIdentity}>
        <span className={styles.avatar}>{avatarText}</span>
        <div>
          <p className={styles.eyebrow}>{title}</p>
          <h1 className={styles.title}>{displayName}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.badges}>
        {isAdmin ? (
          <span className={`${styles.badgeMuted} ${roleToneClass}`}>{roleLabel}</span>
        ) : isStandardUser ? (
          <span className={`${styles.badgePrimary} ${planToneClass}`}>{planLabel}</span>
        ) : (
          <>
            <span className={`${styles.badgePrimary} ${planToneClass}`}>{planLabel}</span>
            <span className={`${styles.badgeMuted} ${roleToneClass}`}>{roleLabel}</span>
          </>
        )}
      </div>
    </header>
  );
}
