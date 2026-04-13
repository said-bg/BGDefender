import type { Editor } from '@tiptap/react';
import type { TFunction } from 'i18next';

type ToolbarAction = {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
};

export const buildInlineActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    label: 'B',
    title: t('richText.bold', { defaultValue: 'Bold' }),
    onClick: () => editor.chain().focus().toggleBold().run(),
  },
  {
    label: 'I',
    title: t('richText.italic', { defaultValue: 'Italic' }),
    onClick: () => editor.chain().focus().toggleItalic().run(),
  },
  {
    label: 'U',
    title: t('richText.underline', { defaultValue: 'Underline' }),
    onClick: () => editor.chain().focus().toggleUnderline().run(),
  },
  {
    label: 'S',
    title: t('richText.strike', { defaultValue: 'Strike' }),
    onClick: () => editor.chain().focus().toggleStrike().run(),
  },
];

export const buildListActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    label: 'Bul',
    title: t('richText.bulletList', { defaultValue: 'Bullet list' }),
    onClick: () => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Num',
    title: t('richText.numberedList', { defaultValue: 'Numbered list' }),
    onClick: () => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Task',
    title: t('richText.checklist', { defaultValue: 'Checklist' }),
    onClick: () => editor.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Q',
    title: t('richText.quote', { defaultValue: 'Quote' }),
    onClick: () => editor.chain().focus().toggleBlockquote().run(),
  },
];

export const buildAlignActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    label: 'L',
    title: t('richText.alignLeft', { defaultValue: 'Align left' }),
    onClick: () => editor.chain().focus().setTextAlign('left').run(),
  },
  {
    label: 'C',
    title: t('richText.alignCenter', { defaultValue: 'Align center' }),
    onClick: () => editor.chain().focus().setTextAlign('center').run(),
  },
  {
    label: 'R',
    title: t('richText.alignRight', { defaultValue: 'Align right' }),
    onClick: () => editor.chain().focus().setTextAlign('right').run(),
  },
];

type InsertActionsParams = {
  isUploading: boolean;
  onInsertImageFromUrl: () => void;
  onUploadImage: () => void;
  onInsertVideoFromUrl: () => void;
  onUploadVideo: () => void;
  onInsertPdfFromUrl: () => void;
  onUploadPdf: () => void;
  onSetLink: () => void;
  editor: Editor;
  t: TFunction<'admin'>;
};

export const buildInsertActions = ({
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
}: InsertActionsParams): ToolbarAction[] => [
  { label: 'Ln', title: t('richText.link', { defaultValue: 'Link' }), onClick: onSetLink },
  {
    label: 'Img',
    title: t('richText.insertImageFromUrl', { defaultValue: 'Insert image from URL' }),
    onClick: onInsertImageFromUrl,
  },
  {
    label: 'Img+',
    title: t('richText.uploadImage', { defaultValue: 'Upload image' }),
    onClick: onUploadImage,
    disabled: isUploading,
  },
  {
    label: 'Vid',
    title: t('richText.insertVideoFromUrl', { defaultValue: 'Insert video from URL' }),
    onClick: onInsertVideoFromUrl,
  },
  {
    label: 'Vid+',
    title: t('richText.uploadVideo', { defaultValue: 'Upload video' }),
    onClick: onUploadVideo,
    disabled: isUploading,
  },
  {
    label: 'PDF',
    title: t('richText.insertPdfLink', { defaultValue: 'Insert PDF link' }),
    onClick: onInsertPdfFromUrl,
  },
  {
    label: 'PDF+',
    title: t('richText.uploadPdf', { defaultValue: 'Upload PDF' }),
    onClick: onUploadPdf,
    disabled: isUploading,
  },
  {
    label: '---',
    title: t('richText.horizontalRule', { defaultValue: 'Horizontal rule' }),
    onClick: () => editor.chain().focus().setHorizontalRule().run(),
  },
];

export type { ToolbarAction };
