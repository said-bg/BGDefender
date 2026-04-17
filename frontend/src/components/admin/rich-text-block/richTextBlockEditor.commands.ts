import type { Editor } from '@tiptap/react';
import {
  clearMediaWidthPreview,
  SelectedMediaState,
  toVideoAlign,
} from './richTextBlockEditor.utils';

export type RichTextCommandLabels = {
  imagePromptTitle: string;
  linkPromptTitle: string;
  pdfLinkLabel: string;
  pdfPromptTitle: string;
  uploadFailed: string;
  videoPromptTitle: string;
};

export const applyFontFamilyCommand = (editor: Editor, value: string) => {
  if (value === 'Default') {
    editor.chain().focus().unsetFontFamily().run();
    return;
  }

  editor.chain().focus().setFontFamily(value).run();
};

export const applyFontSizeCommand = (editor: Editor, value: string) => {
  if (value === 'Default') {
    editor.chain().focus().unsetFontSize().run();
    return;
  }

  editor.chain().focus().setFontSize(value).run();
};

export const setHeadingLevelCommand = (editor: Editor, value: string) => {
  if (value === 'paragraph') {
    editor.chain().focus().setParagraph().run();
    return;
  }

  editor
    .chain()
    .focus()
    .toggleHeading({ level: Number(value) as 1 | 2 | 3 })
    .run();
};

export const setLinkCommand = (editor: Editor, labels: RichTextCommandLabels) => {
  const previousUrl = editor.getAttributes('link').href ?? '';
  const nextUrl = window.prompt(labels.linkPromptTitle, previousUrl);

  if (nextUrl === null) {
    return;
  }

  if (!nextUrl.trim()) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor.chain().focus().setLink({ href: nextUrl.trim() }).run();
};

export const insertImageFromUrlCommand = (editor: Editor, labels: RichTextCommandLabels) => {
  const nextUrl = window.prompt(labels.imagePromptTitle);

  if (!nextUrl?.trim()) {
    return;
  }

  editor
    .chain()
    .focus()
    .setImageInline({
      src: nextUrl.trim(),
      width: 960,
      align: 'left',
      inline: false,
    })
    .run();
};

export const insertVideoFromUrlCommand = (editor: Editor, labels: RichTextCommandLabels) => {
  const nextUrl = window.prompt(labels.videoPromptTitle);

  if (!nextUrl?.trim()) {
    return;
  }

  editor
    .chain()
    .focus()
    .setVideo({
      src: nextUrl.trim(),
      width: '100%',
      align: 'center',
    })
    .run();
};

export const insertPdfFromUrlCommand = (editor: Editor, labels: RichTextCommandLabels) => {
  const nextUrl = window.prompt(labels.pdfPromptTitle);

  if (!nextUrl?.trim()) {
    return;
  }

  editor
    .chain()
    .focus()
    .insertContent(
      `<p><a href="${nextUrl.trim()}" target="_blank" rel="noreferrer">${labels.pdfLinkLabel}</a></p>`,
    )
    .run();
};

export const insertUploadedMediaCommand = (
  editor: Editor,
  kind: 'image' | 'video' | 'pdf',
  uploadedUrl: string,
  fileName: string,
) => {
  if (kind === 'image') {
    editor
      .chain()
      .focus()
      .setImageInline({
        src: uploadedUrl,
        width: 960,
        align: 'left',
        inline: false,
      })
      .run();
    return;
  }

  if (kind === 'video') {
    editor
      .chain()
      .focus()
      .setVideo({
        src: uploadedUrl,
        width: '100%',
        align: 'center',
      })
      .run();
    return;
  }

  editor
    .chain()
    .focus()
    .insertContent(
      `<p><a href="${uploadedUrl}" target="_blank" rel="noreferrer">${fileName}</a></p>`,
    )
    .run();
};

export const applyMediaWidthCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  width: number,
) => {
  clearMediaWidthPreview(editor, selectedMedia);

  if (selectedMedia.type === 'video') {
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedMedia.pos)
      .updateAttributes('video', { width: `${width}px` })
      .run();
    return;
  }

  editor
    .chain()
    .focus()
    .setNodeSelection(selectedMedia.pos)
    .updateImage({ width, inline: false })
    .run();
};

export const applyMediaAlignCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  align: 'left' | 'center' | 'right',
) => {
  clearMediaWidthPreview(editor, selectedMedia);

  if (selectedMedia.type === 'video') {
    editor
      .chain()
      .focus()
      .setNodeSelection(selectedMedia.pos)
      .updateAttributes('video', { align: toVideoAlign(align) })
      .run();
    return;
  }

  editor
    .chain()
    .focus()
    .setNodeSelection(selectedMedia.pos)
    .updateImage({
      align,
      width: selectedMedia.width,
      inline: false,
    })
    .run();
};

export const removeSelectedMediaCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
) => {
  editor
    .chain()
    .focus()
    .setNodeSelection(selectedMedia.pos)
    .deleteSelection()
    .run();
};
