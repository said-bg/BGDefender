'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import styles from './CourseCover.module.css';

type CourseCoverProps = {
  src?: string | null;
  title: string;
  seedKey?: string | number | null;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  fallbackClassName?: string;
  variant?: 'card' | 'hero' | 'collection' | 'stack';
};

function getDisplayTitle(title: string, fallback: string) {
  const normalizedTitle = title.trim();
  return normalizedTitle || fallback;
}

function getPaletteIndex(seed: string) {
  return Array.from(seed).reduce(
    (total, character, index) => (total * 33 + character.charCodeAt(0) * (index + 1)) >>> 0,
    5381,
  );
}

function getFallbackColors(seed: number, variant: CourseCoverProps['variant']) {
  const hue = Math.round(((seed * 137.508) % 360 + 360) % 360);
  const saturation = variant === 'hero' ? 78 : variant === 'collection' ? 72 : 68;
  const lightness = variant === 'hero' ? 52 : variant === 'collection' ? 48 : 54;

  return {
    solid: `hsl(${hue} ${saturation}% ${lightness}%)`,
  };
}

export default function CourseCover({
  src,
  title,
  seedKey,
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
  const paletteSeed = getPaletteIndex(
    seedKey !== undefined && seedKey !== null && `${seedKey}`.length > 0
      ? String(seedKey)
      : displayTitle,
  );
  const { solid: solidColor } = getFallbackColors(
    paletteSeed,
    variant,
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
        variant === 'hero'
          ? styles.coverFallbackHero
          : variant === 'collection'
            ? styles.coverFallbackCollection
            : variant === 'stack'
              ? styles.coverFallbackStack
            : styles.coverFallbackCard
      } ${fallbackClassName ?? ''}`}
      style={
        {
          '--course-cover-solid': solidColor,
        } as CSSProperties
      }
      aria-label={displayTitle}
    >
      {variant === 'hero' || variant === 'stack' || variant === 'collection' ? null : (
        <>
          <div className={styles.coverPlate}>
            <strong className={styles.coverTitle}>{displayTitle}</strong>
          </div>
        </>
      )}
    </div>
  );
}
