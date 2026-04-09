import { BadRequestException } from '@nestjs/common';
import { QuizQuestionType } from '../entities/quiz-question-type.enum';
import { SubmitQuizAnswerDto } from './dto/submit-chapter-quiz-attempt.dto';
import {
  UpsertChapterQuizDto,
  UpsertQuizQuestionDto,
} from './dto/upsert-chapter-quiz.dto';

type QuizOptionLike = {
  id: string;
  isCorrect: boolean;
};

type QuizQuestionLike = {
  id: string;
  promptEn: string;
  promptFi: string;
  type: QuizQuestionType;
  options: QuizOptionLike[];
};

export type QuizEvaluationAnswer = {
  questionId: string;
  questionType: QuizQuestionType;
  promptEn: string;
  promptFi: string;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
};

export type QuizEvaluationResult = {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  answers: QuizEvaluationAnswer[];
};

const asSortedUniqueIds = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));

const equalIdSets = (left: string[], right: string[]): boolean => {
  const normalizedLeft = asSortedUniqueIds(left);
  const normalizedRight = asSortedUniqueIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index],
  );
};

export const validateQuizPayload = (dto: UpsertChapterQuizDto): void => {
  dto.questions.forEach((question, index) => {
    validateQuizQuestion(question, index);
  });
};

const validateQuizQuestion = (
  question: UpsertQuizQuestionDto,
  index: number,
): void => {
  const correctOptionsCount = question.options.filter(
    (option) => option.isCorrect,
  ).length;

  if (correctOptionsCount === 0) {
    throw new BadRequestException(
      `Question ${index + 1} must define at least one correct answer`,
    );
  }

  if (
    question.type === QuizQuestionType.SINGLE_CHOICE &&
    correctOptionsCount !== 1
  ) {
    throw new BadRequestException(
      `Question ${index + 1} must define exactly one correct answer for single choice`,
    );
  }

  if (
    question.type === QuizQuestionType.MULTIPLE_CHOICE &&
    correctOptionsCount < 2
  ) {
    throw new BadRequestException(
      `Question ${index + 1} must define at least two correct answers for multiple choice`,
    );
  }
};

export const evaluateQuizAttempt = (
  questions: QuizQuestionLike[],
  submittedAnswers: SubmitQuizAnswerDto[],
): QuizEvaluationResult => {
  const submittedAnswerMap = new Map<string, string[]>();

  submittedAnswers.forEach((answer) => {
    if (submittedAnswerMap.has(answer.questionId)) {
      throw new BadRequestException('Each question can only be answered once');
    }

    submittedAnswerMap.set(
      answer.questionId,
      asSortedUniqueIds(answer.selectedOptionIds),
    );
  });

  questions.forEach((question) => {
    if (!question.options.length) {
      throw new BadRequestException(
        `Quiz question ${question.id} does not define any options`,
      );
    }
  });

  submittedAnswers.forEach((answer) => {
    const question = questions.find((item) => item.id === answer.questionId);

    if (!question) {
      throw new BadRequestException(
        'Quiz answer references an unknown question',
      );
    }

    const knownOptionIds = new Set(question.options.map((option) => option.id));
    const hasUnknownOption = answer.selectedOptionIds.some(
      (optionId) => !knownOptionIds.has(optionId),
    );

    if (hasUnknownOption) {
      throw new BadRequestException('Quiz answer references an unknown option');
    }
  });

  const answers = questions.map((question) => {
    const selectedOptionIds = submittedAnswerMap.get(question.id) ?? [];
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    const isCorrect = equalIdSets(selectedOptionIds, correctOptionIds);

    return {
      questionId: question.id,
      questionType: question.type,
      promptEn: question.promptEn,
      promptFi: question.promptFi,
      selectedOptionIds,
      correctOptionIds: asSortedUniqueIds(correctOptionIds),
      isCorrect,
    };
  });

  const totalQuestions = answers.length;
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
  const score =
    totalQuestions === 0
      ? 0
      : Math.round((correctAnswers / totalQuestions) * 100);

  return {
    totalQuestions,
    correctAnswers,
    score,
    answers,
  };
};
