'use client';

import dynamic from 'next/dynamic';
import { FormEvent, memo, useRef, useState } from 'react';
import { Chapter, SubChapter } from '@/services/course';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import featureStyles from '../../ContentPage.module.css';
import { ContentBlockFormState } from '../../lib/content.utils';

const styles = { ...formStyles, ...sharedStyles, ...featureStyles };

const RichTextBlockEditor = dynamic(() => import('@/components/admin/rich-text-block'), {
  ssr: false,
  loading: () => null,
});

type EditorLocale = 'en' | 'fi';

type ContentEditorPanelProps = {
  activeEditorLocale: EditorLocale;
  contentError: string | null;
  contentMessage: string | null;
  initialForm: ContentBlockFormState;
  isSubmittingContent: boolean;
  language: string;
  onEditorLocaleChange: (locale: EditorLocale) => void;
  onReset: () => void;
  onSubmitDraft: (draft: ContentBlockFormState) => void | Promise<void>;
  selectedChapter: Chapter | null;
  selectedSubChapter: SubChapter | null;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function ContentEditorPanel({
  activeEditorLocale,
  contentError,
  contentMessage,
  initialForm,
  isSubmittingContent,
  language,
  onEditorLocaleChange,
  onReset,
  onSubmitDraft,
  selectedChapter,
  selectedSubChapter,
  t,
}: ContentEditorPanelProps) {
  const [draft, setDraft] = useState(initialForm);
  const contentDraftRef = useRef({
    en: initialForm.contentEn,
    fi: initialForm.contentFi,
  });
  const [editorSeed, setEditorSeed] = useState(
    activeEditorLocale === 'fi' ? initialForm.contentFi : initialForm.contentEn,
  );
  const localizedEditorSeed =
    activeEditorLocale === 'fi' ? initialForm.contentFi : initialForm.contentEn;

  const handleLocaleChange = (locale: EditorLocale) => {
    setEditorSeed(locale === 'fi' ? contentDraftRef.current.fi : contentDraftRef.current.en);
    onEditorLocaleChange(locale);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmitDraft({
      ...draft,
      contentEn: contentDraftRef.current.en,
      contentFi: contentDraftRef.current.fi,
    });
  };

  if (!selectedChapter || !selectedSubChapter) {
    return (
      <section className={styles.contentEditorPanel}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t('edit.contentBlocks.emptyWithoutSubChapterTitle', {
              defaultValue: 'Create a subchapter first',
            })}
          </p>
        </div>
      </section>
    );
  }

  const localizedSubChapterTitle =
    language === 'fi' ? selectedSubChapter.titleFi : selectedSubChapter.titleEn;

  return (
    <section className={styles.contentEditorPanel}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.contentEditorMetaRow}>
          <label className={styles.field}>
            <span>{t('create.titleEn', { defaultValue: 'Title (English)' })}</span>
            <input
              value={draft.titleEn}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, titleEn: event.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span>{t('create.titleFi', { defaultValue: 'Title (Finnish)' })}</span>
            <input
              value={draft.titleFi}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, titleFi: event.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span>{t('edit.contentBlocks.orderInput', { defaultValue: 'Order' })}</span>
            <input
              type="number"
              min="1"
              value={draft.orderIndex}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, orderIndex: event.target.value }))
              }
            />
          </label>
        </div>

        <div className={styles.editorLocaleTabs}>
          <button
            type="button"
            className={`${styles.modeButton} ${
              activeEditorLocale === 'en' ? styles.modeButtonActive : ''
            }`}
            onClick={() => handleLocaleChange('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${
              activeEditorLocale === 'fi' ? styles.modeButtonActive : ''
            }`}
            onClick={() => handleLocaleChange('fi')}
          >
            FI
          </button>
        </div>

        <div className={styles.fieldWide}>
          <RichTextBlockEditor
            key={`${activeEditorLocale}:${localizedEditorSeed}`}
            initialValue={editorSeed}
            onChange={(value) => {
              if (activeEditorLocale === 'fi') {
                contentDraftRef.current.fi = value;
                return;
              }

              contentDraftRef.current.en = value;
            }}
            placeholder=""
            language={activeEditorLocale}
          />
        </div>

        <div className={styles.helperText}>
          {t('edit.contentBlocks.editingSubchapter', {
            title: localizedSubChapterTitle,
            defaultValue: 'Editing subchapter: {{title}}',
          })}
        </div>

        {contentMessage ? <p className={styles.successMessage}>{contentMessage}</p> : null}
        {contentError ? <p className={styles.errorMessage}>{contentError}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryAction} onClick={onReset}>
            {t('edit.contentBlocks.cancelEdit', { defaultValue: 'Cancel block edit' })}
          </button>
          <button type="submit" className={styles.primaryAction} disabled={isSubmittingContent}>
            {isSubmittingContent
              ? t('edit.contentBlocks.saving', { defaultValue: 'Saving block...' })
              : t('edit.contentBlocks.save', { defaultValue: 'Save block' })}
          </button>
        </div>
      </form>
    </section>
  );
}

export default memo(ContentEditorPanel);
