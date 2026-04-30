import type {
  QuizAttemptAnswerReview,
  QuizAttemptSummary,
  QuizQuestion,
} from '@/services/course';

const normalizeIds = (value: string[]) => [...value].sort();

const areSelectionsEqual = (left: string[], right: string[]) => {
  const normalizedLeft = normalizeIds(left);
  const normalizedRight = normalizeIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
};

export const evaluatePreviewAttempt = (
  questions: QuizQuestion[],
  selectedAnswers: Record<string, string[]>,
  passingScore: number,
): {
  answers: QuizAttemptAnswerReview[];
  attempt: QuizAttemptSummary;
} => {
  const answers = questions.map<QuizAttemptAnswerReview>((question) => {
    const selectedOptionIds = selectedAnswers[question.id] ?? [];
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);

    return {
      questionId: question.id,
      selectedOptionIds,
      correctOptionIds,
      isCorrect: areSelectionsEqual(selectedOptionIds, correctOptionIds),
    };
  });

  const totalQuestions = questions.length;
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
  const score =
    totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);

  return {
    answers,
    attempt: {
      id: 'preview-attempt',
      totalQuestions,
      correctAnswers,
      score,
      passed: score >= passingScore,
      submittedAt: new Date().toISOString(),
    },
  };
};
