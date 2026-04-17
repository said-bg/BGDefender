'use client';

import { useTranslation } from 'react-i18next';
import styles from './RichTextBlockMediaControls.module.css';

type RichTextBlockMediaControlsProps = {
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
  const { t } = useTranslation('admin');
  const widthInputId = `${type}-width-input`;
  const widthSliderId = `${type}-width-slider`;

  return (
    <div className={styles.mediaControls} data-media-controls="true">
      <div className={styles.mediaControlsHeader}>
        <strong>
          {type === 'image'
            ? t('richText.mediaTypeImage', { defaultValue: 'Image' })
            : t('richText.mediaTypeVideo', { defaultValue: 'Video' })}
        </strong>
        <span>{width}px</span>
      </div>
      <div className={styles.mediaHint}>
        {t('richText.mediaMaxWidthHint', {
          defaultValue: 'Maximum usable width: {{maxWidth}}px',
          maxWidth,
        })}
      </div>

      <div className={styles.mediaControlsRow}>
        <label className={styles.mediaField} htmlFor={widthInputId}>
          <span>
            {t('richText.mediaWidthLabel', { defaultValue: 'Width (px)' })}
          </span>
          <input
            id={widthInputId}
            className={styles.mediaNumberInput}
            type="number"
            min="160"
            max={maxWidth}
            step="1"
            title={t('richText.mediaWidthTitle', {
              defaultValue: 'Media width in pixels',
            })}
            aria-label={t('richText.mediaWidthTitle', {
              defaultValue: 'Media width in pixels',
            })}
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
          title={t('richText.mediaWidthAdjust', {
            defaultValue: 'Adjust media width',
          })}
          aria-label={t('richText.mediaWidthAdjust', {
            defaultValue: 'Adjust media width',
          })}
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
            {t('richText.mediaAlignLeft', { defaultValue: 'Left' })}
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'center'}
            onClick={() => onAlignChange('center')}
          >
            {t('richText.mediaAlignCenter', { defaultValue: 'Center' })}
          </button>
          <button
            type="button"
            className={styles.mediaAlignButton}
            data-active={align === 'right'}
            onClick={() => onAlignChange('right')}
          >
            {t('richText.mediaAlignRight', { defaultValue: 'Right' })}
          </button>
        </div>
        <button
          type="button"
          className={styles.mediaRemoveButton}
          onClick={onRemove}
        >
          {type === 'image'
            ? t('richText.removeImage', { defaultValue: 'Remove image' })
            : t('richText.removeVideo', { defaultValue: 'Remove video' })}
        </button>
      </div>
    </div>
  );
}
