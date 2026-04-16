import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
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
      .insertContent(`<img src="${uploadedUrl}" style="width: 960px; float: left;" />`)
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

const getSelectedMediaNodeName = (editor: Editor) => {
  const { selection } = editor.state;

  if (!(selection instanceof NodeSelection)) {
    return null;
  }

  const nodeName = selection.node.type.name.toLowerCase();
  return nodeName.includes('image') || nodeName.includes('video') ? selection.node.type.name : null;
};

export const applyMediaWidthCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  width: number,
) => {
  const nodeName = getSelectedMediaNodeName(editor);

  if (!nodeName) {
    return;
  }

  const nextWidth =
    selectedMedia.type === 'video' ? `${width}px` : width;

  editor.chain().focus().updateAttributes(nodeName, { width: nextWidth }).run();
};

export const applyMediaAlignCommand = (
  editor: Editor,
  selectedMedia: SelectedMediaState,
  align: 'left' | 'center' | 'right',
) => {
  const nodeName = getSelectedMediaNodeName(editor);

  if (!nodeName) {
    return;
  }

  const nextAlign =
    selectedMedia.type === 'video' ? toVideoAlign(align) : align;

  editor.chain().focus().updateAttributes(nodeName, { align: nextAlign }).run();
};
