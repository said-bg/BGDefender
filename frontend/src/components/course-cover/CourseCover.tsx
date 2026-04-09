'use client';

import Image from 'next/image';
import styles from './CourseCover.module.css';

type CourseCoverProps = {
  src?: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  fallbackClassName?: string;
  variant?: 'card' | 'hero';
};

function getDisplayTitle(title: string) {
  const normalizedTitle = title.trim();
  return normalizedTitle || 'Untitled course';
}

export default function CourseCover({
  src,
  title,
  sizes,
  priority = false,
  imageClassName,
  fallbackClassName,
  variant = 'card',
}: CourseCoverProps) {
  const displayTitle = getDisplayTitle(title);

  if (src) {
    return (
      <Image
        src={src}
        alt={displayTitle}
        fill
        className={imageClassName}
        sizes={sizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <div
      className={`${styles.coverFallback} ${
        variant === 'hero' ? styles.coverFallbackHero : styles.coverFallbackCard
      } ${fallbackClassName ?? ''}`}
      aria-label={displayTitle}
    >
      {variant === 'hero' ? null : (
        <>
          <div className={styles.coverGlow} />
          <div className={styles.coverPlate}>
            <span className={styles.coverEyebrow}>BG Defender Academy</span>
            <strong className={styles.coverTitle}>{displayTitle}</strong>
          </div>
        </>
      )}
    </div>
  );
}
