'use client';

import { useMemo, useState } from 'react';
import { Chapter } from '@/services/course';
import { TranslationFn } from '../types';

export type StructureWorkspaceMode =
  | 'create-chapter'
  | 'edit-chapter'
  | 'create-subchapter'
  | 'edit-subchapter';

type UseStructureWorkspaceParams = {
  editingChapterId: string | null;
  editingSubChapterId: string | null;
  hasChapters: boolean;
  onCreateChapter: () => void;
  onCreateSubChapter: () => void;
  onEditChapter: (chapter: Chapter) => void;
  onEditSubChapter: (chapter: Chapter, subChapterId: string) => void;
  t: TranslationFn;
};

export function useStructureWorkspace({
  editingChapterId,
  editingSubChapterId,
  hasChapters,
  onCreateChapter,
  onCreateSubChapter,
  onEditChapter,
  onEditSubChapter,
  t,
}: UseStructureWorkspaceParams) {
  const [workspaceMode, setWorkspaceMode] = useState<StructureWorkspaceMode>('create-chapter');

  const effectiveWorkspaceMode: StructureWorkspaceMode =
    !hasChapters
      ? 'create-chapter'
      : workspaceMode === 'edit-chapter' && !editingChapterId
        ? 'create-chapter'
        : workspaceMode === 'edit-subchapter' && !editingSubChapterId
          ? 'create-subchapter'
          : workspaceMode;

  const workspaceTitle = useMemo(() => {
    switch (effectiveWorkspaceMode) {
      case 'edit-chapter':
        return t('edit.chapters.editTitle');
      case 'create-chapter':
        return t('edit.chapters.createTitle');
      case 'edit-subchapter':
        return t('edit.subchapters.editTitle');
      default:
        return t('edit.subchapters.createTitle');
    }
  }, [effectiveWorkspaceMode, t]);

  const workspaceDescription = useMemo(() => {
    switch (effectiveWorkspaceMode) {
      case 'edit-chapter':
        return t('edit.chapters.workspaceEditDescription');
      case 'create-chapter':
        return t('edit.chapters.workspaceCreateDescription');
      case 'edit-subchapter':
        return t('edit.subchapters.workspaceEditDescription');
      default:
        return t('edit.subchapters.workspaceCreateDescription');
    }
  }, [effectiveWorkspaceMode, t]);

  const openCreateChapter = () => {
    onCreateChapter();
    setWorkspaceMode('create-chapter');
  };

  const openCreateSubChapter = () => {
    onCreateSubChapter();
    setWorkspaceMode('create-subchapter');
  };

  const openEditChapter = (chapter: Chapter) => {
    onEditChapter(chapter);
    setWorkspaceMode('edit-chapter');
  };

  const openEditSubChapter = (chapter: Chapter, subChapterId: string) => {
    onEditSubChapter(chapter, subChapterId);
    setWorkspaceMode('edit-subchapter');
  };

  return {
    effectiveWorkspaceMode,
    openCreateChapter,
    openCreateSubChapter,
    openEditChapter,
    openEditSubChapter,
    workspaceDescription,
    workspaceTitle,
  };
}

