'use client';

import { useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { FONT_SIZE_PRESET_VALUES } from '../richTextBlockEditor.extensions';
import styles from '../RichTextBlockToolbar.module.css';

type RichTextFontSizeControlProps = {
  currentFontSize: string;
  onApply: (value: string) => void;
  t: TFunction<'admin'>;
};

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

const formatFontSizeValue = (value: string) => {
  if (!value || value === 'Default') {
    return '';
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? String(parsed) : '';
};

const normalizeFontSizeValue = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Default';
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parsed));
  return `${clamped}px`;
};

export default function RichTextFontSizeControl({
  currentFontSize,
  onApply,
  t,
}: RichTextFontSizeControlProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState('');

  const currentValue = formatFontSizeValue(currentFontSize);
  const triggerLabel = currentValue || t('richText.fontSizeDefault', { defaultValue: 'Size' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        const normalized = normalizeFontSizeValue(draftValue);
        if (normalized) {
          onApply(normalized);
        }
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [draftValue, isOpen, onApply]);

  const applyAndClose = (value: string) => {
    onApply(value);
    setDraftValue(formatFontSizeValue(value));
    setIsOpen(false);
  };

  const commitDraftValue = (shouldClose = false) => {
    const normalized = normalizeFontSizeValue(draftValue);

    if (!normalized) {
      setDraftValue(currentValue);
      if (shouldClose) {
        setIsOpen(false);
      }
      return;
    }

    onApply(normalized);
    setDraftValue(formatFontSizeValue(normalized));
    if (shouldClose) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.fontSizeControl}>
      <button
        type="button"
        className={styles.toolbarSelectButton}
        aria-haspopup="dialog"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-label={t('richText.fontSize', { defaultValue: 'Font size' })}
        data-active={currentValue ? 'true' : 'false'}
        onClick={() => {
          if (!isOpen) {
            setDraftValue(currentValue);
          }
          setIsOpen((previous) => !previous);
        }}
      >
        <span className={styles.toolbarSelectButtonText}>{triggerLabel}</span>
      </button>

      {isOpen ? (
        <div
          className={styles.fontSizePanel}
          role="dialog"
          aria-label={t('richText.fontSize', { defaultValue: 'Font size' })}
        >
          <div className={styles.fontSizeInputRow}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              className={styles.fontSizePanelInput}
              aria-label={t('richText.fontSize', { defaultValue: 'Font size' })}
              placeholder={t('richText.fontSizeDefault', { defaultValue: 'Size' })}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitDraftValue(true);
                }
              }}
            />
            <button
              type="button"
              className={styles.colorResetButton}
              onClick={() => applyAndClose('Default')}
            >
              {t('richText.clearColor', { defaultValue: 'Reset' })}
            </button>
          </div>

          <div className={styles.fontSizePresetList}>
            {FONT_SIZE_PRESET_VALUES.map((size) => (
              <button
                key={size}
                type="button"
                className={styles.fontSizePresetItem}
                data-active={currentValue === String(size) ? 'true' : 'false'}
                onClick={() => applyAndClose(`${size}px`)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
