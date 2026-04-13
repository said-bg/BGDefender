'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
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

const fallbackPalettes = [
  ['#ffb21f', '#ffa600', '#eb8f00'],
  ['#2563eb', '#3b82f6', '#1d4ed8'],
  ['#0f766e', '#14b8a6', '#115e59'],
  ['#7c3aed', '#8b5cf6', '#6d28d9'],
  ['#be185d', '#ec4899', '#9d174d'],
  ['#0f766e', '#22c55e', '#15803d'],
  ['#b45309', '#f59e0b', '#d97706'],
  ['#334155', '#475569', '#1e293b'],
];

function getPaletteIndex(seed: string) {
  return Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
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
  const displayTitle = getDisplayTitle(
    title,
    'Untitled course',
  );
  const [startColor, middleColor, endColor] =
    fallbackPalettes[getPaletteIndex(displayTitle) % fallbackPalettes.length];

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
      style={
        {
          '--course-cover-start': startColor,
          '--course-cover-middle': middleColor,
          '--course-cover-end': endColor,
        } as CSSProperties
      }
      aria-label={displayTitle}
    >
      {variant === 'hero' ? null : (
        <>
          <div className={styles.coverGlow} />
          <div className={styles.coverPlate}>
            <strong className={styles.coverTitle}>{displayTitle}</strong>
          </div>
        </>
      )}
    </div>
  );
}
