'use client';

import { useTranslation } from 'react-i18next';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import featureStyles from './ContentPage.module.css';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
  useEditCourseId,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import ContentEditorPanel from './components/editor/ContentEditorPanel';
import ContentSidebar from './components/sidebar/ContentSidebar';
import ContentWorkbench from './components/workbench/ContentWorkbench';
import { useContentStudio } from './hooks/useContentStudio';

const styles = { ...formStyles, ...sharedStyles, ...sidebarStyles, ...featureStyles };

export default function ContentPage() {
  return (
    <EditCourseProtected>
      <EditCourseContentInner />
    </EditCourseProtected>
  );
}

function EditCourseContentInner() {
  const { t, i18n } = useTranslation('admin');
  const courseId = useEditCourseId();
  const studio = useContentStudio({
    courseId,
    language: i18n.language,
    t,
  });

  if (studio.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (studio.loadError || !courseId || !studio.course) {
    return (
      <EditCourseErrorState
        message={
          studio.loadError || t('edit.contentBlocks.missingCourseId')
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={courseId}
      section="content"
      title={t('edit.tabs.content')}
      subtitle={t('edit.contentBlocks.workspaceSubtitle')}
      courseTitle={studio.localizedCourseTitle}
      wide
    >
      <section className={styles.formCard}>
        <div
          className={`${styles.contentStudioLayout} ${
            !studio.isSidebarOpen ? styles.contentStudioLayoutSidebarClosed : ''
          }`}
        >
          <ContentSidebar
            activeSubChapterId={studio.activeSubChapter?.id ?? null}
            chapters={studio.chapters}
            className={!studio.isSidebarOpen ? styles.contentSidebarHidden : ''}
            language={i18n.language}
            onSelect={studio.selectSubChapter}
            onToggleVisibility={() => studio.setIsSidebarOpen((previous) => !previous)}
            t={t}
          />

          <div className={styles.contentEditorColumn}>
            {!studio.isSidebarOpen ? (
              <div className={styles.editorTopActions}>
                <button
                  type="button"
                  className={styles.inlineAction}
                  onClick={() => studio.setIsSidebarOpen(true)}
                >
                  {t('edit.contentBlocks.showStructure')}
                </button>
              </div>
            ) : null}

            <ContentWorkbench
              contentBlocks={studio.contentBlocks}
              deletingContentId={studio.deletingContentId}
              editingContentId={studio.editingContentId}
              language={i18n.language}
              onCreate={studio.startNewBlock}
              onDelete={studio.deleteContent}
              onEdit={studio.startEditingContent}
              selectedChapter={studio.activeChapter}
              selectedSubChapter={studio.activeSubChapter}
              t={t}
            />

            <ContentEditorPanel
              activeEditorLocale={studio.activeEditorLocale}
              contentError={studio.contentError}
              contentMessage={studio.contentMessage}
              initialForm={studio.contentForm}
              isSubmittingContent={studio.isSubmittingContent}
              key={`${studio.editingContentId ?? 'new'}:${studio.contentForm.chapterId}:${studio.contentForm.subChapterId}:${studio.contentForm.orderIndex}`}
              language={i18n.language}
              onEditorLocaleChange={studio.setActiveEditorLocale}
              onReset={() =>
                studio.resetContentForm(studio.activeChapter, studio.activeSubChapter)
              }
              onSubmitDraft={studio.submitContent}
              selectedChapter={studio.activeChapter}
              selectedSubChapter={studio.activeSubChapter}
              t={t}
            />
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
