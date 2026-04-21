import { NotFoundException } from '@nestjs/common';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';
import type { QuizAttemptView } from './quizzes.types';

type AttemptViewSource = Pick<
  QuizAttempt,
  | 'id'
  | 'totalQuestions'
  | 'correctAnswers'
  | 'score'
  | 'passed'
  | 'submittedAt'
>;

export const sortQuizTree = (quiz: Quiz): Quiz => ({
  ...quiz,
  questions: [...(quiz.questions ?? [])]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((question) => ({
      ...question,
      options: [...(question.options ?? [])].sort(
        (left, right) => left.orderIndex - right.orderIndex,
      ),
    })),
});

export const toAttemptView = (attempt: AttemptViewSource): QuizAttemptView => ({
  id: attempt.id,
  totalQuestions: attempt.totalQuestions,
  correctAnswers: attempt.correctAnswers,
  score: attempt.score,
  passed: attempt.passed,
  submittedAt: attempt.submittedAt,
});

export const getLatestAttempt = <T>(attempts: T[]): T | null =>
  attempts[0] ?? null;

export const getBestAttempt = <T extends { score: number }>(
  attempts: T[],
): T | null =>
  attempts.reduce<T | null>((best, current) => {
    if (!best) {
      return current;
    }

    return current.score > best.score ? current : best;
  }, null);

export const findChapterOrFail = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
  chapterId: string,
): Promise<Chapter> => {
  const chapter = await deps.chapterRepository.findOne({
    where: { id: chapterId, courseId },
  });

  if (!chapter) {
    throw new NotFoundException(
      `Chapter with ID ${chapterId} not found in course ${courseId}`,
    );
  }

  return chapter;
};

export const findCourseOrFail = async (
  deps: QuizzesServiceDependencies,
  courseId: string,
): Promise<Course> => {
  const course = await deps.courseRepository.findOne({
    where: { id: courseId },
  });

  if (!course) {
    throw new NotFoundException(`Course with ID ${courseId} not found`);
  }

  return course;
};
