'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  AdminChapterQuiz,
  LearnerChapterQuiz,
  QuizAttemptAnswerReview,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ActiveLanguage } from '../courseDetail.utils';
import { evaluatePreviewAttempt } from '../lib/courseAssessmentPreview.utils';
import styles from './ChapterTrainingQuiz.module.css';

type ChapterTrainingQuizProps = {
  activeLanguage: ActiveLanguage;
  chapterId: string;
  courseId: string;
  passingScore: number;
  previewMode?: boolean;
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

const toPreviewQuiz = (
  response: AdminChapterQuiz | LearnerChapterQuiz | null,
): LearnerChapterQuiz | null => {
  if (!response) {
    return null;
  }

  if ('stats' in response) {
    return {
      id: response.id,
      chapterId: response.chapterId,
      titleEn: response.titleEn,
      titleFi: response.titleFi,
      descriptionEn: response.descriptionEn,
      descriptionFi: response.descriptionFi,
      passingScore: response.passingScore,
      isPublished: response.isPublished,
      questions: response.questions,
      latestAttempt: null,
      bestAttempt: null,
    };
  }

  return response;
};

const pendingQuizRequests = new Map<
  string,
  Promise<AdminChapterQuiz | LearnerChapterQuiz | null>
>();

const getQuizRequestKey = (
  courseId: string,
  chapterId: string,
  previewMode: boolean,
) => `${courseId}:${chapterId}:${previewMode ? 'preview' : 'live'}`;

const loadChapterQuizOnce = (
  courseId: string,
  chapterId: string,
  previewMode: boolean,
) => {
  const cacheKey = getQuizRequestKey(courseId, chapterId, previewMode);
  const existingRequest = pendingQuizRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = courseService
    .getChapterQuiz(courseId, chapterId, {
      preview: previewMode,
    })
    .finally(() => {
      pendingQuizRequests.delete(cacheKey);
    });

  pendingQuizRequests.set(cacheKey, request);
  return request;
};

export default function ChapterTrainingQuiz({
  activeLanguage,
  chapterId,
  courseId,
  passingScore,
  previewMode = false,
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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<QuizAttemptAnswerReview[]>([]);
  const passedSummaryMessage =
    submitMessage ??
    t('detail.quizPassedSummary', {
      defaultValue:
        'You already passed this training quiz. Start a new attempt whenever you want to practice again.',
    });
  const failedSummaryMessage =
    submitMessage ??
    t('detail.quizFailedSummary', {
      defaultValue:
        'Your latest result is saved. Review the explanations below, then retry whenever you want.',
    });
  const failedClosedSummaryMessage = t('detail.quizFailedClosedSummary', {
    defaultValue:
      'Your latest result is saved. Start a new attempt whenever you are ready.',
  });
  const latestScoreLabel = latestAttempt ? `${latestAttempt.score}%` : '-';
  const latestCorrectAnswersLabel = latestAttempt
    ? `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions}`
    : '-';
  const latestStatusLabel = latestAttempt?.passed
    ? t('detail.quizPassed', { defaultValue: 'Passed' })
    : t('detail.quizRetryAvailable', { defaultValue: 'Retry available' });

  useEffect(() => {
    let isActive = true;

    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await loadChapterQuizOnce(courseId, chapterId, previewMode);

        if (!isActive) {
          return;
        }

        const effectiveQuiz = previewMode
          ? toPreviewQuiz(response)
          : response && !('stats' in response)
            ? response
            : null;
        setQuiz(effectiveQuiz);
        setLatestAttempt(previewMode ? null : effectiveQuiz?.latestAttempt ?? null);
        setBestAttempt(previewMode ? null : effectiveQuiz?.bestAttempt ?? null);
        setSelectedAnswers({});
        setReviewAnswers([]);
        setIsQuizActive(previewMode || !Boolean(effectiveQuiz?.latestAttempt));
        setIsReviewMode(false);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(
          getApiErrorMessage(
            loadError,
            'Failed to load the training quiz.',
          ),
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadQuiz();

    return () => {
      isActive = false;
    };
  }, [chapterId, courseId, previewMode]);

  const answeredCount = useMemo(
    () =>
      Object.values(selectedAnswers).filter((currentAnswer) => currentAnswer.length > 0).length,
    [selectedAnswers],
  );
  const reviewAnswersByQuestionId = useMemo(
    () =>
      new Map(
        reviewAnswers.map((answer) => [answer.questionId, answer] as const),
      ),
    [reviewAnswers],
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

    if (previewMode) {
      const previewResult = evaluatePreviewAttempt(
        quiz.questions,
        selectedAnswers,
        quiz.passingScore,
      );

      setLatestAttempt(previewResult.attempt);
      setBestAttempt((previous) =>
        !previous || previewResult.attempt.score >= previous.score
          ? previewResult.attempt
          : previous,
      );
      setReviewAnswers(previewResult.answers);
      setSubmitError(null);
      setSubmitMessage(
        previewResult.attempt.passed
          ? t('detail.previewQuizPassedMessage', {
              defaultValue:
                'Preview complete. This attempt would pass for the learner, and nothing was saved.',
            })
          : t('detail.previewQuizFailedMessage', {
              defaultValue:
                'Preview complete. This attempt would not pass, and nothing was saved.',
            }),
      );
      setIsQuizActive(false);
      setIsReviewMode(true);
      window.requestAnimationFrame(() => {
        scrollQuizCardIntoView(quizCardRef.current);
      });
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
      setReviewAnswers(response.answers);
      setSubmitMessage(
        response.attempt.passed
          ? t('detail.quizPassedMessage', {
              defaultValue: 'Nice work. You passed this chapter training quiz.',
            })
          : t('detail.quizFailedMessage', {
              defaultValue: 'You can retry this training quiz as many times as you want.',
            }),
      );
      setIsQuizActive(false);
      setIsReviewMode(!response.attempt.passed);
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
    setReviewAnswers([]);
    if (previewMode) {
      setLatestAttempt(null);
    }
    setIsQuizActive(true);
    setIsReviewMode(false);
    window.requestAnimationFrame(() => {
      scrollQuizCardIntoView(quizCardRef.current);
    });
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

      {latestAttempt ? (
        <div className={styles.attemptSummaryCard}>
          <div className={styles.quizMeta}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.quizLatestScore', { defaultValue: 'Latest score' })}
              </span>
              <span className={styles.metaValue}>{latestScoreLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.quizCorrectAnswers', { defaultValue: 'Correct answers' })}
              </span>
              <span className={styles.metaValue}>{latestCorrectAnswersLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.quizStatus', { defaultValue: 'Quiz status' })}
              </span>
              <span className={styles.metaValue}>{latestStatusLabel}</span>
            </div>
          </div>

          {!isQuizActive && latestAttempt.passed ? (
            <p className={submitMessage ? styles.successText : styles.helperText}>
              {passedSummaryMessage}
            </p>
          ) : isReviewMode && !latestAttempt.passed ? (
            <p className={styles.helperText}>{failedSummaryMessage}</p>
          ) : !isQuizActive && !latestAttempt.passed ? (
            <p className={styles.helperText}>{failedClosedSummaryMessage}</p>
          ) : submitMessage ? (
            <p className={latestAttempt.passed ? styles.successText : styles.helperText}>
              {submitMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {previewMode ? (
        <p className={styles.helperText}>
          {t('detail.previewModeQuizDescription', {
            defaultValue:
              'Preview mode shows the learner-facing quiz layout without saving attempts.',
          })}
        </p>
      ) : null}

      {!previewMode && !isQuizActive && latestAttempt?.passed ? (
        <>
          <div className={`${styles.quizActions} ${styles.quizActionsEnd}`}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={startRetry}
            >
              {t('detail.quizStartRetry', { defaultValue: 'Retry quiz' })}
            </button>
          </div>
        </>
      ) : isReviewMode && latestAttempt ? (
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
                    const reviewAnswer = reviewAnswersByQuestionId.get(question.id);
                    const selectedOptionIds = reviewAnswer?.selectedOptionIds ?? [];
                    const correctOptionIds = reviewAnswer?.correctOptionIds ?? [];
                    const isSelected = selectedOptionIds.includes(option.id);
                    const isCorrectOption = correctOptionIds.includes(option.id);
                    const optionClassName = [
                      styles.optionLabel,
                      isCorrectOption ? styles.optionLabelCorrect : '',
                      isSelected && !isCorrectOption ? styles.optionLabelIncorrect : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <label key={option.id} className={optionClassName}>
                        <input
                          type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                          name={question.id}
                          checked={isSelected}
                          disabled
                          readOnly
                        />
                        <span>{getLocalizedValue(activeLanguage, option.labelEn, option.labelFi)}</span>
                      </label>
                    );
                  })}
                </div>

                <p className={styles.questionExplanation}>
                  {getLocalizedValue(activeLanguage, question.explanationEn, question.explanationFi)}
                </p>
              </article>
            ))}
          </div>

          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={`${styles.quizActions} ${styles.quizActionsEnd}`}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={startRetry}
            >
              {t('detail.quizStartRetry', { defaultValue: 'Retry quiz' })}
            </button>
          </div>
        </>
      ) : !previewMode && !isQuizActive && latestAttempt && !latestAttempt.passed ? (
        <>
          <div className={`${styles.quizActions} ${styles.quizActionsEnd}`}>
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

              </article>
            ))}
          </div>

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

