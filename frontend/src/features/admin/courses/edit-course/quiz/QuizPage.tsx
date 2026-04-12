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

  if (quizPage.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (quizPage.loadError || !quizPage.courseId || !quizPage.course) {
    return (
      <EditCourseErrorState
        message={
          quizPage.loadError ||
          t('edit.chapters.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={quizPage.courseId}
      section="quiz"
      title={t('edit.tabs.quiz', { defaultValue: 'Training quiz' })}
      subtitle={t('edit.quiz.subtitle', {
        defaultValue:
          'Attach one scored training quiz to each chapter. These quizzes can include single-choice and multiple-choice questions with a passing percentage.',
      })}
      courseTitle={quizPage.localizedCourseTitle}
      wide
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.quiz.title', { defaultValue: 'Chapter training quizzes' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.quiz.description', {
              defaultValue:
                'Pick a chapter on the left, then create or update the scored training quiz learners will see at the end of that chapter.',
            })}
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
                    {t('edit.quiz.editorTitle', { defaultValue: 'Training quiz editor' })}
                  </h3>
                  <p className={styles.sectionDescription}>
                    {t('edit.quiz.editorDescription', {
                      defaultValue:
                        'Configure the scored quiz for the selected chapter, including the pass percentage and the full question set.',
                    })}
                  </p>
                </div>

                {quizPage.quizLoading ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyDescription}>
                      {t('edit.quiz.loading', { defaultValue: 'Loading training quiz...' })}
                    </p>
                  </div>
                ) : (
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
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {t('edit.quiz.selectChapterTitle', { defaultValue: 'Select a chapter first' })}
                </p>
                <p className={styles.emptyDescription}>
                  {t('edit.quiz.selectChapterDescription', {
                    defaultValue:
                      'Choose a chapter from the left sidebar to manage its training quiz.',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
