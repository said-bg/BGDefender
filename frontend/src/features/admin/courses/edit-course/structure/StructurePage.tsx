'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
  useEditCourseId,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import { buildCoursePreviewHref } from '@/features/admin/courses/edit-course/shared/coursePreview.utils';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import featureStyles from './StructurePage.module.css';
import ChapterForm from './components/forms/ChapterForm';
import StructureLibrary from './components/library/StructureLibrary';
import SubChapterForm from './components/forms/SubChapterForm';
import { useEditCourseStructure } from './hooks/useEditCourseStructure';
import { useStructureWorkspace } from './hooks/useStructureWorkspace';

const styles = { ...formStyles, ...sharedStyles, ...sidebarStyles, ...featureStyles };

export default function StructurePage() {
  return (
    <EditCourseProtected>
      <StructurePageContent />
    </EditCourseProtected>
  );
}

function StructurePageContent() {
  const { t, i18n } = useTranslation('admin');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = useEditCourseId();
  const structure = useEditCourseStructure({
    courseId,
    language: i18n.language,
    t,
  });
  const hasChapters = structure.chapters.length > 0;
  const requestedMode = searchParams?.get('mode');
  const requestedChapterId = searchParams?.get('chapter');
  const requestedSubChapterId = searchParams?.get('subChapter');

  const workspace = useStructureWorkspace({
    editingChapterId: structure.editingChapterId,
    editingSubChapterId: structure.editingSubChapterId,
    hasChapters,
    onCreateChapter: structure.resetChapterForm,
    onCreateSubChapter: () => structure.resetSubChapterForm(),
    onEditChapter: structure.startEditingChapter,
    onEditSubChapter: (chapter, subChapterId) => {
      const subChapter = chapter.subChapters.find((current) => current.id === subChapterId);
      if (subChapter) {
        structure.startEditingSubChapter(chapter, subChapter);
      }
    },
    t,
  });

  useEffect(() => {
    if (!structure.course) {
      return;
    }

    if (requestedSubChapterId && structure.editingSubChapterId !== requestedSubChapterId) {
      const parentChapter = structure.chapters.find((chapter) =>
        chapter.subChapters.some((subChapter) => subChapter.id === requestedSubChapterId),
      );
      const requestedSubChapter = parentChapter?.subChapters.find(
        (subChapter) => subChapter.id === requestedSubChapterId,
      );

      if (parentChapter && requestedSubChapter) {
        workspace.openEditSubChapter(parentChapter, requestedSubChapter.id);
        return;
      }
    }

    if (
      requestedMode === 'chapter' &&
      requestedChapterId &&
      structure.editingChapterId !== requestedChapterId
    ) {
      const requestedChapter =
        structure.chapters.find((chapter) => chapter.id === requestedChapterId) ?? null;

      if (requestedChapter) {
        workspace.openEditChapter(requestedChapter);
      }
    }
  }, [
    requestedChapterId,
    requestedMode,
    requestedSubChapterId,
    structure.chapters,
    structure.course,
    structure.editingChapterId,
    structure.editingSubChapterId,
    workspace,
  ]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (
      requestedSubChapterId &&
      !structure.editingSubChapterId &&
      !structure.editingChapterId
    ) {
      return;
    }

    if (
      requestedMode === 'chapter' &&
      requestedChapterId &&
      !structure.editingChapterId
    ) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');

    if (structure.editingSubChapterId) {
      nextParams.set('mode', 'subchapter');
      nextParams.set('chapter', structure.subChapterForm.chapterId);
      nextParams.set('subChapter', structure.editingSubChapterId);
    } else if (structure.editingChapterId) {
      nextParams.set('mode', 'chapter');
      nextParams.set('chapter', structure.editingChapterId);
      nextParams.delete('subChapter');
    } else {
      nextParams.delete('mode');
      nextParams.delete('chapter');
      nextParams.delete('subChapter');
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams?.toString() ?? '';

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [
    pathname,
    router,
    searchParams,
    requestedChapterId,
    requestedMode,
    requestedSubChapterId,
    structure.editingChapterId,
    structure.editingSubChapterId,
    structure.subChapterForm.chapterId,
  ]);

  const returnTo = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');

    if (structure.editingSubChapterId) {
      nextParams.set('mode', 'subchapter');
      nextParams.set('chapter', structure.subChapterForm.chapterId);
      nextParams.set('subChapter', structure.editingSubChapterId);
    } else if (structure.editingChapterId) {
      nextParams.set('mode', 'chapter');
      nextParams.set('chapter', structure.editingChapterId);
      nextParams.delete('subChapter');
    } else {
      nextParams.delete('mode');
      nextParams.delete('chapter');
      nextParams.delete('subChapter');
    }

    const nextQuery = nextParams.toString();
    return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  }, [
    pathname,
    searchParams,
    structure.editingChapterId,
    structure.editingSubChapterId,
    structure.subChapterForm.chapterId,
  ]);
  const previewHref = useMemo(() => {
    if (!structure.courseId) {
      return undefined;
    }

    if (structure.editingSubChapterId && structure.subChapterForm.chapterId) {
      return buildCoursePreviewHref(structure.courseId, {
        focus: 'content',
        returnTo,
        sidebarMode: 'structure',
        target: {
          type: 'subchapter',
          chapterId: structure.subChapterForm.chapterId,
          subChapterId: structure.editingSubChapterId,
        },
      });
    }

    if (structure.editingChapterId) {
      return buildCoursePreviewHref(structure.courseId, {
        focus: 'content',
        returnTo,
        sidebarMode: 'structure',
        target: {
          type: 'chapter',
          chapterId: structure.editingChapterId,
        },
      });
    }

    return buildCoursePreviewHref(structure.courseId, {
      focus: 'content',
      returnTo,
      sidebarMode: 'structure',
      target: { type: 'overview' },
    });
  }, [
    returnTo,
    structure.courseId,
    structure.editingChapterId,
    structure.editingSubChapterId,
    structure.subChapterForm.chapterId,
  ]);

  if (structure.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (structure.loadError || !structure.courseId || !structure.course) {
    return (
      <EditCourseErrorState
        message={
          structure.loadError || t('edit.chapters.missingCourseId')
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={structure.courseId}
      section="structure"
      title={t('edit.tabs.structure')}
      subtitle={t('edit.chapters.description')}
      courseTitle={structure.localizedCourseTitle}
      previewHref={previewHref}
      actions={
        <>
        <button
          type="button"
          className={`${styles.pageToolbarButton} ${
            workspace.effectiveWorkspaceMode === 'create-subchapter'
              ? styles.pageToolbarButtonActive
              : styles.pageToolbarButtonSecondary
          }`}
          onClick={workspace.openCreateSubChapter}
          disabled={!hasChapters}
        >
          <span className={styles.pageToolbarPlus}>+</span>
          {t('edit.subchapters.createTitle')}
        </button>

        <button
          type="button"
          className={`${styles.pageToolbarButton} ${
            workspace.effectiveWorkspaceMode === 'create-chapter'
              ? styles.pageToolbarButtonActive
              : ''
          }`}
          onClick={workspace.openCreateChapter}
        >
          <span className={styles.pageToolbarPlus}>+</span>
          {t('edit.chapters.createTitle')}
        </button>
        </>
      }
    >

      <section className={styles.formCard}>
        <div className={styles.structureIntro}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>{t('edit.chapters.title')}</h2>
            <p className={styles.sectionDescription}>
              {t('edit.subchapters.description')}
            </p>
          </div>
        </div>

        <div className={styles.contentStudioLayout}>
          <aside className={styles.contentSidebar}>
            <div className={styles.chapterLibrary}>
              <div className={styles.chapterLibraryHeader}>
                <div className={styles.libraryHeaderRow}>
                  <h3 className={styles.chapterSectionTitle}>{t('edit.chapters.libraryTitle')}</h3>
                  <span className={styles.libraryCountBadge}>
                    {structure.chapters.length} {t('edit.chapters.title')}
                  </span>
                </div>
                <p className={styles.sectionDescription}>
                  {t('edit.subchapters.libraryDescription')}
                </p>
              </div>

              <StructureLibrary
                chapters={structure.chapters}
                deletingChapterId={structure.deletingChapterId}
                deletingSubChapterId={structure.deletingSubChapterId}
                activeChapterId={structure.editingChapterId}
                activeSubChapterId={structure.editingSubChapterId}
                language={i18n.language}
                onDeleteChapter={structure.handleDeleteChapter}
                onDeleteSubChapter={structure.handleDeleteSubChapter}
                onEditChapter={workspace.openEditChapter}
                onEditSubChapter={workspace.openEditSubChapter}
                onMoveChapter={structure.moveChapter}
                onMoveSubChapter={structure.moveSubChapter}
                t={t}
              />
            </div>
          </aside>

          <div className={styles.contentEditorColumn}>
            <div className={styles.chapterLibraryHeader}>
              <h3 className={styles.chapterSectionTitle}>{workspace.workspaceTitle}</h3>
              <p className={styles.sectionDescription}>{workspace.workspaceDescription}</p>
            </div>

            <div className={styles.chapterFormCard}>
              {workspace.effectiveWorkspaceMode === 'create-chapter' ||
              workspace.effectiveWorkspaceMode === 'edit-chapter' ? (
                <ChapterForm
                  chapterForm={structure.chapterForm}
                  chapterMessage={structure.chapterMessage}
                  chapterError={structure.chapterError}
                  editingChapterId={structure.editingChapterId}
                  isSubmittingChapter={structure.isSubmittingChapter}
                  onSubmit={structure.handleChapterSubmit}
                  onReset={workspace.openCreateChapter}
                  onChange={structure.setChapterForm}
                  t={t}
                />
              ) : (
                <SubChapterForm
                  chapters={structure.chapters}
                  availableParentChapter={structure.availableParentChapter}
                  editingSubChapterId={structure.editingSubChapterId}
                  isSubmittingSubChapter={structure.isSubmittingSubChapter}
                  onSubmit={structure.handleSubChapterSubmit}
                  onReset={workspace.openCreateSubChapter}
                  onChange={structure.setSubChapterForm}
                  subChapterError={structure.subChapterError}
                  subChapterForm={structure.subChapterForm}
                  subChapterMessage={structure.subChapterMessage}
                  language={i18n.language}
                  t={t}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
