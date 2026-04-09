'use client';

import type { Editor } from '@tiptap/react';
import {
  BLOCK_OPTIONS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
} from './richTextBlockEditor.extensions';
import {
  buildAlignActions,
  buildInlineActions,
  buildInsertActions,
  buildListActions,
  ToolbarAction,
} from './toolbar/richTextBlockToolbar.config';
import styles from './RichTextBlockToolbar.module.css';

type RichTextBlockToolbarProps = {
  editor: Editor;
  isUploading: boolean;
  onApplyFontFamily: (value: string) => void;
  onApplyFontSize: (value: string) => void;
  onSetHeadingLevel: (value: string) => void;
  onSetLink: () => void;
  onInsertImageFromUrl: () => void;
  onUploadImage: () => void;
  onInsertVideoFromUrl: () => void;
  onUploadVideo: () => void;
  onInsertPdfFromUrl: () => void;
  onUploadPdf: () => void;
};

export default function RichTextBlockToolbar({
  editor,
  isUploading,
  onApplyFontFamily,
  onApplyFontSize,
  onSetHeadingLevel,
  onSetLink,
  onInsertImageFromUrl,
  onUploadImage,
  onInsertVideoFromUrl,
  onUploadVideo,
  onInsertPdfFromUrl,
  onUploadPdf,
}: RichTextBlockToolbarProps) {
  const inlineActions = buildInlineActions(editor);
  const listActions = buildListActions(editor);
  const alignActions = buildAlignActions(editor);
  const insertActions = buildInsertActions({
    editor,
    isUploading,
    onInsertImageFromUrl,
    onUploadImage,
    onInsertVideoFromUrl,
    onUploadVideo,
    onInsertPdfFromUrl,
    onUploadPdf,
    onSetLink,
  });

  const renderActionGroup = (actions: ToolbarAction[]) =>
    actions.map((action) => (
      <button
        key={action.title}
        type="button"
        className={styles.toolbarButton}
        title={action.title}
        onClick={action.onClick}
        disabled={action.disabled}
      >
        {action.label}
      </button>
    ));

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarButton}
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          Un
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          Re
        </button>
      </div>

      <div className={styles.toolbarGroup}>
        <select
          className={styles.toolbarSelect}
          aria-label="Block style"
          defaultValue="paragraph"
          onChange={(event) => onSetHeadingLevel(event.target.value)}
        >
          {BLOCK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={styles.toolbarSelect}
          aria-label="Font family"
          defaultValue="Default"
          onChange={(event) => onApplyFontFamily(event.target.value)}
        >
          {FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={styles.toolbarSelect}
          aria-label="Font size"
          defaultValue="Default"
          onChange={(event) => onApplyFontSize(event.target.value)}
        >
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.toolbarGroup}>
        {renderActionGroup(inlineActions)}
      </div>

      <div className={styles.toolbarGroup}>
        {renderActionGroup(listActions)}
      </div>

      <div className={styles.toolbarGroup}>
        {renderActionGroup(alignActions)}
      </div>

      <div className={styles.toolbarGroup}>
        {renderActionGroup(insertActions)}
      </div>
    </div>
  );
}

