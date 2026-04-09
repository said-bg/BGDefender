'use client';

import styles from './RichTextBlockMediaControls.module.css';

type RichTextBlockMediaControlsProps = {
  type: 'image' | 'video';
  width: number;
  align: 'left' | 'center' | 'right';
  onWidthChange: (width: number) => void;
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
};

export default function RichTextBlockMediaControls({
  type,
  width,
  align,
  onWidthChange,
  onAlignChange,
}: RichTextBlockMediaControlsProps) {
  const widthInputId = `${type}-width-input`;
  const widthSliderId = `${type}-width-slider`;

  return (
    <div className={styles.mediaControls}>
      <div className={styles.mediaControlsHeader}>
        <strong>{type === 'image' ? 'Image' : 'Video'}</strong>
        <span>{width}px</span>
      </div>

      <div className={styles.mediaControlsRow}>
        <label className={styles.mediaField} htmlFor={widthInputId}>
          <span>Width (px)</span>
          <input
            id={widthInputId}
            className={styles.mediaNumberInput}
            type="number"
            min="160"
            max="1400"
            step="20"
            title="Media width in pixels"
            aria-label="Media width in pixels"
            value={width}
            onChange={(event) => onWidthChange(Number(event.target.value))}
          />
        </label>

        <input
          id={widthSliderId}
          className={styles.mediaSlider}
          type="range"
          min="160"
          max="1400"
          step="20"
          title="Adjust media width"
          aria-label="Adjust media width"
          value={width}
          onChange={(event) => onWidthChange(Number(event.target.value))}
        />
      </div>

      <div className={styles.mediaControlsRow}>
        <div className={styles.mediaAlignGroup}>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'left'}
            onClick={() => onAlignChange('left')}
          >
            Left
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'center'}
            onClick={() => onAlignChange('center')}
          >
            Center
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'right'}
            onClick={() => onAlignChange('right')}
          >
            Right
          </button>
        </div>
      </div>
    </div>
  );
}
