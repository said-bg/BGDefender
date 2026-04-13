import Link from 'next/link';
import CourseCover from '@/components/course-cover/CourseCover';
import type { CourseWithProgress } from '../lib/courseProgress.utils';
import styles from './CourseProgressCard.module.css';

type BadgeVariant = 'active' | 'completed' | 'free' | 'premium';

interface CourseProgressCardProps {
  actionLabel: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  chaptersLabel: string;
  course: CourseWithProgress;
  description?: string;
  href: string;
  itemsLabel: string;
  priority?: boolean;
  progressLabel: string;
  removeLabel?: string;
  onRemove?: () => void;
  title: string;
}

export default function CourseProgressCard({
  actionLabel,
  badgeLabel,
  badgeVariant,
  chaptersLabel,
  course,
  description,
  href,
  itemsLabel,
  priority = false,
  progressLabel,
  removeLabel,
  onRemove,
  title,
}: CourseProgressCardProps) {
  return (
    <article className={styles.card}>
      <div
        className={`${styles.cardHero} ${
          course.level === 'premium' ? styles.heroPremium : styles.heroFree
        }`}
      >
        <CourseCover
          src={course.coverImage || undefined}
          title={title}
          seedKey={course.id}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          imageClassName={styles.cardImage}
          fallbackClassName={styles.cardImagePlaceholder}
          priority={priority}
        />
      </div>

      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {description ? <p className={styles.cardDescription}>{description}</p> : null}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{course.chapterCount}</span>
            <span className={styles.statLabel}>{chaptersLabel}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{course.itemCount}</span>
            <span className={styles.statLabel}>{itemsLabel}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{course.progressPercentage}%</span>
            <span className={styles.statLabel}>{progressLabel}</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardFooterLeft}>
            <span className={`${styles.badge} ${styles[badgeVariant]}`}>{badgeLabel}</span>
            {removeLabel && onRemove ? (
              <button type="button" className={styles.removeButton} onClick={onRemove}>
                {removeLabel}
              </button>
            ) : null}
          </div>
          <Link href={href} className={styles.resumeButton}>
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
