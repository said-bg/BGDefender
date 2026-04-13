'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NavbarLanguageSwitcher.module.css';

type SupportedLanguage = 'en' | 'fi';

interface NavbarLanguageSwitcherProps {
  activeLanguage: string;
  onChangeLanguage: (language: SupportedLanguage) => void;
}

export default function NavbarLanguageSwitcher({
  activeLanguage,
  onChangeLanguage,
}: NavbarLanguageSwitcherProps) {
  const { t } = useTranslation('navbar');
  const normalizedLanguage = activeLanguage.split('-')[0];
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: Array<{ code: SupportedLanguage; label: string }> = [
    { code: 'fi', label: t('language.finnish') },
    { code: 'en', label: t('language.english') },
  ];
  const triggerLabel =
    normalizedLanguage === 'fi'
      ? t('language.triggerFinnish')
      : t('language.triggerEnglish');

  return (
    <div
      className={styles.languageSwitcher}
      aria-label={t('language.switcherLabel')}
      ref={switcherRef}
    >
      <button
        type="button"
        className={styles.switcherTrigger}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        <span className={styles.globeIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M12 4c2.2 2.2 3.4 5 3.4 8S14.2 17.8 12 20"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 4c-2.2 2.2-3.4 5-3.4 8s1.2 5.8 3.4 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M6.2 8.2h11.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M6.2 15.8h11.6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div className={styles.languageMenu} role="menu">
          {options.map((option) => {
            const isActive = normalizedLanguage === option.code;

            return (
              <button
                key={option.code}
                type="button"
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                onClick={() => {
                  onChangeLanguage(option.code);
                  setIsOpen(false);
                }}
                aria-pressed={isActive}
              >
                <span>{option.label}</span>
                {isActive ? <span className={styles.menuCheck}>{'\u2713'}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
