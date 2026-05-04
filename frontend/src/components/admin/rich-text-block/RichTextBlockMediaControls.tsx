'use client';

import type { TFunction } from 'i18next';
import styles from './RichTextBlockMediaControls.module.css';

type RichTextBlockMediaControlsProps = {
  t: TFunction<'admin'>;
  type: 'image' | 'video';
  width: number;
  maxWidth: number;
  align: 'left' | 'center' | 'right';
  onWidthChange: (width: number) => void;
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
  onBeginInteraction: () => void;
  onEndInteraction: () => void;
  onRemove: () => void;
};

export default function RichTextBlockMediaControls({
  t,
  type,
  width,
  maxWidth,
  align,
  onWidthChange,
  onAlignChange,
  onBeginInteraction,
  onEndInteraction,
  onRemove,
}: RichTextBlockMediaControlsProps) {
  const widthInputId = `${type}-width-input`;
  const widthSliderId = `${type}-width-slider`;

  return (
    <div className={styles.mediaControls} data-media-controls="true">
      <div className={styles.mediaControlsHeader}>
        <strong>
          {type === 'image' ? t('richText.mediaTypeImage') : t('richText.mediaTypeVideo')}
        </strong>
        <span>{width}px</span>
      </div>
      <div className={styles.mediaHint}>
        {t('richText.mediaMaxWidthHint', { maxWidth })}
      </div>

      <div className={styles.mediaControlsRow}>
        <label className={styles.mediaField} htmlFor={widthInputId}>
          <span>{t('richText.mediaWidthLabel')}</span>
          <input
            id={widthInputId}
            className={styles.mediaNumberInput}
            type="number"
            min="160"
            max={maxWidth}
            step="1"
            title={t('richText.mediaWidthTitle')}
            aria-label={t('richText.mediaWidthTitle')}
            value={width}
            onMouseDownCapture={onBeginInteraction}
            onTouchStartCapture={onBeginInteraction}
            onFocus={onBeginInteraction}
            onBlur={onEndInteraction}
            onChange={(event) => onWidthChange(Number(event.target.value))}
          />
        </label>

        <input
          id={widthSliderId}
          className={styles.mediaSlider}
          type="range"
          min="160"
          max={maxWidth}
          step="1"
          title={t('richText.mediaWidthAdjust')}
          aria-label={t('richText.mediaWidthAdjust')}
          value={width}
          onMouseDownCapture={onBeginInteraction}
          onMouseUpCapture={onEndInteraction}
          onTouchStartCapture={onBeginInteraction}
          onTouchEndCapture={onEndInteraction}
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
            {t('richText.mediaAlignLeft')}
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'center'}
            onClick={() => onAlignChange('center')}
          >
            {t('richText.mediaAlignCenter')}
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'right'}
            onClick={() => onAlignChange('right')}
          >
            {t('richText.mediaAlignRight')}
          </button>
        </div>
        <button
          type="button"
          className={styles.mediaRemoveButton}
          onClick={onRemove}
        >
          {type === 'image' ? t('richText.removeImage') : t('richText.removeVideo')}
        </button>
      </div>
    </div>
  );
}
