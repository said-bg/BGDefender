'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  LearnerCourseFinalTest,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ActiveLanguage } from '../courseDetail.utils';
import styles from './ChapterTrainingQuiz.module.css';

type CourseFinalTestProps = {
  activeLanguage: ActiveLanguage;
  courseId: string;
  enabled: boolean;
};

const getLocalizedValue = (
  language: ActiveLanguage,
  english: string | null | undefined,
  finnish: string | null | undefined,
) => (language === 'fi' ? finnish || english || '' : english || finnish || '');

const scrollFinalTestCardIntoView = (element: HTMLElement | null) => {
  if (!element) {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function CourseFinalTest({
  activeLanguage,
  courseId,
  enabled,
}: CourseFinalTestProps) {
  const { t } = useTranslation('courses');
  const finalTestCardRef = useRef<HTMLElement | null>(null);
  const [finalTest, setFinalTest] = useState<LearnerCourseFinalTest | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptSummary | null>(null);
  const [bestAttempt, setBestAttempt] = useState<QuizAttemptSummary | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const loadFinalTest = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setFinalTest(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await courseService.getCourseFinalTest(courseId);
      const learnerFinalTest = response && !('stats' in response) ? response : null;
      setFinalTest(learnerFinalTest);
      setLatestAttempt(learnerFinalTest?.latestAttempt ?? null);
      setBestAttempt(learnerFinalTest?.bestAttempt ?? null);
      setSelectedAnswers({});
      setIsStarted(Boolean(learnerFinalTest?.isUnlocked && learnerFinalTest.latestAttempt));
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          t('detail.finalTestLoadFailed', {
            defaultValue: 'Failed to load the final test.',
          }),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, enabled, t]);

  useEffect(() => {
    void loadFinalTest();
  }, [loadFinalTest]);

  const certificateStatus = finalTest?.certificate?.status ?? null;
  const summaryMessage = latestAttempt
    ? submitMessage ??
      (latestAttempt.passed
        ? t('detail.finalTestPassedSummary', {
            defaultValue:
              'Your final result is recorded. You completed the assessment and can move to the last step of the course.',
          })
        : t('detail.finalTestFailedSummary', {
            defaultValue:
              'Your latest result is saved. Review the course, adjust your answers, and try again whenever you want.',
          }))
    : null;
  const latestScoreLabel = latestAttempt ? `${latestAttempt.score}%` : '-';
  const latestCorrectAnswersLabel = latestAttempt
    ? `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions}`
    : '-';
  const completionStatusLabel = latestAttempt?.passed
    ? t('detail.finalTestCourseCompleted', {
        defaultValue: 'Course completed',
      })
    : t('detail.finalTestRetryNeeded', {
        defaultValue: 'Retry available',
      });

  const answeredCount = useMemo(
    () =>
      Object.values(selectedAnswers).filter((currentAnswer) => currentAnswer.length > 0).length,
    [selectedAnswers],
  );

  const updateAnswer = (question: QuizQuestion, optionId: string, checked: boolean) => {
    setSelectedAnswers((previous) => {
      const currentAnswers = previous[question.id] ?? [];

      if (question.type === 'single_choice') {
        return {
          ...previous,
          [question.id]: checked ? [optionId] : [],
        };
      }

      const nextAnswers = checked
        ? [...currentAnswers, optionId]
        : currentAnswers.filter((currentId) => currentId !== optionId);

      return {
        ...previous,
        [question.id]: nextAnswers,
      };
    });
  };

  const handleSubmit = async () => {
    if (!finalTest?.isUnlocked) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitMessage(null);

      const response = await courseService.submitCourseFinalTestAttempt(courseId, {
        answers: finalTest.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIds: selectedAnswers[question.id] ?? [],
        })),
      });

      setLatestAttempt(response.latestAttempt);
      setBestAttempt(response.bestAttempt);
      setSubmitMessage(
        response.attempt.passed
          ? t('detail.finalTestPassedMessage', {
              defaultValue: 'Excellent work. You passed the course final test.',
            })
          : t('detail.finalTestFailedMessage', {
              defaultValue:
                'You can review the course and retry the final test whenever you are ready.',
            }),
      );
      await loadFinalTest();
      window.requestAnimationFrame(() => {
        scrollFinalTestCardIntoView(finalTestCardRef.current);
      });
    } catch (submissionError) {
      setSubmitError(
        getApiErrorMessage(
          submissionError,
          t('detail.finalTestSubmitFailed', {
            defaultValue: 'Failed to submit the final test.',
          }),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <p className={styles.helperText}>
        {t('detail.finalTestLoading', { defaultValue: 'Loading final test...' })}
      </p>
    );
  }

  if (error) {
    return <p className={styles.errorText}>{error}</p>;
  }

  if (!finalTest) {
    return null;
  }

  return (
    <section ref={finalTestCardRef} className={styles.quizCard}>
      <div className={styles.quizHeader}>
        <span
          className={`${styles.statusBadge} ${
            latestAttempt?.passed
              ? styles.statusPassed
              : finalTest.isUnlocked
                ? styles.statusFailed
                : styles.statusPending
          }`}
        >
          {latestAttempt
            ? latestAttempt.passed
              ? t('detail.finalTestPassed', { defaultValue: 'Passed' })
              : t('detail.finalTestNotPassed', { defaultValue: 'Not passed yet' })
            : finalTest.isUnlocked
              ? t('detail.finalTest', { defaultValue: 'Final test' })
              : t('detail.finalTestLocked', {
                  defaultValue: 'Locked until the full course is completed',
                })}
        </span>
      </div>

      <div className={styles.quizMeta}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestPassingScore', { defaultValue: 'Passing score' })}
          </span>
          <span className={styles.metaValue}>{finalTest.passingScore}%</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestAnswered', { defaultValue: 'Answered now' })}
          </span>
          <span className={styles.metaValue}>
            {answeredCount}/{finalTest.questions.length}
          </span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestBestScore', { defaultValue: 'Best score' })}
          </span>
          <span className={styles.metaValue}>{bestAttempt?.score ?? '-'}</span>
        </div>
      </div>

      {latestAttempt ? (
        <div className={styles.attemptSummaryCard}>
          <div className={styles.quizMeta}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestLatestScore', { defaultValue: 'Latest score' })}
              </span>
              <span className={styles.metaValue}>{latestScoreLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestCorrectAnswers', { defaultValue: 'Correct answers' })}
              </span>
              <span className={styles.metaValue}>{latestCorrectAnswersLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestCourseStatus', { defaultValue: 'Course status' })}
              </span>
              <span className={styles.metaValue}>{completionStatusLabel}</span>
            </div>
          </div>

          {summaryMessage ? (
            <p className={latestAttempt.passed ? styles.successText : styles.helperText}>
              {summaryMessage}
            </p>
          ) : null}

          {certificateStatus === 'pending_profile' ? (
            <div className={styles.questionCard}>
              <p className={styles.questionPrompt}>
                {t('detail.certificatePendingTitle', {
                  defaultValue: 'Certificate waiting for profile completion',
                })}
              </p>
              <p className={styles.helperText}>
                {t('detail.certificatePendingDescription', {
                  defaultValue:
                    'You passed the final test. Complete your profile with your first and last name to generate the certificate automatically.',
                })}
              </p>
              <div className={styles.quizActions}>
                <Link href="/account" className={styles.secondaryAction}>
                  {t('detail.completeProfile', { defaultValue: 'Complete profile' })}
                </Link>
              </div>
            </div>
          ) : null}

          {certificateStatus === 'issued' ? (
            <div className={styles.questionCard}>
              <p className={styles.questionPrompt}>
                {t('detail.certificateIssuedTitle', {
                  defaultValue: 'Certificate earned',
                })}
              </p>
              <p className={styles.helperText}>
                {t('detail.certificateIssuedDescription', {
                  defaultValue: 'Your certificate is now ready in your certificates space.',
                })}
              </p>
              <div className={styles.quizActions}>
                <Link href="/certificates" className={styles.secondaryAction}>
                  {t('detail.viewCertificate', { defaultValue: 'View certificates' })}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!finalTest.isUnlocked ? (
        <p className={styles.helperText}>
          {t('detail.finalTestLockedDescription', {
            defaultValue: 'Complete every chapter in this course to unlock the final test.',
          })}
        </p>
      ) : !isStarted ? (
        <>
          <p className={styles.helperText}>
            {t('detail.finalTestUnlockedDescription', {
              defaultValue:
                'You unlocked the final assessment. When you are ready, answer the questions below and reach the required passing score.',
            })}
          </p>
          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => setIsStarted(true)}
            >
              {latestAttempt
                ? t('detail.finalTestContinue', { defaultValue: 'Continue final test' })
                : t('detail.finalTestStart', { defaultValue: 'Start final test' })}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.questionList}>
            {finalTest.questions.map((question, questionIndex) => (
              <article key={question.id} className={styles.questionCard}>
                <p className={styles.questionPrompt}>
                  {questionIndex + 1}.{' '}
                  {getLocalizedValue(activeLanguage, question.promptEn, question.promptFi)}
                </p>

                <div className={styles.questionOptions}>
                  {question.options.map((option) => {
                    const currentAnswers = selectedAnswers[question.id] ?? [];
                    const isSelected = currentAnswers.includes(option.id);

                    return (
                      <label key={option.id} className={styles.optionLabel}>
                        <input
                          type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                          name={question.id}
                          checked={isSelected}
                          onChange={(event) =>
                            updateAnswer(question, option.id, event.target.checked)
                          }
                        />
                        <span>
                          {getLocalizedValue(activeLanguage, option.labelEn, option.labelFi)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {latestAttempt && !latestAttempt.passed ? (
                  <p className={styles.questionExplanation}>
                    {getLocalizedValue(
                      activeLanguage,
                      question.explanationEn,
                      question.explanationFi,
                    )}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? t('detail.finalTestSubmitting', {
                    defaultValue: 'Submitting final test...',
                  })
                : t('detail.finalTestSubmit', { defaultValue: 'Submit final test' })}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setSelectedAnswers({})}
            >
              {t('detail.finalTestRetry', { defaultValue: 'Clear answers' })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

