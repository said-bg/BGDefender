'use client';

import { useTranslation } from 'react-i18next';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
  useEditCourseId,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
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
  const courseId = useEditCourseId();
  const structure = useEditCourseStructure({
    courseId,
    language: i18n.language,
    t,
  });
  const hasChapters = structure.chapters.length > 0;

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

  if (structure.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (structure.loadError || !structure.courseId || !structure.course) {
    return (
      <EditCourseErrorState
        message={
          structure.loadError ||
          t('edit.chapters.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={structure.courseId}
      section="structure"
      title={t('edit.tabs.structure', { defaultValue: 'Structure' })}
      subtitle={t('edit.chapters.description', {
        defaultValue:
          'Build the course structure here first. We will add subchapters and lesson content right after this step.',
      })}
      courseTitle={structure.localizedCourseTitle}
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.chapters.title', { defaultValue: 'Chapters' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.subchapters.description', {
              defaultValue:
                'Create the lesson shells inside each chapter before we move into the real lesson content editor.',
            })}
          </p>
        </div>

        <div className={styles.contentStudioLayout}>
          <aside className={styles.contentSidebar}>
            <div className={styles.chapterLibrary}>
              <div className={styles.chapterLibraryHeader}>
                <h3 className={styles.chapterSectionTitle}>
                  {t('edit.chapters.libraryTitle', { defaultValue: 'Current structure' })}
                </h3>
                <p className={styles.sectionDescription}>
                  {t('edit.subchapters.libraryDescription', {
                    defaultValue:
                      'Browse subchapters grouped by chapter, then edit or delete the one you want to update.',
                  })}
                </p>
              </div>

              <div className={styles.sidebarQuickActions}>
                <button
                  type="button"
                  className={`${styles.sidebarQuickAction} ${
                    workspace.effectiveWorkspaceMode === 'create-chapter'
                      ? styles.sidebarQuickActionActive
                      : ''
                  }`}
                  onClick={workspace.openCreateChapter}
                >
                  {t('edit.chapters.createTitle', { defaultValue: 'Create chapter' })}
                </button>

                <button
                  type="button"
                  className={`${styles.sidebarQuickAction} ${
                    workspace.effectiveWorkspaceMode === 'create-subchapter'
                      ? styles.sidebarQuickActionActive
                      : ''
                  }`}
                  onClick={workspace.openCreateSubChapter}
                  disabled={!hasChapters}
                >
                  {t('edit.subchapters.createTitle', {
                    defaultValue: 'Create subchapter',
                  })}
                </button>
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

