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
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import quizStyles from '@/features/admin/courses/edit-course/quiz/QuizPage.module.css';
import FinalTestEditorForm from './components/FinalTestEditorForm';
import useFinalTestPage from './hooks/useFinalTestPage';
import featureStyles from './FinalTestPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...shellStyles,
  ...quizStyles,
  ...featureStyles,
};

export default function FinalTestPage() {
  return (
    <EditCourseProtected>
      <FinalTestPageContent />
    </EditCourseProtected>
  );
}

function FinalTestPageContent() {
  const { t, i18n } = useTranslation('admin');
  const finalTestPage = useFinalTestPage(i18n.language, t);

  if (finalTestPage.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (finalTestPage.loadError || !finalTestPage.courseId || !finalTestPage.course) {
    return (
      <EditCourseErrorState
        message={
          finalTestPage.loadError ||
          t('edit.missingCourseId', {
            defaultValue: 'Missing course id.',
          })
        }
      />
    );
  }

  return (
    <EditCourseShell
      courseId={finalTestPage.courseId}
      section="final-test"
      title={t('edit.tabs.finalTest', { defaultValue: 'Final test' })}
      subtitle={t('edit.finalTest.subtitle', {
        defaultValue:
          'Create one optional scored final test for the full course. Learners unlock it only after finishing the course path.',
      })}
      courseTitle={finalTestPage.localizedCourseTitle}
      wide
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>
            {t('edit.finalTest.title', { defaultValue: 'Course final test' })}
          </h2>
          <p className={styles.sectionDescription}>
            {t('edit.finalTest.description', {
              defaultValue:
                'Configure the optional final assessment for this course, including its passing percentage and question set.',
            })}
          </p>
        </div>

        <div className={styles.editorLayout}>
          <div className={styles.quizEditorColumn}>
            {finalTestPage.finalTestLoading ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyDescription}>
                  {t('edit.finalTest.loading', {
                    defaultValue: 'Loading final test...',
                  })}
                </p>
              </div>
            ) : (
              <FinalTestEditorForm
                finalTestError={finalTestPage.finalTestError}
                finalTestMessage={finalTestPage.finalTestMessage}
                form={finalTestPage.form}
                isDeletingFinalTest={finalTestPage.isDeletingFinalTest}
                isSavingFinalTest={finalTestPage.isSavingFinalTest}
                loadedFinalTestStats={finalTestPage.loadedFinalTest?.stats ?? null}
                styles={styles}
                t={t}
                onAddOption={finalTestPage.addOption}
                onAddQuestion={finalTestPage.addQuestion}
                onDeleteFinalTest={() => void finalTestPage.handleDeleteFinalTest()}
                onQuestionTypeChange={finalTestPage.handleQuestionTypeChange}
                onRemoveOption={finalTestPage.removeOption}
                onRemoveQuestion={finalTestPage.removeQuestion}
                onReset={finalTestPage.resetCurrentForm}
                onSave={() => void finalTestPage.handleSaveFinalTest()}
                onToggleOptionCorrect={finalTestPage.toggleOptionCorrect}
                onUpdateOptionField={finalTestPage.updateOptionField}
                onUpdateQuestionField={finalTestPage.updateQuestionField}
                onUpdateTopLevelField={finalTestPage.updateTopLevelField}
              />
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
