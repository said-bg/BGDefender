import type {
  AdminQuizQuestionView,
  LearnerQuizQuestionView,
} from './quizzes.types';

export const toAdminQuestionView = (question: {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string | null;
  explanationFi: string | null;
  type: string;
  orderIndex: number;
  options: Array<{
    id: string;
    labelEn: string;
    labelFi: string;
    orderIndex: number;
    isCorrect: boolean;
  }>;
}): AdminQuizQuestionView => ({
  id: question.id,
  promptEn: question.promptEn,
  promptFi: question.promptFi,
  explanationEn: question.explanationEn,
  explanationFi: question.explanationFi,
  type: question.type,
  orderIndex: question.orderIndex,
  options: question.options.map((option) => ({
    id: option.id,
    labelEn: option.labelEn,
    labelFi: option.labelFi,
    orderIndex: option.orderIndex,
    isCorrect: option.isCorrect,
  })),
});

export const toLearnerQuestionView = (question: {
  id: string;
  promptEn: string;
  promptFi: string;
  explanationEn: string | null;
  explanationFi: string | null;
  type: string;
  orderIndex: number;
  options: Array<{
    id: string;
    labelEn: string;
    labelFi: string;
    orderIndex: number;
  }>;
}): LearnerQuizQuestionView => ({
  id: question.id,
  promptEn: question.promptEn,
  promptFi: question.promptFi,
  explanationEn: question.explanationEn,
  explanationFi: question.explanationFi,
  type: question.type,
  orderIndex: question.orderIndex,
  options: question.options.map((option) => ({
    id: option.id,
    labelEn: option.labelEn,
    labelFi: option.labelFi,
    orderIndex: option.orderIndex,
  })),
});

export const buildQuizStats = (
  attempts: Array<{ score: number; submittedAt: Date }>,
) => ({
  attemptCount: attempts.length,
  latestAttemptAt:
    attempts.length > 0
      ? attempts
          .map((attempt) => attempt.submittedAt)
          .sort((left, right) => right.getTime() - left.getTime())[0]
      : null,
  bestScore:
    attempts.length > 0
      ? Math.max(...attempts.map((attempt) => attempt.score))
      : null,
});
