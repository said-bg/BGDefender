import { In } from 'typeorm';
import { Quiz } from '../../entities/quiz.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import type { UpsertChapterQuizDto } from '../dto/upsert-chapter-quiz.dto';
import type { QuizzesServiceDependencies } from './quizzes.service.dependencies';

export const upsertQuizDefinition = async (
  deps: QuizzesServiceDependencies,
  dto: UpsertChapterQuizDto,
  target: {
    scope: QuizScope;
    chapterId: string | null;
    courseId: string | null;
  },
): Promise<void> => {
  await deps.quizRepository.manager.transaction(async (manager) => {
    const quizRepository = manager.getRepository(Quiz);
    const questionRepository = manager.getRepository(QuizQuestion);
    const optionRepository = manager.getRepository(QuizOption);

    const existingQuiz = await quizRepository.findOne({
      where:
        target.scope === QuizScope.CHAPTER_TRAINING
          ? { scope: target.scope, chapterId: target.chapterId ?? undefined }
          : { scope: target.scope, courseId: target.courseId ?? undefined },
    });

    const quiz =
      existingQuiz ??
      quizRepository.create({
        scope: target.scope,
        chapterId: target.chapterId,
        courseId: target.courseId,
      });

    Object.assign(quiz, {
      titleEn: dto.titleEn,
      titleFi: dto.titleFi,
      descriptionEn: dto.descriptionEn ?? null,
      descriptionFi: dto.descriptionFi ?? null,
      passingScore: dto.passingScore,
      isPublished: dto.isPublished,
    });

    const savedQuiz = await quizRepository.save(quiz);
    const existingQuestions = await questionRepository.find({
      where: { quizId: savedQuiz.id },
    });

    if (existingQuestions.length > 0) {
      await optionRepository.delete({
        questionId: In(existingQuestions.map((question) => question.id)),
      });
      await questionRepository.delete({ quizId: savedQuiz.id });
    }

    for (const questionDto of dto.questions) {
      const savedQuestion = await questionRepository.save(
        questionRepository.create({
          quizId: savedQuiz.id,
          promptEn: questionDto.promptEn,
          promptFi: questionDto.promptFi,
          explanationEn: questionDto.explanationEn ?? null,
          explanationFi: questionDto.explanationFi ?? null,
          type: questionDto.type,
          orderIndex: questionDto.orderIndex,
        }),
      );

      await optionRepository.save(
        questionDto.options.map((optionDto) =>
          optionRepository.create({
            questionId: savedQuestion.id,
            labelEn: optionDto.labelEn,
            labelFi: optionDto.labelFi,
            isCorrect: optionDto.isCorrect,
            orderIndex: optionDto.orderIndex,
          }),
        ),
      );
    }
  });
};
