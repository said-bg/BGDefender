import FavoriteButton from '@/components/favorite-button/FavoriteButton';
import CourseCover from '@/components/course-cover/CourseCover';
import type { Course } from '@/services/course';
import styles from '../CourseDetailPage.module.css';

type CourseDetailHeroProps = {
  course: Course;
  courseTitle: string;
  durationLabel: string | null;
  isAuthenticated: boolean;
  isFavorite: (courseId: string) => boolean;
  isPending: (courseId: string) => boolean;
  onToggleFavorite: (courseId: string) => void;
  favoriteAddLabel: string;
  favoriteRemoveLabel: string;
  favoriteVisibleLabel: string;
  freeCourseLabel: string;
  premiumCourseLabel: string;
};

export default function CourseDetailHero({
  course,
  courseTitle,
  durationLabel,
  favoriteAddLabel,
  favoriteRemoveLabel,
  favoriteVisibleLabel,
  freeCourseLabel,
  isAuthenticated,
  isFavorite,
  isPending,
  onToggleFavorite,
  premiumCourseLabel,
}: CourseDetailHeroProps) {
  return (
    <section
      className={`${styles.hero} ${course.coverImage ? '' : styles.heroNoCover}`}
    >
      <CourseCover
        src={course.coverImage || undefined}
        title={courseTitle}
        seedKey={course.id}
        sizes="100vw"
        imageClassName={styles.heroBackground}
        fallbackClassName={styles.heroFallback}
        priority
        variant="hero"
      />
      <div className={styles.heroInner}>
        <div className={styles.heroTopRow}>
          <span className={styles.heroLabel}>
            {course.level === 'premium' ? premiumCourseLabel : freeCourseLabel}
          </span>
          {isAuthenticated && (
            <FavoriteButton
              active={isFavorite(course.id)}
              pending={isPending(course.id)}
              onToggle={() => onToggleFavorite(course.id)}
              addLabel={favoriteAddLabel}
              removeLabel={favoriteRemoveLabel}
              visibleLabel={favoriteVisibleLabel}
              variant="pill"
              className={styles.heroFavoriteButton}
            />
          )}
        </div>
        <h1 className={styles.heroTitle}>{courseTitle}</h1>
        {durationLabel ? (
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>{durationLabel}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
