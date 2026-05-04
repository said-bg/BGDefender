'use client';

import { memo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { EditorContent } from '@tiptap/react';
import RichTextBlockMediaControls from './RichTextBlockMediaControls';
import RichTextBlockToolbar from './RichTextBlockToolbar';
import useRichTextBlockEditor from './useRichTextBlockEditor';
import styles from './RichTextBlockEditor.module.css';

type RichTextBlockEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  language: 'en' | 'fi';
};

function RichTextBlockEditor({
  initialValue,
  onChange,
  placeholder,
  language,
}: RichTextBlockEditorProps) {
  const { t } = useTranslation('admin', { lng: language });
  const {
    editor,
    imageInputRef,
    videoInputRef,
    pdfInputRef,
    isUploading,
    selectedMedia,
    applyFontFamily,
    applyFontSize,
    applyTextColor,
    setHeadingLevel,
    setLink,
    insertImageFromUrl,
    insertVideoFromUrl,
    insertPdfFromUrl,
    uploadAndInsert,
    handleMediaWidthChange,
    applyMediaAlign,
    beginMediaInteraction,
    endMediaInteraction,
    removeSelectedMedia,
    maxMediaWidth,
  } = useRichTextBlockEditor({
    initialValue,
    onChange,
    placeholder,
    language,
    t,
  });

  if (!editor) {
    return <div className={styles.loading}>{t('edit.contentBlocks.loadingEditor')}</div>;
  }

  return (
    <div className={styles.editorShell}>
      <RichTextBlockToolbar
        editor={editor}
        isUploading={isUploading}
        t={t as TFunction<'admin'>}
        onApplyFontFamily={applyFontFamily}
        onApplyFontSize={applyFontSize}
        onApplyTextColor={applyTextColor}
        onSetHeadingLevel={setHeadingLevel}
        onSetLink={setLink}
        onInsertImageFromUrl={insertImageFromUrl}
        onUploadImage={() => imageInputRef.current?.click()}
        onInsertVideoFromUrl={insertVideoFromUrl}
        onUploadVideo={() => videoInputRef.current?.click()}
        onInsertPdfFromUrl={insertPdfFromUrl}
        onUploadPdf={() => pdfInputRef.current?.click()}
      />

      {selectedMedia ? (
        <RichTextBlockMediaControls
          t={t as TFunction<'admin'>}
          type={selectedMedia.type}
          width={selectedMedia.width}
          maxWidth={maxMediaWidth}
          align={selectedMedia.align}
          onWidthChange={handleMediaWidthChange}
          onAlignChange={applyMediaAlign}
          onBeginInteraction={beginMediaInteraction}
          onEndInteraction={endMediaInteraction}
          onRemove={removeSelectedMedia}
        />
      ) : null}

      <input
        ref={imageInputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => void uploadAndInsert(event.target.files?.[0], 'image')}
      />
      <input
        ref={videoInputRef}
        hidden
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        onChange={(event) => void uploadAndInsert(event.target.files?.[0], 'video')}
      />
      <input
        ref={pdfInputRef}
        hidden
        type="file"
        accept=".pdf,application/pdf"
        onChange={(event) => void uploadAndInsert(event.target.files?.[0], 'pdf')}
      />

      <div className={styles.editorSurface}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default memo(RichTextBlockEditor);
