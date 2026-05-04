'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import courseService, {
  AdminCourseFinalTest,
  LearnerCourseFinalTest,
  QuizAttemptAnswerReview,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/course';
import { getApiErrorMessage } from '@/utils/apiError';
import type { ActiveLanguage } from '../courseDetail.utils';
import { evaluatePreviewAttempt } from '../lib/courseAssessmentPreview.utils';
import styles from './ChapterTrainingQuiz.module.css';

type CourseFinalTestProps = {
  activeLanguage: ActiveLanguage;
  courseId: string;
  enabled: boolean;
  previewMode?: boolean;
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

const toPreviewFinalTest = (
  response: AdminCourseFinalTest | LearnerCourseFinalTest | null,
): LearnerCourseFinalTest | null => {
  if (!response) {
    return null;
  }

  if ('stats' in response) {
    return {
      id: response.id,
      courseId: response.courseId,
      titleEn: response.titleEn,
      titleFi: response.titleFi,
      descriptionEn: response.descriptionEn,
      descriptionFi: response.descriptionFi,
      passingScore: response.passingScore,
      isPublished: response.isPublished,
      isUnlocked: true,
      certificate: null,
      questions: response.questions,
      latestAttempt: null,
      bestAttempt: null,
    };
  }

  return {
    ...response,
    isUnlocked: true,
    latestAttempt: null,
    bestAttempt: null,
    certificate: null,
  };
};

export default function CourseFinalTest({
  activeLanguage,
  courseId,
  enabled,
  previewMode = false,
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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<QuizAttemptAnswerReview[]>([]);

  const loadFinalTest = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setFinalTest(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await courseService.getCourseFinalTest(courseId, {
        preview: previewMode,
      });
      const effectiveFinalTest = previewMode
        ? toPreviewFinalTest(response)
        : response && !('stats' in response)
          ? response
          : null;
      setFinalTest(effectiveFinalTest);
      setLatestAttempt(previewMode ? null : effectiveFinalTest?.latestAttempt ?? null);
      setBestAttempt(previewMode ? null : effectiveFinalTest?.bestAttempt ?? null);
      setSelectedAnswers({});
      setReviewAnswers([]);
      setIsStarted(
        previewMode ||
          Boolean(effectiveFinalTest?.isUnlocked && effectiveFinalTest.latestAttempt),
      );
      setIsReviewMode(
        Boolean(effectiveFinalTest?.isUnlocked && effectiveFinalTest.latestAttempt) && !previewMode,
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, t('detail.finalTestLoadFailed')));
    } finally {
      setLoading(false);
    }
  }, [courseId, enabled, previewMode, t]);

  useEffect(() => {
    void loadFinalTest();
  }, [loadFinalTest]);

  const certificateStatus = finalTest?.certificate?.status ?? null;
  const summaryMessage = latestAttempt
    ? latestAttempt.passed
      ? submitMessage
      : submitMessage ?? t('detail.finalTestFailedSummary')
    : null;
  const latestScoreLabel = latestAttempt ? `${latestAttempt.score}%` : '-';
  const latestCorrectAnswersLabel = latestAttempt
    ? `${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions}`
    : '-';
  const completionStatusLabel = latestAttempt?.passed
    ? t('detail.finalTestCourseCompleted')
    : t('detail.finalTestRetryNeeded');

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
  const isUnlockedForPreview = previewMode || finalTest?.isUnlocked;

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

  const startRetryAttempt = () => {
    setSelectedAnswers({});
    setSubmitError(null);
    setSubmitMessage(null);
    setReviewAnswers([]);
    if (previewMode) {
      setLatestAttempt(null);
    }
    setIsStarted(true);
    setIsReviewMode(false);
    window.requestAnimationFrame(() => {
      scrollFinalTestCardIntoView(finalTestCardRef.current);
    });
  };

  const handleSubmit = async () => {
    if (!finalTest || (!finalTest.isUnlocked && !previewMode)) {
      return;
    }

    if (previewMode) {
      const previewResult = evaluatePreviewAttempt(
        finalTest.questions,
        selectedAnswers,
        finalTest.passingScore,
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
          ? t('detail.previewFinalTestPassedMessage')
          : t('detail.previewFinalTestFailedMessage'),
      );
      setIsStarted(true);
      setIsReviewMode(true);
      window.requestAnimationFrame(() => {
        scrollFinalTestCardIntoView(finalTestCardRef.current);
      });
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
          ? t('detail.finalTestPassedMessage')
          : t('detail.finalTestFailedMessage'),
      );
      await loadFinalTest();
      window.requestAnimationFrame(() => {
        scrollFinalTestCardIntoView(finalTestCardRef.current);
      });
    } catch (submissionError) {
      setSubmitError(getApiErrorMessage(submissionError, t('detail.finalTestSubmitFailed')));
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
        {t('detail.finalTestLoading')}
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
              : isUnlockedForPreview
                ? styles.statusFailed
                : styles.statusPending
          }`}
        >
          {latestAttempt
            ? latestAttempt.passed
              ? t('detail.finalTestPassed')
              : t('detail.finalTestNotPassed')
            : isUnlockedForPreview
              ? t('detail.finalTest')
              : t('detail.finalTestLocked')}
        </span>
      </div>

      <div className={styles.quizMeta}>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestPassingScore')}
          </span>
          <span className={styles.metaValue}>{finalTest.passingScore}%</span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestAnswered')}
          </span>
          <span className={styles.metaValue}>
            {answeredCount}/{finalTest.questions.length}
          </span>
        </div>
        <div className={styles.metaCard}>
          <span className={styles.metaLabel}>
            {t('detail.finalTestBestScore')}
          </span>
          <span className={styles.metaValue}>{bestAttempt?.score ?? '-'}</span>
        </div>
      </div>

      {latestAttempt ? (
        <div className={styles.attemptSummaryCard}>
          <div className={styles.quizMeta}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestLatestScore')}
              </span>
              <span className={styles.metaValue}>{latestScoreLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestCorrectAnswers')}
              </span>
              <span className={styles.metaValue}>{latestCorrectAnswersLabel}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>
                {t('detail.finalTestCourseStatus')}
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
                {t('detail.certificatePendingTitle')}
              </p>
              <p className={styles.helperText}>
                {t('detail.certificatePendingDescription')}
              </p>
              <div className={styles.quizActions}>
                <Link href="/account" className={styles.secondaryAction}>
                  {t('detail.completeProfile')}
                </Link>
              </div>
            </div>
          ) : null}

          {certificateStatus === 'issued' ? (
            <div className={styles.questionCard}>
              <p className={styles.questionPrompt}>
                {t('detail.certificateIssuedTitle')}
              </p>
              <p className={styles.helperText}>
                {t('detail.certificateIssuedDescription')}
              </p>
              <div className={styles.quizActions}>
                <Link href="/certificates" className={styles.secondaryAction}>
                  {t('detail.viewCertificate')}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {previewMode ? (
        <p className={styles.helperText}>
          {t('detail.previewModeFinalTestDescription')}
        </p>
      ) : null}

      {previewMode && isReviewMode && latestAttempt ? (
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
                        <span>
                          {getLocalizedValue(activeLanguage, option.labelEn, option.labelFi)}
                        </span>
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

          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={startRetryAttempt}
            >
              {t('detail.finalTestStartRetry')}
            </button>
          </div>
        </>
      ) : previewMode ? (
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
              </article>
            ))}
          </div>

          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? t('detail.finalTestSubmitting')
                : t('detail.finalTestSubmit')}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setSelectedAnswers({})}
            >
              {t('detail.finalTestRetry')}
            </button>
          </div>
        </>
      ) : !finalTest.isUnlocked ? (
        <p className={styles.helperText}>
          {t('detail.finalTestLockedDescription')}
        </p>
      ) : !isStarted ? (
        <>
          <p className={styles.helperText}>
            {t('detail.finalTestUnlockedDescription')}
          </p>
          <div className={styles.quizActions}>
            {previewMode ? null : (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={startRetryAttempt}
              >
                {latestAttempt
                  ? t('detail.finalTestContinue')
                  : t('detail.finalTestStart')}
              </button>
            )}
          </div>
        </>
      ) : !previewMode && isReviewMode && latestAttempt ? (
        <>
          {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

          <div className={styles.quizActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={startRetryAttempt}
            >
              {t('detail.finalTestStartRetry')}
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
                ? t('detail.finalTestSubmitting')
                : t('detail.finalTestSubmit')}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setSelectedAnswers({})}
            >
              {t('detail.finalTestRetry')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

