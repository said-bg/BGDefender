'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  LearnerChapterQuiz,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ActiveLanguage } from '../courseDetail.utils';
import styles from './ChapterTrainingQuiz.module.css';

type ChapterTrainingQuizProps = {
  activeLanguage: ActiveLanguage;
  chapterId: string;
  courseId: string;
  passingScore: number;
};

const getLocalizedValue = (
  language: ActiveLanguage,
  english: string | null | undefined,
  finnish: string | null | undefined,
) => (language === 'fi' ? finnish || english || '' : english || finnish || '');

const scrollQuizCardIntoView = (element: HTMLElement | null) => {
  const contentPanel = document.querySelector<HTMLElement>('[data-course-content-panel]');

  if (contentPanel) {
    contentPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (!element) {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function ChapterTrainingQuiz({
  activeLanguage,
  chapterId,
  courseId,
  passingScore,
}: ChapterTrainingQuizProps) {
  const { t } = useTranslation('courses');
  const quizCardRef = useRef<HTMLElement | null>(null);
  const [quiz, setQuiz] = useState<LearnerChapterQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttemptSummary | null>(null);
  const [bestAttempt, setBestAttempt] = useState<QuizAttemptSummary | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(true);
  const passedSummaryMessage =
    submitMessage ??
    t('detail.quizPassedSummary', {
      defaultValue:
        'You already passed this training quiz. Start a new attempt whenever you want to practice again.',
    });

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await courseService.getChapterQuiz(courseId, chapterId);
        const learnerQuiz = response && !('stats' in response) ? response : null;
        setQuiz(learnerQuiz);
        setLatestAttempt(learnerQuiz?.latestAttempt ?? null);
        setBestAttempt(learnerQuiz?.bestAttempt ?? null);
        setSelectedAnswers({});
        setIsQuizActive(!Boolean(learnerQuiz?.latestAttempt?.passed));
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            t('detail.quizLoadFailed', {
              defaultValue: 'Failed to load the training quiz.',
            }),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadQuiz();
  }, [chapterId, courseId, t]);

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
    if (!quiz) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitMessage(null);

      const response = await courseService.submitChapterQuizAttempt(courseId, chapterId, {
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIds: selectedAnswers[question.id] ?? [],
        })),
      });

      setLatestAttempt(response.latestAttempt);
      setBestAttempt(response.bestAttempt);
      setSubmitMessage(
        response.attempt.passed
          ? t('detail.quizPassedMessage', {
              defaultValue: 'Nice work. You passed this chapter training quiz.',
            })
          : t('detail.quizFailedMessage', {
              defaultValue: 'You can retry this training quiz as many times as you want.',
            }),
      );
      setIsQuizActive(!response.attempt.passed);
      window.requestAnimationFrame(() => {
        scrollQuizCardIntoView(quizCardRef.current);
      });
    } catch (submissionError) {
      setSubmitError(
        getApiErrorMessage(
          submissionError,
          t('detail.quizSubmitFailed', {
            defaultValue: 'Failed to submit the training quiz.',
          }),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRetry = () => {
    setSelectedAnswers({});
    setSubmitError(null);
    setSubmitMessage(null);
    setIsQuizActive(true);
  };

  if (loading) {
    return <p className={styles.helperText}>{t('detail.quizLoading', { defaultValue: 'Loading quiz...' })}</p>;
  }

  if (error) {
    return <p className={styles.errorText}>{error}</p>;
  }

  if (!quiz) {
    return (
      <p className={styles.helperText}>
        {t('detail.quizUnavailable', {
          defaultValue: 'No training quiz is published for this chapter yet.',
        })}
      </p>
    );
  }

  return (
    <section ref={quizCardRef} className={styles.quizCard}>
      <div className={styles.quizHeader}>
        <span
          className={`${styles.statusBadge} ${
            latestAttempt?.passed ? styles.statusPassed : styles.statusFailed
          }`}
        >
          {latestAttempt
            ? latestAttempt.passed
              ? t('detail.quizPassed', { defaultValue: 'Passed' })
              : t('detail.quizNotPassed', { defaultValue: 'Not passed yet' })
            : t('detail.trainingQuiz', { defaultValue: 'Training quiz' })}
        </span>
      </div>

      <div className={styles.quizMeta}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.quizPassingScore', { defaultValue: 'Passing score' })}
          </span>
          <span className={styles.metaValue}>{passingScore}%</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.quizAnswered', { defaultValue: 'Answered now' })}
          </span>
          <span className={styles.metaValue}>
            {answeredCount}/{quiz.questions.length}
          </span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.quizBestScore', { defaultValue: 'Best score' })}
          </span>
          <span className={styles.metaValue}>{bestAttempt?.score ?? '-'}</span>
        </div>
      </div>

      {!isQuizActive && latestAttempt?.passed ? (
        <>
          <div className={styles.attemptSummaryCard}>
            <p className={submitMessage ? styles.successText : styles.helperText}>
              {passedSummaryMessage}
            </p>
          </div>

          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={startRetry}
            >
              {t('detail.quizStartRetry', { defaultValue: 'Retry quiz' })}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.questionList}>
            {quiz.questions.map((question, questionIndex) => (
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
                        <span>{getLocalizedValue(activeLanguage, option.labelEn, option.labelFi)}</span>
                      </label>
                    );
                  })}
                </div>

                {latestAttempt && !latestAttempt.passed ? (
                  <p className={styles.questionExplanation}>
                    {getLocalizedValue(activeLanguage, question.explanationEn, question.explanationFi)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          {submitMessage ? <p className={styles.successText}>{submitMessage}</p> : null}
          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={`${styles.quizActions} ${styles.quizActionsEnd}`}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setSelectedAnswers({})}
            >
              {t('detail.quizRetry', { defaultValue: 'Clear answers' })}
            </button>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? t('detail.quizSubmitting', { defaultValue: 'Submitting quiz...' })
                : t('detail.quizSubmit', { defaultValue: 'Submit quiz' })}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

