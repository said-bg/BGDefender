import type { Editor } from '@tiptap/react';
import type { TFunction } from 'i18next';
import type { ToolbarIconName } from './RichTextToolbarIcon';

type ToolbarAction = {
  icon: ToolbarIconName;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
};

export const buildInlineActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    icon: 'bold',
    title: t('richText.bold'),
    onClick: () => editor.chain().focus().toggleBold().run(),
    isActive: editor.isActive('bold'),
  },
  {
    icon: 'code',
    title: t('richText.code'),
    onClick: () => editor.chain().focus().toggleCode().run(),
    isActive: editor.isActive('code'),
  },
  {
    icon: 'italic',
    title: t('richText.italic'),
    onClick: () => editor.chain().focus().toggleItalic().run(),
    isActive: editor.isActive('italic'),
  },
  {
    icon: 'underline',
    title: t('richText.underline'),
    onClick: () => editor.chain().focus().toggleUnderline().run(),
    isActive: editor.isActive('underline'),
  },
  {
    icon: 'strike',
    title: t('richText.strike'),
    onClick: () => editor.chain().focus().toggleStrike().run(),
    isActive: editor.isActive('strike'),
  },
];

export const buildListActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    icon: 'bulletList',
    title: t('richText.bulletList'),
    onClick: () => editor.chain().focus().toggleBulletList().run(),
    isActive: editor.isActive('bulletList'),
  },
  {
    icon: 'orderedList',
    title: t('richText.numberedList'),
    onClick: () => editor.chain().focus().toggleOrderedList().run(),
    isActive: editor.isActive('orderedList'),
  },
  {
    icon: 'taskList',
    title: t('richText.checklist'),
    onClick: () => editor.chain().focus().toggleTaskList().run(),
    isActive: editor.isActive('taskList'),
  },
  {
    icon: 'blockquote',
    title: t('richText.quote'),
    onClick: () => editor.chain().focus().toggleBlockquote().run(),
    isActive: editor.isActive('blockquote'),
  },
  {
    icon: 'codeBlock',
    title: t('richText.codeBlock'),
    onClick: () => editor.chain().focus().toggleCodeBlock().run(),
    isActive: editor.isActive('codeBlock'),
  },
];

export const buildAlignActions = (editor: Editor, t: TFunction<'admin'>): ToolbarAction[] => [
  {
    icon: 'alignLeft',
    title: t('richText.alignLeft'),
    onClick: () => editor.chain().focus().setTextAlign('left').run(),
    isActive: editor.isActive({ textAlign: 'left' }),
  },
  {
    icon: 'alignCenter',
    title: t('richText.alignCenter'),
    onClick: () => editor.chain().focus().setTextAlign('center').run(),
    isActive: editor.isActive({ textAlign: 'center' }),
  },
  {
    icon: 'alignRight',
    title: t('richText.alignRight'),
    onClick: () => editor.chain().focus().setTextAlign('right').run(),
    isActive: editor.isActive({ textAlign: 'right' }),
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
  {
    icon: 'link',
    title: t('richText.link'),
    onClick: onSetLink,
    isActive: editor.isActive('link'),
  },
  {
    icon: 'image',
    title: t('richText.insertImageFromUrl'),
    onClick: onInsertImageFromUrl,
  },
  {
    icon: 'imageUpload',
    title: t('richText.uploadImage'),
    onClick: onUploadImage,
    disabled: isUploading,
  },
  {
    icon: 'video',
    title: t('richText.insertVideoFromUrl'),
    onClick: onInsertVideoFromUrl,
  },
  {
    icon: 'videoUpload',
    title: t('richText.uploadVideo'),
    onClick: onUploadVideo,
    disabled: isUploading,
  },
  {
    icon: 'pdf',
    title: t('richText.insertPdfLink'),
    onClick: onInsertPdfFromUrl,
  },
  {
    icon: 'pdfUpload',
    title: t('richText.uploadPdf'),
    onClick: onUploadPdf,
    disabled: isUploading,
  },
  {
    icon: 'horizontalRule',
    title: t('richText.horizontalRule'),
    onClick: () => editor.chain().focus().setHorizontalRule().run(),
  },
];

export type { ToolbarAction };
