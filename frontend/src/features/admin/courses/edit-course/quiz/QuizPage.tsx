'use client';

import { useTranslation } from 'react-i18next';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import sidebarStyles from '@/features/admin/courses/edit-course/shared/EditCourseSidebar.module.css';
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import QuizChapterSidebar from './components/QuizChapterSidebar';
import QuizAnalyticsPanel from './components/QuizAnalyticsPanel';
import QuizAnalyticsSummaryBar from './components/QuizAnalyticsSummaryBar';
import QuizEditorForm from './components/QuizEditorForm';
import useQuizPage from './hooks/useQuizPage';
import featureStyles from './QuizPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...sidebarStyles,
  ...shellStyles,
  ...featureStyles,
};

export default function QuizPage() {
  return (
    <EditCourseProtected>
      <QuizPageContent />
    </EditCourseProtected>
  );
}

function QuizPageContent() {
  const { t, i18n } = useTranslation('admin');
  const quizPage = useQuizPage(i18n.language, t);
  const analyticsSectionId = 'chapter-quiz-analytics';

  const scrollToAnalytics = () => {
    document.getElementById(analyticsSectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (quizPage.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (quizPage.loadError || !quizPage.courseId || !quizPage.course) {
    return (
      <EditCourseErrorState
        message={
          quizPage.loadError ||
          t('edit.chapters.missingCourseId')
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={quizPage.courseId}
      section="quiz"
      title={t('edit.tabs.quiz')}
      subtitle={t('edit.quiz.subtitle')}
      courseTitle={quizPage.localizedCourseTitle}
      previewHref={quizPage.previewHref ?? undefined}
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.quiz.title')}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.quiz.description')}
          </p>
        </div>

        <div className={styles.quizWorkspaceLayout}>
          <QuizChapterSidebar
            chapters={quizPage.chapters}
            i18nLanguage={i18n.language}
            loadedQuiz={quizPage.loadedQuiz}
            selectedChapterId={quizPage.selectedChapterId}
            styles={styles}
            t={t}
            onSelectChapter={(chapterId) => {
              quizPage.setSelectedChapterId(chapterId);
              quizPage.setQuizMessage(null);
              quizPage.setQuizError(null);
            }}
          />

          <div className={styles.quizEditorColumn}>
            {quizPage.selectedChapter ? (
              <>
                <div className={styles.cardHeader}>
                  <h3 className={styles.chapterSectionTitle}>
                    {t('edit.quiz.editorTitle')}
                  </h3>
                  <p className={styles.sectionDescription}>
                    {t('edit.quiz.editorDescription')}
                  </p>
                </div>

                <QuizAnalyticsSummaryBar
                  analytics={quizPage.quizAnalytics}
                  isLoading={quizPage.quizAnalyticsLoading}
                  title={t('edit.quiz.analyticsTitle')}
                  styles={styles}
                  actionLabel={t('edit.quiz.analyticsOpenDetails')}
                  onOpenDetails={scrollToAnalytics}
                />

                {quizPage.quizLoading ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyDescription}>
                      {t('edit.quiz.loading')}
                    </p>
                  </div>
                ) : (
                  <>
                    <QuizEditorForm
                      form={quizPage.form}
                      isDeletingQuiz={quizPage.isDeletingQuiz}
                      isSavingQuiz={quizPage.isSavingQuiz}
                      loadedQuizStats={quizPage.loadedQuiz?.stats ?? null}
                      quizError={quizPage.quizError}
                      quizMessage={quizPage.quizMessage}
                      styles={styles}
                      t={t}
                      onAddOption={quizPage.addOption}
                      onAddQuestion={quizPage.addQuestion}
                      onDeleteQuiz={() => void quizPage.handleDeleteQuiz()}
                      onQuestionTypeChange={quizPage.handleQuestionTypeChange}
                      onRemoveOption={quizPage.removeOption}
                      onRemoveQuestion={quizPage.removeQuestion}
                      onReset={quizPage.resetCurrentForm}
                      onSave={() => void quizPage.handleSaveQuiz()}
                      onToggleOptionCorrect={quizPage.toggleOptionCorrect}
                      onUpdateOptionField={quizPage.updateOptionField}
                      onUpdateQuestionField={quizPage.updateQuestionField}
                      onUpdateTopLevelField={quizPage.updateTopLevelField}
                    />

                    <QuizAnalyticsPanel
                      analytics={quizPage.quizAnalytics}
                      id={analyticsSectionId}
                      isLoading={quizPage.quizAnalyticsLoading}
                      language={i18n.language}
                      styles={styles}
                      t={t}
                      title={t('edit.quiz.analyticsTitle')}
                      description={t('edit.quiz.analyticsDescription')}
                    />
                  </>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {t('edit.quiz.selectChapterTitle')}
                </p>
                <p className={styles.emptyDescription}>
                  {t('edit.quiz.selectChapterDescription')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
