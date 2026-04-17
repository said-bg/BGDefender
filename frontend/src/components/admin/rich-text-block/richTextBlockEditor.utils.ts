import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';

export type MediaAlign = 'left' | 'center' | 'right';

export type SelectedMediaState = {
  type: 'image' | 'video';
  width: number;
  align: MediaAlign;
};

export const normalizeEditorContent = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : '<p></p>';
};

export const clampMediaWidth = (width: number) => Math.max(160, Math.min(width, 1400));

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
    width: resolveMediaWidth(editor, selection),
    align: normalizeMediaAlign(selection.node.attrs.align),
  };
};

export const toVideoAlign = (align: MediaAlign) =>
  align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
