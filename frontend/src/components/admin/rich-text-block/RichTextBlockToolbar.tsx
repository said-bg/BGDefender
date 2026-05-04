'use client';

import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import type { TFunction } from 'i18next';
import {
  BLOCK_OPTIONS,
  FONT_FAMILY_OPTIONS,
} from './richTextBlockEditor.extensions';
import RichTextColorControl from './toolbar/RichTextColorControl';
import RichTextFontSizeControl from './toolbar/RichTextFontSizeControl';
import RichTextToolbarIcon from './toolbar/RichTextToolbarIcon';
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
  t: TFunction<'admin'>;
  onApplyFontFamily: (value: string) => void;
  onApplyFontSize: (value: string) => void;
  onApplyTextColor: (value: string) => void;
  onSetHeadingLevel: (value: string) => void;
  onSetLink: () => void;
  onInsertImageFromUrl: () => void;
  onUploadImage: () => void;
  onInsertVideoFromUrl: () => void;
  onUploadVideo: () => void;
  onInsertPdfFromUrl: () => void;
  onUploadPdf: () => void;
};

type ToolbarSnapshot = {
  activeBlock: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
};

const DEFAULT_TOOLBAR_SNAPSHOT: ToolbarSnapshot = {
  activeBlock: 'paragraph',
  fontFamily: 'Default',
  fontSize: 'Default',
  textColor: '',
};

const resolveBlockOptionLabel = (
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  switch (value) {
    case 'paragraph':
      return t('richText.blockOptionParagraph');
    case '1':
      return t('richText.blockOptionHeading1');
    case '2':
      return t('richText.blockOptionHeading2');
    case '3':
      return t('richText.blockOptionHeading3');
    default:
      return value;
  }
};

const resolveFontFamilyOptionLabel = (
  label: string,
  value: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (value === 'Default') {
    return t('richText.fontFamilyDefault');
  }

  return label;
};

export default function RichTextBlockToolbar({
  editor,
  isUploading,
  t,
  onApplyFontFamily,
  onApplyFontSize,
  onApplyTextColor,
  onSetHeadingLevel,
  onSetLink,
  onInsertImageFromUrl,
  onUploadImage,
  onInsertVideoFromUrl,
  onUploadVideo,
  onInsertPdfFromUrl,
  onUploadPdf,
}: RichTextBlockToolbarProps) {
  const toolbarState =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => {
        if (!currentEditor) {
          return DEFAULT_TOOLBAR_SNAPSHOT;
        }

        const textStyleAttributes = currentEditor.getAttributes('textStyle');
        const headingLevel = [1, 2, 3].find((level) =>
          currentEditor.isActive('heading', { level }),
        );

        return {
          activeBlock: headingLevel ? String(headingLevel) : 'paragraph',
          fontFamily: textStyleAttributes.fontFamily || 'Default',
          fontSize: textStyleAttributes.fontSize || 'Default',
          textColor: textStyleAttributes.color || '',
        };
      },
    }) ?? DEFAULT_TOOLBAR_SNAPSHOT;

  const inlineActions = buildInlineActions(editor, t);
  const listActions = buildListActions(editor, t);
  const alignActions = buildAlignActions(editor, t);
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
    t,
  });

  const renderActionGroup = (actions: ToolbarAction[]) =>
    actions.map((action) => (
      <button
        key={action.title}
        type="button"
        className={styles.toolbarButton}
        title={action.title}
        aria-label={action.title}
        data-active={action.isActive ? 'true' : 'false'}
        onClick={action.onClick}
        disabled={action.disabled}
      >
        <RichTextToolbarIcon name={action.icon} />
      </button>
    ));

  const resolveSelectValue = (
    value: string,
    options: ReadonlyArray<{ value: string }>,
    fallback: string,
  ) => (options.some((option) => option.value === value) ? value : fallback);

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarScroller}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarButton}
            title={t('richText.undo')}
            aria-label={t('richText.undo')}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <RichTextToolbarIcon name="undo" />
          </button>
          <button
            type="button"
            className={styles.toolbarButton}
            title={t('richText.redo')}
            aria-label={t('richText.redo')}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <RichTextToolbarIcon name="redo" />
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <select
            className={styles.toolbarSelect}
            aria-label={t('richText.blockStyle')}
            value={resolveSelectValue(toolbarState.activeBlock, BLOCK_OPTIONS, 'paragraph')}
            onChange={(event) => onSetHeadingLevel(event.target.value)}
          >
            {BLOCK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {resolveBlockOptionLabel(option.value, t)}
              </option>
            ))}
          </select>
          <select
            className={styles.toolbarSelect}
            aria-label={t('richText.fontFamily')}
            value={resolveSelectValue(toolbarState.fontFamily, FONT_FAMILY_OPTIONS, 'Default')}
            onChange={(event) => onApplyFontFamily(event.target.value)}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {resolveFontFamilyOptionLabel(option.label, option.value, t)}
              </option>
            ))}
          </select>
          <RichTextFontSizeControl
            currentFontSize={toolbarState.fontSize}
            onApply={onApplyFontSize}
            t={t}
          />
        </div>

        <div className={styles.toolbarGroup}>{renderActionGroup(inlineActions)}</div>
        <div className={styles.toolbarGroup}>{renderActionGroup(listActions)}</div>
        <div className={styles.toolbarGroup}>{renderActionGroup(alignActions)}</div>

        <div className={styles.toolbarGroup}>
          <RichTextColorControl
            currentColor={toolbarState.textColor}
            onApply={onApplyTextColor}
            t={t}
          />
        </div>

        <div className={styles.toolbarGroup}>{renderActionGroup(insertActions)}</div>
      </div>
    </div>
  );
}
