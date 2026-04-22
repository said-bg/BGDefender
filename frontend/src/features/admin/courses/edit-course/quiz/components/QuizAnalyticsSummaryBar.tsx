'use client';

import type { AdminFinalTestAnalytics, AdminQuizAnalytics } from '@/services/course';

type QuizAnalyticsSummaryBarProps = {
  analytics: AdminQuizAnalytics | AdminFinalTestAnalytics | null;
  isLoading: boolean;
  title: string;
  styles: Record<string, string>;
  actionLabel: string;
  onOpenDetails: () => void;
};

export default function QuizAnalyticsSummaryBar({
  analytics,
  isLoading,
  title,
  styles,
  actionLabel,
  onOpenDetails,
}: QuizAnalyticsSummaryBarProps) {
  if (isLoading) {
    return (
      <div className={styles.quizAnalyticsSummaryBar}>
        <div className={styles.quizAnalyticsSummaryCopy}>
          <p className={styles.quizAnalyticsSummaryTitle}>{title}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const hasAttempts = analytics.summary.attemptCount > 0;

  return (
    <div className={styles.quizAnalyticsSummaryBar}>
      <div className={styles.quizAnalyticsSummaryCopy}>
        <p className={styles.quizAnalyticsSummaryTitle}>{title}</p>
        {hasAttempts ? null : <p className={styles.quizAnalyticsSummaryText} />}
      </div>

      <button type="button" className={styles.inlineAction} onClick={onOpenDetails}>
        {actionLabel}
      </button>
    </div>
  );
}
