'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CreatorLearningMetrics from '@/features/creator/dashboard/CreatorLearningMetrics';
import { localizePathname, normalizeLocale } from '@/lib/locale';
import {
  EditCourseErrorState,
  EditCourseLoadingState,
  EditCourseProtected,
  EditCourseShell,
} from '@/features/admin/courses/edit-course/shared/EditCourseShared';
import formStyles from '@/features/admin/courses/edit-course/shared/EditCourseForm.module.css';
import sharedStyles from '@/features/admin/courses/edit-course/shared/EditCoursePage.module.css';
import shellStyles from '@/features/admin/courses/edit-course/shared/EditCourseShell.module.css';
import finalTestStyles from '@/features/admin/courses/edit-course/final-test/FinalTestPage.module.css';
import QuizAnalyticsPanel from '@/features/admin/courses/edit-course/quiz/components/QuizAnalyticsPanel';
import useCourseAnalyticsPage from './useCourseAnalyticsPage';
import pageStyles from './CourseAnalyticsPage.module.css';

const styles = {
  ...formStyles,
  ...sharedStyles,
  ...shellStyles,
  ...finalTestStyles,
  ...pageStyles,
};

const getLocalizedText = (
  language: string,
  enValue: string | null | undefined,
  fiValue: string | null | undefined,
) => (language === 'fi' ? fiValue : enValue) ?? enValue ?? fiValue ?? '';

export default function CourseAnalyticsPage() {
  return (
    <EditCourseProtected>
      <CourseAnalyticsPageContent />
    </EditCourseProtected>
  );
}

function CourseAnalyticsPageContent() {
  const { t, i18n } = useTranslation('admin');
  const activeLocale = normalizeLocale(i18n.language);
  const analyticsPage = useCourseAnalyticsPage(i18n.language, t);

  if (analyticsPage.loadingPage) {
    return <EditCourseLoadingState />;
  }

  if (analyticsPage.loadError || !analyticsPage.courseId || !analyticsPage.course) {
    return (
      <EditCourseErrorState
        message={analyticsPage.loadError || t('edit.missingCourseId')}
      />
    );
  }

  const finalTestSummary = analyticsPage.course.finalTests?.[0] ?? null;

  return (
    <EditCourseShell
      courseId={analyticsPage.courseId}
      section="analytics"
      course={analyticsPage.course}
      title={t('edit.analytics.title')}
      subtitle={t('edit.analytics.subtitle')}
      courseTitle={analyticsPage.localizedCourseTitle}
    >
      <div className={styles.pageStack}>
        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>{t('edit.analytics.overviewTitle')}</h2>
            <p className={styles.sectionDescription}>
              {t('edit.analytics.overviewDescription')}
            </p>
          </div>

          <CreatorLearningMetrics
            summary={analyticsPage.course.learningSummary ?? null}
            t={t}
          />
        </section>

        <section className={styles.formCard}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>{t('edit.analytics.finalTestTitle')}</h2>
              <p className={styles.sectionDescription}>
                {t('edit.analytics.finalTestDescription')}
              </p>
            </div>

            <Link
              href={localizePathname(
                `/admin/courses/${analyticsPage.courseId}/edit/final-test`,
                activeLocale,
              )}
              className={styles.sectionActionLink}
            >
              {t('edit.analytics.openFinalTestEditor')}
            </Link>
          </div>

          {analyticsPage.finalTestAnalytics ? (
            <QuizAnalyticsPanel
              analytics={analyticsPage.finalTestAnalytics}
              isLoading={analyticsPage.analyticsLoading}
              language={i18n.language}
              styles={styles}
              t={t}
              title={getLocalizedText(
                i18n.language,
                finalTestSummary?.titleEn ?? t('edit.analytics.finalTestTitle'),
                finalTestSummary?.titleFi ?? t('edit.analytics.finalTestTitle'),
              )}
              description={t('edit.analytics.finalTestDescription')}
            />
          ) : finalTestSummary ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>{t('edit.quiz.analyticsEmptyTitle')}</p>
              <p className={styles.emptyDescription}>
                {t('edit.quiz.analyticsEmptyDescription')}
              </p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>{t('edit.analytics.noFinalTestTitle')}</p>
              <p className={styles.emptyDescription}>
                {t('edit.analytics.noFinalTestDescription')}
              </p>
            </div>
          )}
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.sectionTitle}>{t('edit.analytics.trainingQuizTitle')}</h2>
            <p className={styles.sectionDescription}>
              {t('edit.analytics.trainingQuizDescription')}
            </p>
          </div>

          {analyticsPage.analyticsError ? (
            <p className={styles.errorMessage}>{analyticsPage.analyticsError}</p>
          ) : null}

          <div className={styles.chapterList}>
            {analyticsPage.chapterAnalytics.map(({ chapter, analytics }, index) => {
              const trainingQuiz = chapter.trainingQuiz ?? null;
              const quizEditorHref = `${localizePathname(
                `/admin/courses/${analyticsPage.courseId}/edit/quiz`,
                activeLocale,
              )}?chapter=${chapter.id}`;

              return (
                <section key={chapter.id} className={styles.quizAnalyticsCard}>
                  <div className={styles.sectionHeaderRow}>
                    <div className={styles.chapterContext}>
                      <span className={styles.chapterEyebrow}>
                        {t('edit.analytics.chapterLabel', { index: index + 1 })}
                      </span>
                      <h3 className={styles.chapterTitle}>
                        {getLocalizedText(i18n.language, chapter.titleEn, chapter.titleFi)}
                      </h3>
                      <p className={styles.chapterQuizTitle}>
                        {trainingQuiz
                          ? getLocalizedText(
                              i18n.language,
                              trainingQuiz.titleEn,
                              trainingQuiz.titleFi,
                            )
                          : t('edit.analytics.noQuizTitle')}
                      </p>
                    </div>

                    <Link href={quizEditorHref} className={styles.sectionActionLink}>
                      {t('edit.analytics.openQuizEditor')}
                    </Link>
                  </div>

                  {analytics ? (
                    <QuizAnalyticsPanel
                      analytics={analytics}
                      isLoading={analyticsPage.analyticsLoading}
                      language={i18n.language}
                      styles={styles}
                      t={t}
                      title={getLocalizedText(
                        i18n.language,
                        trainingQuiz?.titleEn ?? chapter.titleEn,
                        trainingQuiz?.titleFi ?? chapter.titleFi,
                      )}
                      description={t('edit.analytics.trainingQuizDescription')}
                    />
                  ) : trainingQuiz ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>{t('edit.quiz.analyticsEmptyTitle')}</p>
                      <p className={styles.emptyDescription}>
                        {t('edit.quiz.analyticsEmptyDescription')}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>{t('edit.analytics.noQuizTitle')}</p>
                      <p className={styles.emptyDescription}>
                        {t('edit.analytics.noQuizDescription')}
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </EditCourseShell>
  );
}
