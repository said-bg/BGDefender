'use client';

import Link from 'next/link';
import HomeCourseCard from './HomeCourseCard';
import styles from './HomeCourseRail.module.css';
import { HomeCourse } from './types';
import useHomeCourseRailScroll from './useHomeCourseRailScroll';

type HomeCourseRailProps = {
  courses: HomeCourse[];
  description: string;
  emptyLabel: string;
  id?: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  getCourseDescription: (course: HomeCourse) => string;
  getCourseTitle: (course: HomeCourse) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export default function HomeCourseRail({
  courses,
  description,
  emptyLabel,
  id,
  title,
  viewAllHref,
  viewAllLabel,
  getCourseDescription,
  getCourseTitle,
  t,
}: HomeCourseRailProps) {
  const { canScrollLeft, canScrollRight, scrollByViewport, viewportRef } =
    useHomeCourseRailScroll(courses.length);

  return (
    <section id={id} className={`${styles.section} ${styles.railSection}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
        {viewAllHref && viewAllLabel ? (
          <Link href={viewAllHref} className={styles.sectionLink}>
            {viewAllLabel}
          </Link>
        ) : null}
      </div>

      {courses.length === 0 ? (
        <p className={styles.emptyState}>{emptyLabel}</p>
      ) : courses.length <= 4 ? (
        <div className={styles.grid}>
          {courses.map((course, index) => (
            <HomeCourseCard
              key={course.id}
              course={course}
              getCourseDescription={getCourseDescription}
              getCourseTitle={getCourseTitle}
              priority={index === 0}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className={styles.railShell}>
          {canScrollLeft ? (
            <button
              type="button"
              className={`${styles.railNav} ${styles.railNavLeft}`}
              onClick={() => scrollByViewport('left')}
              aria-label="Scroll left"
            >
              {'\u2039'}
            </button>
          ) : null}

          <div className={styles.railFrame}>
            {canScrollLeft ? <div className={`${styles.railEdge} ${styles.railEdgeLeft}`} /> : null}
            <div ref={viewportRef} className={styles.railViewport}>
              {courses.map((course, index) => (
                <div key={course.id} className={styles.railCard}>
                  <HomeCourseCard
                    course={course}
                    getCourseDescription={getCourseDescription}
                    getCourseTitle={getCourseTitle}
                    priority={index === 0}
                    t={t}
                  />
                </div>
              ))}
            </div>
            {canScrollRight ? <div className={`${styles.railEdge} ${styles.railEdgeRight}`} /> : null}
          </div>

          {canScrollRight ? (
            <button
              type="button"
              className={`${styles.railNav} ${styles.railNavRight}`}
              onClick={() => scrollByViewport('right')}
              aria-label="Scroll right"
            >
              {'\u203A'}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
