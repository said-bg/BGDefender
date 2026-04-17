import { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  applyMediaAlignCommand,
  applyMediaWidthCommand,
} from '../richTextBlockEditor.commands';
import {
  clampMediaWidth,
  getSelectedMediaState,
  SelectedMediaState,
} from '../richTextBlockEditor.utils';

export default function useRichTextSelectedMedia(editor: Editor | null) {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaState | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const syncSelectedMedia = () => {
      setSelectedMedia(getSelectedMediaState(editor));
    };

    syncSelectedMedia();
    editor.on('selectionUpdate', syncSelectedMedia);

    return () => {
      editor.off('selectionUpdate', syncSelectedMedia);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleMediaClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const mediaElement =
        target.closest('[data-video]') ??
        target.closest('.iframe-wrapper') ??
        target.closest('[data-node-view-wrapper]') ??
        target.closest('.image') ??
        target.closest('img, video');

      if (!(mediaElement instanceof HTMLElement)) {
        return;
      }

      try {
        const position = editor.view.posAtDOM(mediaElement, 0);
        editor.chain().focus().setNodeSelection(position).run();
      } catch {
        // Ignore DOM lookup edge cases; selectionUpdate will still handle valid selections.
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleMediaClick, true);

    return () => {
      editorElement.removeEventListener('click', handleMediaClick, true);
    };
  }, [editor]);

  const handleMediaWidthChange = useCallback(
    (nextWidth: number) => {
      if (!editor || !selectedMedia) {
        return;
      }

      const width = clampMediaWidth(nextWidth);
      applyMediaWidthCommand(editor, selectedMedia, width);
      setSelectedMedia((previous) => (previous ? { ...previous, width } : previous));
    },
    [editor, selectedMedia],
  );

  const applyMediaAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      if (!editor || !selectedMedia) {
        return;
      }

      applyMediaAlignCommand(editor, selectedMedia, align);
      setSelectedMedia((previous) => (previous ? { ...previous, align } : previous));
    },
    [editor, selectedMedia],
  );

  return {
    selectedMedia,
    handleMediaWidthChange,
    applyMediaAlign,
  };
}
