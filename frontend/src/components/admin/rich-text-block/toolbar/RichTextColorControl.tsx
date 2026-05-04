import type { TFunction } from 'i18next';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../RichTextBlockToolbar.module.css';

type RichTextColorControlProps = {
  currentColor: string;
  onApply: (value: string) => void;
  t: TFunction<'admin'>;
};

type ParsedColor = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

const FALLBACK_PICKER_COLOR = '#1f7a6a';
const PRESET_COLORS = [
  { value: '#000000', toneClassName: styles.colorPresetInk },
  { value: '#52525b', toneClassName: styles.colorPresetStone },
  { value: '#92400e', toneClassName: styles.colorPresetBrown },
  { value: '#dc2626', toneClassName: styles.colorPresetRed },
  { value: '#ea580c', toneClassName: styles.colorPresetOrange },
  { value: '#ca8a04', toneClassName: styles.colorPresetGold },
  { value: '#16a34a', toneClassName: styles.colorPresetGreen },
  { value: '#0f766e', toneClassName: styles.colorPresetTeal },
  { value: '#2563eb', toneClassName: styles.colorPresetBlue },
  { value: '#7c3aed', toneClassName: styles.colorPresetViolet },
  { value: '#db2777', toneClassName: styles.colorPresetPink },
  { value: '#64748b', toneClassName: styles.colorPresetSteel },
  { value: '#1f7a6a', toneClassName: styles.colorPresetMint },
];

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const clampAlpha = (value: number) => Math.max(0, Math.min(1, value));

const toHex = (value: number) => clampChannel(value).toString(16).padStart(2, '0');

const formatHex = ({ red, green, blue }: ParsedColor) =>
  `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();

const formatCssColor = ({ red, green, blue, alpha }: ParsedColor) => {
  if (alpha >= 0.995) {
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  const roundedAlpha = Math.round(alpha * 100) / 100;
  return `rgba(${clampChannel(red)}, ${clampChannel(green)}, ${clampChannel(blue)}, ${roundedAlpha})`;
};

const isValidCssColor = (value: string) => {
  if (!value.trim() || typeof document === 'undefined') {
    return true;
  }

  const option = new Option();
  option.style.color = '';
  option.style.color = value.trim();
  return option.style.color !== '';
};

const parseCssColor = (value: string): ParsedColor | null => {
  const trimmed = value.trim();

  if (!trimmed || typeof document === 'undefined') {
    return null;
  }

  const option = new Option();
  option.style.color = '';
  option.style.color = trimmed;

  if (!option.style.color) {
    return null;
  }

  const normalized = option.style.color;

  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    const chunk = hex.length === 3 ? 1 : 2;
    const read = (index: number) => {
      const piece = hex.slice(index, index + chunk);
      const normalizedPiece = chunk === 1 ? `${piece}${piece}` : piece;
      return Number.parseInt(normalizedPiece, 16);
    };

    return {
      red: read(0),
      green: read(chunk),
      blue: read(chunk * 2),
      alpha: 1,
    };
  }

  const match = normalized.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i,
  );

  if (!match) {
    return null;
  }

  return {
    red: Number(match[1]),
    green: Number(match[2]),
    blue: Number(match[3]),
    alpha: match[4] ? clampAlpha(Number(match[4])) : 1,
  };
};

const normalizeColorForPicker = (value: string) => {
  const parsed = parseCssColor(value);
  return parsed ? formatHex(parsed).toLowerCase() : FALLBACK_PICKER_COLOR;
};

const formatColorSummary = (value: string) => {
  const parsed = parseCssColor(value);

  if (!parsed) {
    return null;
  }

  return parsed.alpha >= 0.995
    ? formatHex(parsed)
    : `${formatHex(parsed)} ${Math.round(parsed.alpha * 100)}%`;
};

function RichTextColorControl({
  currentColor,
  onApply,
  t,
}: RichTextColorControlProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerSwatchRef = useRef<HTMLSpanElement | null>(null);
  const panelSwatchRef = useRef<HTMLSpanElement | null>(null);
  const [draftColor, setDraftColor] = useState(currentColor);
  const [isOpen, setIsOpen] = useState(false);
  const parsedDraftColor = useMemo(
    () => parseCssColor(draftColor) ?? parseCssColor(currentColor),
    [currentColor, draftColor],
  );

  useEffect(() => {
    setDraftColor(currentColor);
  }, [currentColor]);

  useEffect(() => {
    triggerSwatchRef.current?.style.setProperty(
      '--toolbar-current-color',
      currentColor || 'transparent',
    );
  }, [currentColor]);

  useEffect(() => {
    panelSwatchRef.current?.style.setProperty(
      '--toolbar-current-color',
      draftColor || currentColor || 'transparent',
    );
  }, [currentColor, draftColor]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
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
  }, [isOpen]);

  const colorSummary = useMemo(
    () => formatColorSummary(currentColor),
    [currentColor],
  );

  const applyColor = (value: string, shouldClose = false) => {
    const normalized = value.trim();

    if (!normalized) {
      setDraftColor('');
      onApply('');
      if (shouldClose) {
        setIsOpen(false);
      }
      return;
    }

    if (!isValidCssColor(normalized)) {
      setDraftColor(currentColor);
      return;
    }

    setDraftColor(normalized);
    onApply(normalized);
    if (shouldClose) {
      setIsOpen(false);
    }
  };

  const updateParsedDraft = (next: Partial<ParsedColor>) => {
    const base = parsedDraftColor ?? {
      red: 31,
      green: 122,
      blue: 106,
      alpha: 1,
    };

    const resolved: ParsedColor = {
      red: next.red ?? base.red,
      green: next.green ?? base.green,
      blue: next.blue ?? base.blue,
      alpha: next.alpha ?? base.alpha,
    };

    applyColor(formatCssColor(resolved));
  };

  return (
    <div ref={rootRef} className={styles.colorControl}>
      <button
        type="button"
        className={styles.colorTrigger}
        data-active={currentColor ? 'true' : 'false'}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span
          ref={triggerSwatchRef}
          className={styles.colorTriggerSwatch}
          aria-hidden="true"
        />
        <span className={styles.srOnly}>{t('richText.textColor')} </span>
        <span className={styles.colorSummaryText}>{colorSummary || t('richText.textColorShort')}</span>
      </button>

      <div
        className={styles.colorPanel}
        hidden={!isOpen}
      >
          <div className={styles.colorPanelHeader}>
            <span>{t('richText.textColor')}</span>
            <button
              type="button"
              className={styles.colorResetButton}
              onClick={() => {
                setDraftColor('');
                onApply('');
                setIsOpen(false);
              }}
            >
              {t('richText.clearColor')}
            </button>
          </div>

          <div className={styles.colorPresetGrid}>
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor.value}
                type="button"
                className={styles.colorPresetButton}
                data-active={
                  normalizeColorForPicker(currentColor) === presetColor.value.toLowerCase()
                }
                aria-label={`${t('richText.textColor')} ${presetColor.value.toUpperCase()}`}
                onClick={() => applyColor(presetColor.value, true)}
              >
                <span
                  className={`${styles.colorPresetSwatch} ${presetColor.toneClassName}`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <div className={styles.colorPanelRow}>
            <label className={styles.colorSwatch} title={t('richText.textColor')}>
              <input
                type="color"
                value={normalizeColorForPicker(draftColor || currentColor)}
                aria-label={t('richText.textColorPicker')}
                onChange={(event) => {
                  const nextColor = event.target.value;
                  setDraftColor(nextColor);
                  const parsedNextColor = parseCssColor(nextColor);
                  if (parsedNextColor) {
                    updateParsedDraft(parsedNextColor);
                  }
                }}
              />
              <span
                ref={panelSwatchRef}
                className={styles.colorSwatchPreview}
                aria-hidden="true"
              />
            </label>

            <input
              type="text"
              className={styles.colorTextInput}
              value={draftColor}
              placeholder="#1F7A6A or rgba(...)"
              aria-label={t('richText.textColorValue')}
              onChange={(event) => setDraftColor(event.target.value)}
              onBlur={() => applyColor(draftColor)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyColor(draftColor, true);
                }
              }}
            />
          </div>

          <label className={styles.colorSliderField}>
            <span>{t('richText.opacity')}</span>
            <div className={styles.colorSliderRow}>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                className={styles.colorSlider}
                value={Math.round((parsedDraftColor?.alpha ?? 1) * 100)}
                aria-label={t('richText.opacity')}
                onChange={(event) => {
                  const nextAlpha = Number(event.target.value) / 100;
                  updateParsedDraft({ alpha: nextAlpha });
                }}
              />
              <span className={styles.colorSliderValue}>
                {Math.round((parsedDraftColor?.alpha ?? 1) * 100)}%
              </span>
            </div>
          </label>
      </div>
    </div>
  );
}

export default memo(RichTextColorControl);
