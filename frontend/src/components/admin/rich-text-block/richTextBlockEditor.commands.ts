import type { Editor } from '@tiptap/react';
import { SelectedMediaState, toVideoAlign } from './richTextBlockEditor.utils';

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
    .insertContent(`<img src="${nextUrl.trim()}" style="width: 960px; float: left;" />`)
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
    .insertContent(`<video src="${nextUrl.trim()}" style="width: 960px; display: block; margin: 0 auto;" controls />`)
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
      .insertContent(`<img src="${uploadedUrl}" style="width: 960px; float: left;" />`)
      .run();
    return;
  }

  if (kind === 'video') {
    editor
      .chain()
      .focus()
      .insertContent(`<video src="${uploadedUrl}" style="width: 960px; display: block; margin: 0 auto;" controls />`)
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
  // Note: Direct media attribute updates are not supported with current TipTap setup
  // Media updates require re-inserting the content. Consider refactoring to support this.
  console.warn('Media width updates are not fully supported in this version');
};

export const applyMediaAlignCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  align: 'left' | 'center' | 'right',
) => {
  // Note: Direct media attribute updates are not supported with current TipTap setup
  // Media updates require re-inserting the content. Consider refactoring to support this.
  console.warn('Media alignment updates are not fully supported in this version');
};
