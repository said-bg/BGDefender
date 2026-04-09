'use client';

import styles from './FavoriteButton.module.css';

type FavoriteButtonProps = {
  active: boolean;
  pending?: boolean;
  onToggle: () => void;
  addLabel: string;
  removeLabel: string;
  className?: string;
  visibleLabel?: string;
  variant?: 'icon' | 'pill';
};

export const FavoriteButton = ({
  active,
  pending = false,
  onToggle,
  addLabel,
  removeLabel,
  className = '',
  visibleLabel,
  variant = 'icon',
}: FavoriteButtonProps) => {
  const label = active ? removeLabel : addLabel;

  return (
    <button
      type="button"
      className={`${styles.button} ${active ? styles.buttonActive : ''} ${
        variant === 'pill' ? styles.buttonPill : ''
      } ${className}`}
      onClick={onToggle}
      aria-label={label}
      title={label}
      disabled={pending}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={styles.icon}
        fill={active ? 'currentColor' : 'none'}
      >
        <path
          d="M12 3.75l2.53 5.13 5.66.82-4.09 3.98.97 5.63L12 16.65 6.93 19.31l.97-5.63-4.09-3.98 5.66-.82L12 3.75z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {visibleLabel ? <span className={styles.label}>{visibleLabel}</span> : null}
    </button>
  );
};

export default FavoriteButton;
