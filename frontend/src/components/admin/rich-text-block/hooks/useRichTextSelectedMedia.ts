import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  applyMediaAlignCommand,
  applyMediaWidthCommand,
  removeSelectedMediaCommand,
} from '../richTextBlockEditor.commands';
import {
  applyMediaWidthPreview,
  clampMediaWidth,
  getSelectedMediaState,
  isSameSelectedMediaState,
  resolveEditorMediaMaxWidth,
  SelectedMediaState,
} from '../richTextBlockEditor.utils';

export default function useRichTextSelectedMedia(editor: Editor | null) {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaState | null>(null);
  const [isInteractingWithControls, setIsInteractingWithControls] = useState(false);
  const [pendingWidth, setPendingWidth] = useState<number | null>(null);
  const [maxMediaWidth, setMaxMediaWidth] = useState(1400);
  const [interactionSource, setInteractionSource] = useState<'controls' | 'native' | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const syncSelectedMedia = () => {
      const nextSelectedMedia = getSelectedMediaState(editor);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        setSelectedMedia((previous) => {
          const resolvedMedia = nextSelectedMedia ?? previous;
          return isSameSelectedMediaState(previous, resolvedMedia) ? previous : resolvedMedia;
        });
      });
    };

    syncSelectedMedia();
    editor.on('selectionUpdate', syncSelectedMedia);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      editor.off('selectionUpdate', syncSelectedMedia);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor?.view?.dom) {
      return;
    }

    const syncMaxMediaWidth = () => {
      setMaxMediaWidth(resolveEditorMediaMaxWidth(editor));
    };

    syncMaxMediaWidth();

    const observer = new ResizeObserver(() => {
      syncMaxMediaWidth();
    });

    observer.observe(editor.view.dom);

    return () => {
      observer.disconnect();
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || !selectedMedia || pendingWidth === null) {
      return;
    }

    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      applyMediaWidthPreview(editor, selectedMedia, pendingWidth);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [editor, pendingWidth, selectedMedia]);

  useEffect(() => {
    if (!editor || !isInteractingWithControls || interactionSource !== 'native') {
      return;
    }

      const stopInteraction = () => {
      const nextSelectedMedia = getSelectedMediaState(editor);

      setIsInteractingWithControls(false);
      setInteractionSource(null);

      window.requestAnimationFrame(() => {
        setSelectedMedia((previous) => {
          const resolvedMedia = nextSelectedMedia ?? previous;
          return isSameSelectedMediaState(previous, resolvedMedia) ? previous : resolvedMedia;
        });
      });
    };

    window.addEventListener('mouseup', stopInteraction, true);
    window.addEventListener('touchend', stopInteraction, true);

    return () => {
      window.removeEventListener('mouseup', stopInteraction, true);
      window.removeEventListener('touchend', stopInteraction, true);
    };
  }, [editor, interactionSource, isInteractingWithControls]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const selectMediaFromTarget = (target: HTMLElement) => {
      const mediaElement =
        target.closest('[data-video]') ??
        target.closest('.iframe-wrapper') ??
        target.closest('[data-node-view-wrapper]') ??
        target.closest('.image') ??
        target.closest('img, video');

      if (!(mediaElement instanceof HTMLElement)) {
        return false;
      }

      try {
        const position = editor.view.posAtDOM(mediaElement, 0);
        editor.chain().focus().setNodeSelection(position).run();
        return true;
      } catch {
        return false;
      }
    };

    const handleMediaPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const videoTarget =
        target.closest('div[data-video] video') ??
        target.closest('div[data-video] iframe') ??
        target.closest('div[data-video]');

      if (!(videoTarget instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      selectMediaFromTarget(videoTarget);
    };

    const handleMediaClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      selectMediaFromTarget(target);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousedown', handleMediaPointerDown, true);
    editorElement.addEventListener('touchstart', handleMediaPointerDown, true);
    editorElement.addEventListener('click', handleMediaClick, true);

    return () => {
      editorElement.removeEventListener('mousedown', handleMediaPointerDown, true);
      editorElement.removeEventListener('touchstart', handleMediaPointerDown, true);
      editorElement.removeEventListener('click', handleMediaClick, true);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (
        target.closest('.image-resizer__handler') ||
        target.closest('.video-resizer__handler')
      ) {
        setIsInteractingWithControls(true);
        setInteractionSource('native');
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousedown', handlePointerDown, true);
    editorElement.addEventListener('touchstart', handlePointerDown, true);

    return () => {
      editorElement.removeEventListener('mousedown', handlePointerDown, true);
      editorElement.removeEventListener('touchstart', handlePointerDown, true);
    };
  }, [editor]);

  const handleMediaWidthChange = useCallback(
    (nextWidth: number) => {
      if (!editor || !selectedMedia) {
        return;
      }

      const width = clampMediaWidth(nextWidth, maxMediaWidth);
      setSelectedMedia((previous) => (previous ? { ...previous, width } : previous));
      setPendingWidth(width);

      if (!isInteractingWithControls) {
        applyMediaWidthCommand(editor, selectedMedia, width);
        setPendingWidth(null);
      }
    },
    [editor, isInteractingWithControls, maxMediaWidth, selectedMedia],
  );

  const applyMediaAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      if (!editor || !selectedMedia) {
        return;
      }

      applyMediaAlignCommand(editor, selectedMedia, align);

      window.requestAnimationFrame(() => {
        const nextSelectedMedia = getSelectedMediaState(editor);

        setSelectedMedia((previous) => {
          const resolvedMedia =
            nextSelectedMedia ??
            (previous ? { ...previous, align } : previous);

          return isSameSelectedMediaState(previous, resolvedMedia) ? previous : resolvedMedia;
        });
      });
    },
    [editor, selectedMedia],
  );

  const beginMediaInteraction = useCallback(() => {
    setIsInteractingWithControls(true);
    setInteractionSource('controls');
  }, []);

  const removeSelectedMedia = useCallback(() => {
    if (!editor || !selectedMedia) {
      return;
    }

    removeSelectedMediaCommand(editor, selectedMedia);
    setPendingWidth(null);
    setIsInteractingWithControls(false);
    setInteractionSource(null);
    setSelectedMedia(null);
  }, [editor, selectedMedia]);

  const endMediaInteraction = useCallback(() => {
    if (editor && selectedMedia && pendingWidth !== null) {
      applyMediaWidthCommand(editor, selectedMedia, pendingWidth);

      window.requestAnimationFrame(() => {
        const nextSelectedMedia = getSelectedMediaState(editor);

        setSelectedMedia((previous) => {
          const resolvedMedia =
            nextSelectedMedia ??
            (previous ? { ...previous, width: pendingWidth } : previous);

          return isSameSelectedMediaState(previous, resolvedMedia) ? previous : resolvedMedia;
        });
        setPendingWidth(null);
      });
    } else {
      setPendingWidth(null);
    }

    setIsInteractingWithControls(false);
    setInteractionSource(null);
  }, [editor, pendingWidth, selectedMedia]);

  return {
    selectedMedia,
    handleMediaWidthChange,
    applyMediaAlign,
    beginMediaInteraction,
    endMediaInteraction,
    removeSelectedMedia,
    maxMediaWidth,
  };
}
