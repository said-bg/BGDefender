import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { SafeUser } from '../../auth/types/safe-user.type';
import type { AppLanguage } from '../../config/request-language';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { UserRole } from '../../entities/user.entity';
import type { SubmitChapterQuizAttemptDto } from '../dto/submit-chapter-quiz-attempt.dto';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';
import {
  getBestAttempt,
  getLatestAttempt,
  sortQuizTree,
  toAttemptView,
} from './quizzes.shared';
import type {
  QuizAttemptAnswerReviewView,
  SubmitQuizAttemptResult,
} from './quizzes.types';
import { evaluateQuizAttempt } from './quizzes.utils';

const buildAttemptResult = (
  attemptErrorMessage: string,
  persistedAttempt: {
    id: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passed: boolean;
    submittedAt: Date;
  },
  attempts: Array<{
    id: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passed: boolean;
    submittedAt: Date;
  }>,
  answers: QuizAttemptAnswerReviewView[],
): SubmitQuizAttemptResult => {
  const latestAttempt = getLatestAttempt(attempts);
  const bestAttempt = getBestAttempt(attempts);

  if (!latestAttempt || !bestAttempt) {
    throw new BadRequestException(attemptErrorMessage);
  }

  return {
    attempt: toAttemptView(persistedAttempt),
    latestAttempt: toAttemptView(latestAttempt),
    bestAttempt: toAttemptView(bestAttempt),
    answers,
  };
};

const saveAttemptAnswers = async (
  deps: QuizzesServiceDependencies,
  attemptId: string,
  answers: ReturnType<typeof evaluateQuizAttempt>['answers'],
): Promise<void> => {
  await deps.quizAttemptAnswerRepository.save(
    answers.map((answer) =>
      deps.quizAttemptAnswerRepository.create({
        attemptId,
        questionId: answer.questionId,
        questionType: answer.questionType,
        promptEn: answer.promptEn,
        promptFi: answer.promptFi,
        selectedOptionIds: answer.selectedOptionIds,
        correctOptionIds: answer.correctOptionIds,
        isCorrect: answer.isCorrect,
      }),
    ),
  );
};

export const submitChapterQuizAttempt = async (
  deps: QuizzesServiceDependencies,
  chapterId: string,
  userId: number,
  dto: SubmitChapterQuizAttemptDto,
  language: AppLanguage,
): Promise<SubmitQuizAttemptResult> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.CHAPTER_TRAINING, chapterId, isPublished: true },
    relations: { questions: { options: true } },
  });
  if (!quiz) {
    throw new NotFoundException(
      language === 'fi'
        ? 'Julkaistua harjoitusquizia ei loytynyt'
        : 'Published training quiz not found',
    );
  }

  const orderedQuiz = sortQuizTree(quiz);
  const evaluation = evaluateQuizAttempt(orderedQuiz.questions, dto.answers);
  const attempt = await deps.quizAttemptRepository.save(
    deps.quizAttemptRepository.create({
      quizId: orderedQuiz.id,
      userId,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      score: evaluation.score,
      passed: evaluation.score >= orderedQuiz.passingScore,
    }),
  );

  await saveAttemptAnswers(deps, attempt.id, evaluation.answers);

  const attempts = await deps.quizAttemptRepository.find({
    where: { quizId: orderedQuiz.id, userId },
    order: { submittedAt: 'DESC' },
  });

  return buildAttemptResult(
    'Quiz attempt persistence failed',
    attempt,
    attempts,
    evaluation.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      correctOptionIds: answer.correctOptionIds,
      isCorrect: answer.isCorrect,
    })),
  );
};

export const submitCourseFinalTestAttempt = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
  currentUser: SafeUser,
  dto: SubmitChapterQuizAttemptDto,
  language: AppLanguage,
): Promise<SubmitQuizAttemptResult> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.COURSE_FINAL, courseId, isPublished: true },
    relations: { questions: { options: true } },
  });
  if (!quiz) {
    throw new NotFoundException(
      language === 'fi'
        ? 'Julkaistua lopputestia ei loytynyt'
        : 'Published final test not found',
    );
  }

  if (currentUser.role !== UserRole.ADMIN) {
    const progress = await deps.progressRepository.findOne({
      where: { userId: currentUser.id, courseId },
    });

    if (!progress?.completed && (progress?.completionPercentage ?? 0) < 100) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Lopputesti avautuu vasta kun kurssi on suoritettu'
          : 'The final test unlocks only after the course is completed',
      );
    }
  }

  const orderedQuiz = sortQuizTree(quiz);
  const evaluation = evaluateQuizAttempt(orderedQuiz.questions, dto.answers);
  const attempt = await deps.quizAttemptRepository.save(
    deps.quizAttemptRepository.create({
      quizId: orderedQuiz.id,
      userId: currentUser.id,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      score: evaluation.score,
      passed: evaluation.score >= orderedQuiz.passingScore,
    }),
  );

  await saveAttemptAnswers(deps, attempt.id, evaluation.answers);

  const attempts = await deps.quizAttemptRepository.find({
    where: { quizId: orderedQuiz.id, userId: currentUser.id },
    order: { submittedAt: 'DESC' },
  });

  await deps.certificatesService.syncCourseCertificate(
    currentUser.id,
    courseId,
  );

  return buildAttemptResult(
    'Final test attempt persistence failed',
    attempt,
    attempts,
    evaluation.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      correctOptionIds: answer.correctOptionIds,
      isCorrect: answer.isCorrect,
    })),
  );
};
