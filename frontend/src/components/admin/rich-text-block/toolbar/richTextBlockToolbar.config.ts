import type { Editor } from '@tiptap/react';

type ToolbarAction = {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
};

export const buildInlineActions = (editor: Editor): ToolbarAction[] => [
  { label: 'B', title: 'Bold', onClick: () => editor.chain().focus().toggleBold().run() },
  { label: 'I', title: 'Italic', onClick: () => editor.chain().focus().toggleItalic().run() },
  { label: 'U', title: 'Underline', onClick: () => editor.chain().focus().toggleUnderline().run() },
  { label: 'S', title: 'Strike', onClick: () => editor.chain().focus().toggleStrike().run() },
];

export const buildListActions = (editor: Editor): ToolbarAction[] => [
  { label: 'Bul', title: 'Bullet list', onClick: () => editor.chain().focus().toggleBulletList().run() },
  { label: 'Num', title: 'Numbered list', onClick: () => editor.chain().focus().toggleOrderedList().run() },
  { label: 'Task', title: 'Checklist', onClick: () => editor.chain().focus().toggleTaskList().run() },
  { label: 'Q', title: 'Quote', onClick: () => editor.chain().focus().toggleBlockquote().run() },
];

export const buildAlignActions = (editor: Editor): ToolbarAction[] => [
  { label: 'L', title: 'Align left', onClick: () => editor.chain().focus().setTextAlign('left').run() },
  { label: 'C', title: 'Align center', onClick: () => editor.chain().focus().setTextAlign('center').run() },
  { label: 'R', title: 'Align right', onClick: () => editor.chain().focus().setTextAlign('right').run() },
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
}: InsertActionsParams): ToolbarAction[] => [
  { label: 'Ln', title: 'Link', onClick: onSetLink },
  { label: 'Img', title: 'Insert image from URL', onClick: onInsertImageFromUrl },
  { label: 'Img+', title: 'Upload image', onClick: onUploadImage, disabled: isUploading },
  { label: 'Vid', title: 'Insert video from URL', onClick: onInsertVideoFromUrl },
  { label: 'Vid+', title: 'Upload video', onClick: onUploadVideo, disabled: isUploading },
  { label: 'PDF', title: 'Insert PDF link', onClick: onInsertPdfFromUrl },
  { label: 'PDF+', title: 'Upload PDF', onClick: onUploadPdf, disabled: isUploading },
  { label: '---', title: 'Horizontal rule', onClick: () => editor.chain().focus().setHorizontalRule().run() },
];

export type { ToolbarAction };
