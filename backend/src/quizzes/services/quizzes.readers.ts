import { QuizScope } from '../../entities/quiz-scope.enum';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';
import {
  getBestAttempt,
  getLatestAttempt,
  sortQuizTree,
  toAttemptView,
} from './quizzes.shared';
import type {
  AdminFinalTestView,
  AdminQuizView,
  LearnerFinalTestView,
  LearnerQuizView,
} from './quizzes.types';
import {
  buildQuizStats,
  toAdminQuestionView,
  toLearnerQuestionView,
} from './quizzes.view-mappers';

export const getChapterQuizForAdmin = async (
  deps: QuizzesServiceDependencies,
  chapterId: string,
): Promise<AdminQuizView | null> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.CHAPTER_TRAINING, chapterId },
    relations: { questions: { options: true }, attempts: true },
  });
  if (!quiz) return null;

  const orderedQuiz = sortQuizTree(quiz);
  const attempts = orderedQuiz.attempts ?? [];

  return {
    id: orderedQuiz.id,
    chapterId: orderedQuiz.chapterId ?? chapterId,
    titleEn: orderedQuiz.titleEn,
    titleFi: orderedQuiz.titleFi,
    descriptionEn: orderedQuiz.descriptionEn,
    descriptionFi: orderedQuiz.descriptionFi,
    passingScore: orderedQuiz.passingScore,
    isPublished: orderedQuiz.isPublished,
    questions: orderedQuiz.questions.map(toAdminQuestionView),
    stats: buildQuizStats(attempts),
  };
};

export const getCourseFinalTestForAdmin = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
): Promise<AdminFinalTestView | null> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.COURSE_FINAL, courseId },
    relations: { questions: { options: true }, attempts: true },
  });
  if (!quiz) return null;

  const orderedQuiz = sortQuizTree(quiz);
  const attempts = orderedQuiz.attempts ?? [];

  return {
    id: orderedQuiz.id,
    courseId,
    titleEn: orderedQuiz.titleEn,
    titleFi: orderedQuiz.titleFi,
    descriptionEn: orderedQuiz.descriptionEn,
    descriptionFi: orderedQuiz.descriptionFi,
    passingScore: orderedQuiz.passingScore,
    isPublished: orderedQuiz.isPublished,
    questions: orderedQuiz.questions.map(toAdminQuestionView),
    stats: buildQuizStats(attempts),
  };
};

export const getChapterQuizForLearner = async (
  deps: QuizzesServiceDependencies,
  chapterId: string,
  userId: number,
): Promise<LearnerQuizView | null> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.CHAPTER_TRAINING, chapterId, isPublished: true },
    relations: { questions: { options: true } },
  });
  if (!quiz) return null;

  const attempts = await deps.quizAttemptRepository.find({
    where: { quizId: quiz.id, userId },
    order: { submittedAt: 'DESC' },
  });
  const orderedQuiz = sortQuizTree(quiz);
  const latestAttempt = getLatestAttempt(attempts);
  const bestAttempt = getBestAttempt(attempts);

  return {
    id: orderedQuiz.id,
    chapterId: orderedQuiz.chapterId ?? chapterId,
    titleEn: orderedQuiz.titleEn,
    titleFi: orderedQuiz.titleFi,
    descriptionEn: orderedQuiz.descriptionEn,
    descriptionFi: orderedQuiz.descriptionFi,
    passingScore: orderedQuiz.passingScore,
    isPublished: orderedQuiz.isPublished,
    questions: orderedQuiz.questions.map(toLearnerQuestionView),
    latestAttempt: latestAttempt ? toAttemptView(latestAttempt) : null,
    bestAttempt: bestAttempt ? toAttemptView(bestAttempt) : null,
  };
};

export const getCourseFinalTestForLearner = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
  userId: number,
): Promise<LearnerFinalTestView | null> => {
  const quiz = await deps.quizRepository.findOne({
    where: { scope: QuizScope.COURSE_FINAL, courseId, isPublished: true },
    relations: { questions: { options: true } },
  });
  if (!quiz) return null;

  const [attempts, progress] = await Promise.all([
    deps.quizAttemptRepository.find({
      where: { quizId: quiz.id, userId },
      order: { submittedAt: 'DESC' },
    }),
    deps.progressRepository.findOne({ where: { userId, courseId } }),
  ]);

  if (attempts.some((attempt) => attempt.passed)) {
    await deps.certificatesService.syncCourseCertificate(userId, courseId);
  }

  const certificate = await deps.certificatesService.getCourseCertificateStatus(
    userId,
    courseId,
  );
  const orderedQuiz = sortQuizTree(quiz);
  const latestAttempt = getLatestAttempt(attempts);
  const bestAttempt = getBestAttempt(attempts);

  return {
    id: orderedQuiz.id,
    courseId,
    titleEn: orderedQuiz.titleEn,
    titleFi: orderedQuiz.titleFi,
    descriptionEn: orderedQuiz.descriptionEn,
    descriptionFi: orderedQuiz.descriptionFi,
    passingScore: orderedQuiz.passingScore,
    isPublished: orderedQuiz.isPublished,
    isUnlocked: Boolean(
      progress?.completed || (progress?.completionPercentage ?? 0) >= 100,
    ),
    certificate,
    questions: orderedQuiz.questions.map(toLearnerQuestionView),
    latestAttempt: latestAttempt ? toAttemptView(latestAttempt) : null,
    bestAttempt: bestAttempt ? toAttemptView(bestAttempt) : null,
  };
};
