'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  LearnerCourseFinalTest,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/courseService';
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

export default function CourseFinalTest({
  activeLanguage,
  courseId,
  enabled,
}: CourseFinalTestProps) {
  const { t } = useTranslation('courses');
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

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setFinalTest(null);
      return;
    }

    const loadFinalTest = async () => {
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
    };

    void loadFinalTest();
  }, [courseId, enabled, t]);

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
    <section className={styles.quizCard}>
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

                {latestAttempt ? (
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

          {submitMessage ? <p className={styles.successText}>{submitMessage}</p> : null}
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
