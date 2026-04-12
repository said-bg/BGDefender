import Link from 'next/link';
import CourseCover from '@/components/course-cover/CourseCover';
import type { HomeCourse } from '../lib/home.types';
import styles from './HomeCourseCard.module.css';

type HomeCourseCardProps = {
  course: HomeCourse;
  priority: boolean;
  getCourseDescription: (course: HomeCourse) => string;
  getCourseTitle: (course: HomeCourse) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function HomeCourseCard({
  course,
  getCourseDescription,
  getCourseTitle,
  priority,
  t,
}: HomeCourseCardProps) {
  const badgeLabel = course.level === 'premium' ? t('page.badgePremium') : t('page.badgeFree');

  return (
    <article className={styles.card}>
      <Link href={`/courses/${course.id}`} className={styles.cardLink}>
        <div className={styles.cardHero}>
          <CourseCover
            src={course.coverImage}
            title={getCourseTitle(course)}
            sizes="(max-width: 768px) 90vw, 314px"
            imageClassName={styles.cardImage}
            fallbackClassName={styles.cardImagePlaceholder}
            priority={priority}
          />
          <span
            className={`${styles.heroBadge} ${course.level === 'premium' ? styles.badgePremium : styles.badgeFree}`}
          >
            {badgeLabel}
          </span>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{getCourseTitle(course)}</h3>
          <p className={`${styles.cardDescription} ${styles.cardDescriptionClamp}`}>
            {getCourseDescription(course)}
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{course.chapterCount}</span>
              <span className={styles.statLabel}>{t('page.chapters')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{course.itemCount}</span>
              <span className={styles.statLabel}>{t('page.items')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{course.progressPercentage}%</span>
              <span className={styles.statLabel}>{t('page.progress')}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
