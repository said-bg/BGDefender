'use client';

import { memo } from 'react';
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
  const { t } = useTranslation('admin');
  const {
    editor,
    imageInputRef,
    videoInputRef,
    pdfInputRef,
    isUploading,
    selectedMedia,
    applyFontFamily,
    applyFontSize,
    setHeadingLevel,
    setLink,
    insertImageFromUrl,
    insertVideoFromUrl,
    insertPdfFromUrl,
    uploadAndInsert,
    handleMediaWidthChange,
    applyMediaAlign,
  } = useRichTextBlockEditor({
    initialValue,
    onChange,
    placeholder,
    language,
  });

  if (!editor) {
    return (
      <div className={styles.loading}>
        {t('edit.contentBlocks.loadingEditor', {
          defaultValue: 'Loading editor...',
        })}
      </div>
    );
  }

  return (
    <div className={styles.editorShell}>
      <RichTextBlockToolbar
        editor={editor}
        isUploading={isUploading}
        onApplyFontFamily={applyFontFamily}
        onApplyFontSize={applyFontSize}
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
          type={selectedMedia.type}
          width={selectedMedia.width}
          align={selectedMedia.align}
          onWidthChange={handleMediaWidthChange}
          onAlignChange={applyMediaAlign}
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
