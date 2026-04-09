import type { Editor } from '@tiptap/react';
import { SelectedMediaState, toVideoAlign } from './richTextBlockEditor.utils';

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

export const setLinkCommand = (editor: Editor) => {
  const previousUrl = editor.getAttributes('link').href ?? '';
  const nextUrl = window.prompt('URL', previousUrl);

  if (nextUrl === null) {
    return;
  }

  if (!nextUrl.trim()) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor.chain().focus().setLink({ href: nextUrl.trim() }).run();
};

export const insertImageFromUrlCommand = (editor: Editor) => {
  const nextUrl = window.prompt('Image URL');

  if (!nextUrl?.trim()) {
    return;
  }

  editor
    .chain()
    .focus()
    .setImage({ src: nextUrl.trim(), width: 960, align: 'left' })
    .run();
};

export const insertVideoFromUrlCommand = (editor: Editor) => {
  const nextUrl = window.prompt('Video URL');

  if (!nextUrl?.trim()) {
    return;
  }

  editor.chain().focus().setVideo({ src: nextUrl.trim(), width: 960, align: 'center' }).run();
};

export const insertPdfFromUrlCommand = (editor: Editor) => {
  const nextUrl = window.prompt('PDF URL');

  if (!nextUrl?.trim()) {
    return;
  }

  editor
    .chain()
    .focus()
    .insertContent(
      `<p><a href="${nextUrl.trim()}" target="_blank" rel="noreferrer">Open PDF</a></p>`,
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
      .setImage({ src: uploadedUrl, width: 960, align: 'left' })
      .run();
    return;
  }

  if (kind === 'video') {
    editor.chain().focus().setVideo({ src: uploadedUrl, width: 960, align: 'center' }).run();
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
  if (selectedMedia.type === 'image') {
    editor.chain().focus().updateImage({ width, align: selectedMedia.align }).run();
    return;
  }

  editor
    .chain()
    .focus()
    .updateVideo({
      width,
      align: toVideoAlign(selectedMedia.align),
    })
    .run();
};

export const applyMediaAlignCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  align: 'left' | 'center' | 'right',
) => {
  if (selectedMedia.type === 'image') {
    editor.chain().focus().updateImage({ width: selectedMedia.width, align }).run();
    return;
  }

  editor
    .chain()
    .focus()
    .updateVideo({
      width: selectedMedia.width,
      align: toVideoAlign(align),
    })
    .run();
};
