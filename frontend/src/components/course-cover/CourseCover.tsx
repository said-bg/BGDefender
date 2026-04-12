'use client';

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
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

function getDisplayTitle(title: string, fallback: string) {
  const normalizedTitle = title.trim();
  return normalizedTitle || fallback;
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
  const { t } = useTranslation('courses');
  const displayTitle = getDisplayTitle(
    title,
    t('courseCover.untitled', { defaultValue: 'Untitled course' }),
  );

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
            <span className={styles.coverEyebrow}>
              {t('courseCover.brand', { defaultValue: 'BG Defender Academy' })}
            </span>
            <strong className={styles.coverTitle}>{displayTitle}</strong>
          </div>
        </>
      )}
    </div>
  );
}
