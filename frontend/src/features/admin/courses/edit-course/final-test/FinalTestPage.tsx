'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import { buildCoursePreviewHref } from '@/features/admin/courses/edit-course/shared/coursePreview.utils';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import QuizAnalyticsPanel from '@/features/admin/courses/edit-course/quiz/components/QuizAnalyticsPanel';
import QuizAnalyticsSummaryBar from '@/features/admin/courses/edit-course/quiz/components/QuizAnalyticsSummaryBar';
import FinalTestEditorForm from './components/FinalTestEditorForm';
import useFinalTestPage from './hooks/useFinalTestPage';
import featureStyles from './FinalTestPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...shellStyles,
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
  const pathname = usePathname();
  const finalTestPage = useFinalTestPage(i18n.language, t);
  const analyticsSectionId = 'course-final-test-analytics';

  const scrollToAnalytics = () => {
    document.getElementById(analyticsSectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (finalTestPage.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (finalTestPage.loadError || !finalTestPage.courseId || !finalTestPage.course) {
    return (
      <EditCourseErrorState
        message={finalTestPage.loadError || t('edit.missingCourseId')}
      />
    );
  }

  return (
    <EditCourseShell
      courseId={finalTestPage.courseId}
      section="final-test"
      title={t('edit.tabs.finalTest')}
      subtitle={t('edit.finalTest.subtitle')}
      courseTitle={finalTestPage.localizedCourseTitle}
      previewHref={
        finalTestPage.courseId
          ? buildCoursePreviewHref(finalTestPage.courseId, {
              returnTo: pathname ?? undefined,
              target: { type: 'final-test' },
            })
          : undefined
      }
    >
      <section className={styles.formCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.sectionTitle}>{t('edit.finalTest.title')}</h2>
          <p className={styles.sectionDescription}>{t('edit.finalTest.description')}</p>
        </div>

        <div className={styles.editorLayout}>
          <div className={styles.quizEditorColumn}>
            <QuizAnalyticsSummaryBar
              analytics={finalTestPage.finalTestAnalytics}
              isLoading={finalTestPage.finalTestAnalyticsLoading}
              title={t('edit.finalTest.analyticsTitle')}
              styles={styles}
              actionLabel={t('edit.finalTest.analyticsOpenDetails')}
              onOpenDetails={scrollToAnalytics}
            />

            {finalTestPage.finalTestLoading ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyDescription}>{t('edit.finalTest.loading')}</p>
              </div>
            ) : (
              <>
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

                <QuizAnalyticsPanel
                  analytics={finalTestPage.finalTestAnalytics}
                  id={analyticsSectionId}
                  isLoading={finalTestPage.finalTestAnalyticsLoading}
                  language={i18n.language}
                  styles={styles}
                  t={t}
                  title={t('edit.finalTest.analyticsTitle')}
                  description={t('edit.finalTest.analyticsDescription')}
                />
              </>
            )}
          </div>
        </div>
      </section>
    </EditCourseShell>
  );
}
