'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import courseService from '@/services/courseService';
import {
  applyFontFamilyCommand,
  applyFontSizeCommand,
  insertImageFromUrlCommand,
  insertPdfFromUrlCommand,
  insertUploadedMediaCommand,
  insertVideoFromUrlCommand,
  setHeadingLevelCommand,
  setLinkCommand,
} from './richTextBlockEditor.commands';
import { buildRichTextBlockExtensions } from './richTextBlockEditor.extensions';
import { normalizeEditorContent } from './richTextBlockEditor.utils';
import useRichTextSelectedMedia from './hooks/useRichTextSelectedMedia';

type UseRichTextBlockEditorParams = {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  language: 'en' | 'fi';
};

export default function useRichTextBlockEditor({
  initialValue,
  onChange,
  placeholder,
  language,
}: UseRichTextBlockEditorParams) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMedia = useCallback(async (file: File) => {
    const uploaded = await courseService.uploadCourseMedia(file);
    return uploaded.url;
  }, []);

  const extensions = useMemo(
    () => buildRichTextBlockExtensions({ placeholder, uploadMedia }),
    [placeholder, uploadMedia],
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    content: normalizeEditorContent(initialValue),
    textDirection: language === 'fi' ? 'ltr' : 'auto',
    extensions,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? '' : currentEditor.getHTML());
    },
  });

  const { selectedMedia, handleMediaWidthChange, applyMediaAlign } =
    useRichTextSelectedMedia(editor);

  const applyFontFamily = useCallback(
    (value: string) => {
      if (!editor) {
        return;
      }

      applyFontFamilyCommand(editor, value);
    },
    [editor],
  );

  const applyFontSize = useCallback(
    (value: string) => {
      if (!editor) {
        return;
      }

      applyFontSizeCommand(editor, value);
    },
    [editor],
  );

  const setHeadingLevel = useCallback(
    (value: string) => {
      if (!editor) {
        return;
      }

      setHeadingLevelCommand(editor, value);
    },
    [editor],
  );

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    setLinkCommand(editor);
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertImageFromUrlCommand(editor);
  }, [editor]);

  const insertVideoFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertVideoFromUrlCommand(editor);
  }, [editor]);

  const insertPdfFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertPdfFromUrlCommand(editor);
  }, [editor]);

  const uploadAndInsert = useCallback(
    async (file: File | undefined, kind: 'image' | 'video' | 'pdf') => {
      if (!file || !editor) {
        return;
      }

      try {
        setIsUploading(true);
        const uploaded = await courseService.uploadCourseMedia(file);
        insertUploadedMediaCommand(editor, kind, uploaded.url, file.name);
      } catch {
        window.alert('Upload failed.');
      } finally {
        setIsUploading(false);
      }
    },
    [editor],
  );

  return {
    editor,
    imageInputRef,
    videoInputRef,
    pdfInputRef,
    isUploading,
    selectedMedia,
    applyFontFamily,
    applyFontSize,
    setHeadingLevel,
    setLink,
    insertImageFromUrl,
    insertVideoFromUrl,
    insertPdfFromUrl,
    uploadAndInsert,
    handleMediaWidthChange,
    applyMediaAlign,
  };
}


