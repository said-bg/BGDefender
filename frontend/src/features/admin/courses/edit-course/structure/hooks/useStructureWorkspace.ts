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
        return t('edit.chapters.editTitle', { defaultValue: 'Edit chapter' });
      case 'create-chapter':
        return t('edit.chapters.createTitle', { defaultValue: 'Create chapter' });
      case 'edit-subchapter':
        return t('edit.subchapters.editTitle', { defaultValue: 'Edit subchapter' });
      default:
        return t('edit.subchapters.createTitle', { defaultValue: 'Create subchapter' });
    }
  }, [effectiveWorkspaceMode, t]);

  const workspaceDescription = useMemo(() => {
    switch (effectiveWorkspaceMode) {
      case 'edit-chapter':
        return t('edit.chapters.workspaceEditDescription', {
          defaultValue:
            'Update the selected chapter here. Pick another chapter or switch to subchapters from the left sidebar.',
        });
      case 'create-chapter':
        return t('edit.chapters.workspaceCreateDescription', {
          defaultValue:
            'Start by creating a chapter. Once a chapter exists, you can switch to subchapters from the left sidebar.',
        });
      case 'edit-subchapter':
        return t('edit.subchapters.workspaceEditDescription', {
          defaultValue:
            'Update the selected subchapter here. Use the left sidebar to open another one anytime.',
        });
      default:
        return t('edit.subchapters.workspaceCreateDescription', {
          defaultValue:
            'Create a new subchapter inside the chosen chapter, then keep adding the rest from the same workspace.',
        });
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

