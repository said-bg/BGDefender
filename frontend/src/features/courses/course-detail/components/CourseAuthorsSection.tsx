import Image from 'next/image';
import { Course } from '@/services/course';
import { ActiveLanguage, getAuthorRole } from '../courseDetail.utils';
import styles from './CourseAuthorsSection.module.css';

interface CourseAuthorsSectionProps {
  activeLanguage: ActiveLanguage;
  course: Course;
  courseAuthorFallback: string;
  title: string;
}

export default function CourseAuthorsSection({
  activeLanguage,
  course,
  courseAuthorFallback,
  title,
}: CourseAuthorsSectionProps) {
  return (
    <section className={styles.authorsSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.authorGrid}>
        {course.authors.map((author) => (
          <article key={author.id} className={styles.authorCard}>
            {author.photo ? (
              <Image
                src={author.photo}
                alt={author.name}
                className={styles.authorAvatarImage}
                width={50}
                height={50}
                unoptimized
                loading="lazy"
              />
            ) : (
              <div className={styles.authorAvatar}>{author.name.slice(0, 1)}</div>
            )}
            <div>
              <div className={styles.authorName}>{author.name}</div>
              <div className={styles.authorRole}>
                {getAuthorRole(activeLanguage, author, courseAuthorFallback)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

