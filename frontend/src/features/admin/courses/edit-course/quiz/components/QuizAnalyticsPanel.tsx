'use client';

import type { TFunction } from 'i18next';
import type { AdminFinalTestAnalytics, AdminQuizAnalytics } from '@/services/course';

type QuizAnalyticsPanelProps = {
  analytics: AdminQuizAnalytics | AdminFinalTestAnalytics | null;
  id?: string;
  isLoading: boolean;
  language: string;
  styles: Record<string, string>;
  t: TFunction<'admin', undefined>;
  title: string;
  description: string;
};

const formatLearnerName = (
  learner: AdminQuizAnalytics['learners'][number] | AdminFinalTestAnalytics['learners'][number],
) => {
  const fullName = [learner.firstName, learner.lastName].filter(Boolean).join(' ').trim();
  return fullName || learner.email;
};

const formatDate = (value: string | null, language: string) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(language.startsWith('fi') ? 'fi-FI' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function QuizAnalyticsPanel({
  analytics,
  id,
  isLoading,
  language,
  styles,
  t,
  title,
  description,
}: QuizAnalyticsPanelProps) {
  if (isLoading) {
    return (
      <section id={id} className={styles.quizAnalyticsCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.chapterSectionTitle}>{title}</h3>
          <p className={styles.sectionDescription}>{description}</p>
        </div>

        <div className={styles.emptyState}>
          <p className={styles.emptyDescription}>
            {t('edit.quiz.analyticsLoading')}
          </p>
        </div>
      </section>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <section id={id} className={styles.quizAnalyticsCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.chapterSectionTitle}>{title}</h3>
        <p className={styles.sectionDescription}>{description}</p>
      </div>

      <div className={styles.quizAnalyticsSummaryGrid}>
        <article className={styles.quizAnalyticsMetric}>
          <span className={styles.quizAnalyticsMetricLabel}>
            {t('edit.quiz.analyticsLearners')}
          </span>
          <strong className={styles.quizAnalyticsMetricValue}>
            {analytics.summary.learnerCount}
          </strong>
        </article>
        <article className={styles.quizAnalyticsMetric}>
          <span className={styles.quizAnalyticsMetricLabel}>
            {t('edit.quiz.analyticsAttempts')}
          </span>
          <strong className={styles.quizAnalyticsMetricValue}>
            {analytics.summary.attemptCount}
          </strong>
        </article>
        <article className={styles.quizAnalyticsMetric}>
          <span className={styles.quizAnalyticsMetricLabel}>
            {t('edit.quiz.analyticsAverageScore')}
          </span>
          <strong className={styles.quizAnalyticsMetricValue}>
            {analytics.summary.averageScore ?? '-'}
          </strong>
        </article>
        <article className={styles.quizAnalyticsMetric}>
          <span className={styles.quizAnalyticsMetricLabel}>
            {t('edit.quiz.analyticsPassRate')}
          </span>
          <strong className={styles.quizAnalyticsMetricValue}>
            {analytics.summary.passRate !== null ? `${analytics.summary.passRate}%` : '-'}
          </strong>
        </article>
      </div>

      <div className={styles.quizAnalyticsMetaRow}>
        <span>
          {t('edit.quiz.analyticsBestScore')}:{' '}
          {analytics.summary.bestScore ?? '-'}
        </span>
        <span>
          {t('edit.quiz.analyticsLatestAttempt')}:{' '}
          {formatDate(analytics.summary.latestAttemptAt, language)}
        </span>
      </div>

      {analytics.learners.length > 0 ? (
        <div className={styles.quizAnalyticsLearnerList}>
          {analytics.learners.map((learner) => (
            <article key={learner.userId} className={styles.quizAnalyticsLearnerCard}>
              <div className={styles.quizAnalyticsLearnerHeader}>
                <div>
                  <h4 className={styles.quizAnalyticsLearnerName}>
                    {formatLearnerName(learner)}
                  </h4>
                  <p className={styles.quizAnalyticsLearnerEmail}>{learner.email}</p>
                </div>
                <span
                  className={
                    learner.hasPassed
                      ? styles.quizAnalyticsStatusPassed
                      : styles.quizAnalyticsStatusPending
                  }
                >
                  {learner.hasPassed
                    ? t('edit.quiz.analyticsPassed')
                    : t('edit.quiz.analyticsNotPassed')}
                </span>
              </div>

              <div className={styles.quizAnalyticsLearnerStats}>
                <span>
                  {t('edit.quiz.analyticsAttempts')}:{' '}
                  {learner.attemptCount}
                </span>
                <span>
                  {t('edit.quiz.analyticsLatestScore')}:{' '}
                  {learner.latestScore}
                </span>
                <span>
                  {t('edit.quiz.analyticsBestScore')}:{' '}
                  {learner.bestScore}
                </span>
                <span>
                  {t('edit.quiz.analyticsLatestAttempt')}:{' '}
                  {formatDate(learner.latestAttemptAt, language)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>
            {t('edit.quiz.analyticsEmptyTitle')}
          </p>
          <p className={styles.emptyDescription}>
            {t('edit.quiz.analyticsEmptyDescription')}
          </p>
        </div>
      )}
    </section>
  );
}
