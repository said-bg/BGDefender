import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

export type MediaAlign = 'left' | 'center' | 'right';

export type SelectedMediaState = {
  type: 'image' | 'video';
  pos: number;
  width: number;
  align: MediaAlign;
};

const MEDIA_MIN_WIDTH = 160;
const MEDIA_MAX_WIDTH_FALLBACK = 1400;

export const isSameSelectedMediaState = (
  previous: SelectedMediaState | null,
  next: SelectedMediaState | null,
) => {
  if (previous === next) {
    return true;
  }

  if (!previous || !next) {
    return false;
  }

  return (
    previous.type === next.type &&
    previous.pos === next.pos &&
    previous.width === next.width &&
    previous.align === next.align
  );
};

export const normalizeEditorContent = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : '<p></p>';
};

export const clampMediaWidth = (width: number, maxWidth = MEDIA_MAX_WIDTH_FALLBACK) =>
  Math.max(MEDIA_MIN_WIDTH, Math.min(width, Math.max(MEDIA_MIN_WIDTH, maxWidth)));

export const resolveEditorMediaMaxWidth = (editor: Editor | null) => {
  if (!editor?.view?.dom) {
    return MEDIA_MAX_WIDTH_FALLBACK;
  }

  const editorWidth = Math.round(editor.view.dom.getBoundingClientRect().width);

  if (!Number.isFinite(editorWidth) || editorWidth <= 0) {
    return MEDIA_MAX_WIDTH_FALLBACK;
  }

  return clampMediaWidth(editorWidth);
};

const parsePixelWidth = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveMediaWidth = (editor: Editor, selection: NodeSelection) => {
  const rawWidth = selection.node.attrs.width;

  if (typeof rawWidth === 'number' && Number.isFinite(rawWidth)) {
    return clampMediaWidth(rawWidth);
  }

  if (typeof rawWidth === 'string') {
    const trimmed = rawWidth.trim();
    const parsed = parsePixelWidth(trimmed);

    if (parsed !== null) {
      return clampMediaWidth(parsed);
    }
  }

  const nodeDom = editor.view.nodeDOM(selection.from);

  if (nodeDom instanceof HTMLElement) {
    const mediaElement = nodeDom.matches('img,video,iframe')
      ? nodeDom
      : nodeDom.querySelector('img, video, iframe');

    if (mediaElement instanceof HTMLElement) {
      return clampMediaWidth(Math.round(mediaElement.getBoundingClientRect().width));
    }
  }

  return 960;
};

const normalizeMediaAlign = (align: unknown): MediaAlign => {
  if (align === 'left' || align === 'flex-start') {
    return 'left';
  }

  if (align === 'right' || align === 'flex-end') {
    return 'right';
  }

  return 'center';
};

export const getSelectedMediaState = (editor: Editor | null): SelectedMediaState | null => {
  if (!editor) {
    return null;
  }

  const { selection } = editor.state;

  if (!(selection instanceof NodeSelection)) {
    return null;
  }

  const nodeName = selection.node.type.name.toLowerCase();

  if (!nodeName.includes('image') && !nodeName.includes('video')) {
    return null;
  }

  return {
    type: nodeName.includes('image') ? 'image' : 'video',
    pos: selection.from,
    width: resolveMediaWidth(editor, selection),
    align: normalizeMediaAlign(selection.node.attrs.align),
  };
};

export const toVideoAlign = (align: MediaAlign) =>
  align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

export const applyMediaWidthPreview = (
  editor: Editor,
  media: SelectedMediaState,
  width: number,
) => {
  const nodeDom = editor.view.nodeDOM(media.pos);

  if (!(nodeDom instanceof HTMLElement)) {
    return;
  }

  if (media.type === 'image') {
    const imageBody = nodeDom.matches('.image-view__body')
      ? nodeDom
      : nodeDom.querySelector<HTMLElement>('.image-view__body');
    const imageElement = nodeDom.matches('img')
      ? nodeDom
      : nodeDom.querySelector<HTMLElement>('img');
    const widthValue = `${width}px`;

    if (imageBody) {
      imageBody.style.maxWidth = '100%';
    }

    if (imageElement) {
      imageElement.style.width = widthValue;
      imageElement.style.maxWidth = '100%';
      imageElement.style.height = 'auto';
    }

    return;
  }

  const videoFrame = nodeDom.matches('div[data-video] > div > div')
    ? nodeDom
    : nodeDom.querySelector<HTMLElement>('div[data-video] > div > div');

  if (videoFrame) {
    videoFrame.style.width = `${width}px`;
    videoFrame.style.maxWidth = '100%';
  }
};

export const clearMediaWidthPreview = (editor: Editor, media: SelectedMediaState) => {
  if (!editor.view?.nodeDOM) {
    return;
  }

  const nodeDom = editor.view.nodeDOM(media.pos);

  if (!(nodeDom instanceof HTMLElement)) {
    return;
  }

  if (media.type === 'image') {
    const imageView = nodeDom.matches('.image-view')
      ? nodeDom
      : nodeDom.querySelector<HTMLElement>('.image-view');
    const imageBody = nodeDom.matches('.image-view__body')
      ? nodeDom
      : nodeDom.querySelector<HTMLElement>('.image-view__body');
    const imageElement = nodeDom.matches('img')
      ? nodeDom
      : nodeDom.querySelector<HTMLElement>('img');

    imageView?.style.removeProperty('width');
    imageView?.style.removeProperty('max-width');
    imageBody?.style.removeProperty('width');
    imageBody?.style.removeProperty('max-width');
    return;
  }

  const videoFrame = nodeDom.matches('div[data-video] > div > div')
    ? nodeDom
    : nodeDom.querySelector<HTMLElement>('div[data-video] > div > div');

  videoFrame?.style.removeProperty('width');
  videoFrame?.style.removeProperty('max-width');
};
