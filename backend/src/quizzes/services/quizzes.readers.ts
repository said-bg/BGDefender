import { QuizScope } from '../../entities/quiz-scope.enum';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';
import {
  getBestAttempt,
  getLatestAttempt,
  sortQuizTree,
  toAttemptView,
} from './quizzes.shared';
import type {
  AdminFinalTestAnalyticsView,
  AdminQuizAnalyticsView,
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

export const getChapterQuizAnalyticsForAdmin = async (
  deps: QuizzesServiceDependencies,
  chapterId: string,
): Promise<AdminQuizAnalyticsView | null> => {
  const analytics = await getQuizAnalyticsForAdmin(deps, {
    scope: QuizScope.CHAPTER_TRAINING,
    chapterId,
  });
  if (!analytics) return null;

  return {
    quizId: analytics.quizId,
    chapterId,
    summary: analytics.summary,
    learners: analytics.learners,
  };
};

export const getCourseFinalTestAnalyticsForAdmin = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
): Promise<AdminFinalTestAnalyticsView | null> => {
  const analytics = await getQuizAnalyticsForAdmin(deps, {
    scope: QuizScope.COURSE_FINAL,
    courseId,
  });
  if (!analytics) return null;

  return {
    quizId: analytics.quizId,
    courseId,
    summary: analytics.summary,
    learners: analytics.learners,
  };
};

const getQuizAnalyticsForAdmin = async (
  deps: QuizzesServiceDependencies,
  target:
    | { scope: QuizScope.CHAPTER_TRAINING; chapterId: string }
    | { scope: QuizScope.COURSE_FINAL; courseId: string },
): Promise<
  | {
      quizId: string;
      summary: AdminQuizAnalyticsView['summary'];
      learners: AdminQuizAnalyticsView['learners'];
    }
  | null
> => {
  const quiz = await deps.quizRepository.findOne({
    where:
      target.scope === QuizScope.CHAPTER_TRAINING
        ? { scope: QuizScope.CHAPTER_TRAINING, chapterId: target.chapterId }
        : { scope: QuizScope.COURSE_FINAL, courseId: target.courseId },
  });
  if (!quiz) return null;

  const attempts = await deps.quizAttemptRepository.find({
    where: { quizId: quiz.id },
    relations: { user: true },
    order: { submittedAt: 'DESC' },
  });

  const learnerMap = new Map<number, AdminQuizAnalyticsView['learners'][number]>();

  for (const attempt of attempts) {
    const existingLearner = learnerMap.get(attempt.userId);

    if (!existingLearner) {
      learnerMap.set(attempt.userId, {
        userId: attempt.userId,
        email: attempt.user?.email ?? '',
        firstName: attempt.user?.firstName ?? null,
        lastName: attempt.user?.lastName ?? null,
        attemptCount: 1,
        latestScore: attempt.score,
        bestScore: attempt.score,
        hasPassed: attempt.passed,
        latestAttemptAt: attempt.submittedAt,
      });
      continue;
    }

    existingLearner.attemptCount += 1;
    existingLearner.bestScore = Math.max(existingLearner.bestScore, attempt.score);
    existingLearner.hasPassed = existingLearner.hasPassed || attempt.passed;

    if (attempt.submittedAt > existingLearner.latestAttemptAt) {
      existingLearner.latestAttemptAt = attempt.submittedAt;
      existingLearner.latestScore = attempt.score;
    }
  }

  const learners = [...learnerMap.values()].sort((left, right) => {
    const latestAttemptDiff =
      right.latestAttemptAt.getTime() - left.latestAttemptAt.getTime();
    if (latestAttemptDiff !== 0) {
      return latestAttemptDiff;
    }

    const attemptCountDiff = right.attemptCount - left.attemptCount;
    if (attemptCountDiff !== 0) {
      return attemptCountDiff;
    }

    return left.email.localeCompare(right.email);
  });

  const passedAttempts = attempts.filter((attempt) => attempt.passed).length;

  return {
    quizId: quiz.id,
    summary: {
      learnerCount: learners.length,
      attemptCount: attempts.length,
      latestAttemptAt: attempts[0]?.submittedAt ?? null,
      bestScore:
        attempts.length > 0
          ? Math.max(...attempts.map((attempt) => attempt.score))
          : null,
      averageScore:
        attempts.length > 0
          ? Math.round(
              attempts.reduce((total, attempt) => total + attempt.score, 0) /
                attempts.length,
            )
          : null,
      passRate:
        attempts.length > 0
          ? Math.round((passedAttempts / attempts.length) * 100)
          : null,
    },
    learners,
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
