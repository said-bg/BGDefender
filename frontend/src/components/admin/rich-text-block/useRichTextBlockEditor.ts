'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import courseService from '@/services/course';
import {
  applyFontFamilyCommand,
  applyFontSizeCommand,
  insertImageFromUrlCommand,
  insertPdfFromUrlCommand,
  insertUploadedMediaCommand,
  RichTextCommandLabels,
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
  const { t } = useTranslation('admin');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const commandLabels = useMemo<RichTextCommandLabels>(
    () => ({
      imagePromptTitle: t('richText.imagePromptTitle', { defaultValue: 'Image URL' }),
      linkPromptTitle: t('richText.linkPromptTitle', { defaultValue: 'URL' }),
      pdfLinkLabel: t('richText.pdfLinkLabel', { defaultValue: 'Open PDF' }),
      pdfPromptTitle: t('richText.pdfPromptTitle', { defaultValue: 'PDF URL' }),
      uploadFailed: t('richText.uploadFailed', { defaultValue: 'Upload failed.' }),
      videoPromptTitle: t('richText.videoPromptTitle', { defaultValue: 'Video URL' }),
    }),
    [t],
  );

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
    onTransaction: ({ editor: currentEditor, transaction }) => {
      if (!transaction.docChanged) {
        return;
      }

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

    setLinkCommand(editor, commandLabels);
  }, [commandLabels, editor]);

  const insertImageFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertImageFromUrlCommand(editor, commandLabels);
  }, [commandLabels, editor]);

  const insertVideoFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertVideoFromUrlCommand(editor, commandLabels);
  }, [commandLabels, editor]);

  const insertPdfFromUrl = useCallback(() => {
    if (!editor) {
      return;
    }

    insertPdfFromUrlCommand(editor, commandLabels);
  }, [commandLabels, editor]);

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
        window.alert(commandLabels.uploadFailed);
      } finally {
        setIsUploading(false);
      }
    },
    [commandLabels.uploadFailed, editor],
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



