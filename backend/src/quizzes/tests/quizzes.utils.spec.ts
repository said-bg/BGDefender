import { BadRequestException } from '@nestjs/common';
import { QuizQuestionType } from '../../entities/quiz-question-type.enum';
import {
  evaluateQuizAttempt,
  validateQuizPayload,
} from '../services/quizzes.utils';

describe('quizzes.utils', () => {
  describe('validateQuizPayload', () => {
    it('accepts a mixed single and multiple choice quiz payload', () => {
      expect(() =>
        validateQuizPayload({
          titleEn: 'Quiz',
          titleFi: 'Quiz',
          descriptionEn: null,
          descriptionFi: null,
          passingScore: 70,
          isPublished: true,
          questions: [
            {
              promptEn: 'Question 1',
              promptFi: 'Question 1',
              explanationEn: null,
              explanationFi: null,
              type: QuizQuestionType.SINGLE_CHOICE,
              orderIndex: 1,
              options: [
                {
                  labelEn: 'A',
                  labelFi: 'A',
                  orderIndex: 1,
                  isCorrect: true,
                },
                {
                  labelEn: 'B',
                  labelFi: 'B',
                  orderIndex: 2,
                  isCorrect: false,
                },
              ],
            },
            {
              promptEn: 'Question 2',
              promptFi: 'Question 2',
              explanationEn: null,
              explanationFi: null,
              type: QuizQuestionType.MULTIPLE_CHOICE,
              orderIndex: 2,
              options: [
                {
                  labelEn: 'A',
                  labelFi: 'A',
                  orderIndex: 1,
                  isCorrect: true,
                },
                {
                  labelEn: 'B',
                  labelFi: 'B',
                  orderIndex: 2,
                  isCorrect: true,
                },
                {
                  labelEn: 'C',
                  labelFi: 'C',
                  orderIndex: 3,
                  isCorrect: false,
                },
              ],
            },
          ],
        }),
      ).not.toThrow();
    });

    it('rejects a multiple choice question with only one correct answer', () => {
      expect(() =>
        validateQuizPayload({
          titleEn: 'Quiz',
          titleFi: 'Quiz',
          descriptionEn: null,
          descriptionFi: null,
          passingScore: 70,
          isPublished: false,
          questions: [
            {
              promptEn: 'Question 1',
              promptFi: 'Question 1',
              explanationEn: null,
              explanationFi: null,
              type: QuizQuestionType.MULTIPLE_CHOICE,
              orderIndex: 1,
              options: [
                {
                  labelEn: 'A',
                  labelFi: 'A',
                  orderIndex: 1,
                  isCorrect: true,
                },
                {
                  labelEn: 'B',
                  labelFi: 'B',
                  orderIndex: 2,
                  isCorrect: false,
                },
              ],
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects a single choice question with multiple correct answers', () => {
      expect(() =>
        validateQuizPayload({
          titleEn: 'Quiz',
          titleFi: 'Quiz',
          descriptionEn: null,
          descriptionFi: null,
          passingScore: 70,
          isPublished: false,
          questions: [
            {
              promptEn: 'Question 1',
              promptFi: 'Question 1',
              explanationEn: null,
              explanationFi: null,
              type: QuizQuestionType.SINGLE_CHOICE,
              orderIndex: 1,
              options: [
                {
                  labelEn: 'A',
                  labelFi: 'A',
                  orderIndex: 1,
                  isCorrect: true,
                },
                {
                  labelEn: 'B',
                  labelFi: 'B',
                  orderIndex: 2,
                  isCorrect: true,
                },
              ],
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects a question without any correct answer', () => {
      expect(() =>
        validateQuizPayload({
          titleEn: 'Quiz',
          titleFi: 'Quiz',
          descriptionEn: null,
          descriptionFi: null,
          passingScore: 70,
          isPublished: false,
          questions: [
            {
              promptEn: 'Question 1',
              promptFi: 'Question 1',
              explanationEn: null,
              explanationFi: null,
              type: QuizQuestionType.SINGLE_CHOICE,
              orderIndex: 1,
              options: [
                {
                  labelEn: 'A',
                  labelFi: 'A',
                  orderIndex: 1,
                  isCorrect: false,
                },
                {
                  labelEn: 'B',
                  labelFi: 'B',
                  orderIndex: 2,
                  isCorrect: false,
                },
              ],
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('evaluateQuizAttempt', () => {
    const questions = [
      {
        id: 'question-1',
        promptEn: 'Single',
        promptFi: 'Single',
        type: QuizQuestionType.SINGLE_CHOICE,
        options: [
          { id: 'option-1a', isCorrect: true },
          { id: 'option-1b', isCorrect: false },
        ],
      },
      {
        id: 'question-2',
        promptEn: 'Multiple',
        promptFi: 'Multiple',
        type: QuizQuestionType.MULTIPLE_CHOICE,
        options: [
          { id: 'option-2a', isCorrect: true },
          { id: 'option-2b', isCorrect: true },
          { id: 'option-2c', isCorrect: false },
        ],
      },
    ];

    it('scores the attempt by exact answer set match', () => {
      const result = evaluateQuizAttempt(questions, [
        {
          questionId: 'question-1',
          selectedOptionIds: ['option-1a'],
        },
        {
          questionId: 'question-2',
          selectedOptionIds: ['option-2a', 'option-2b'],
        },
      ]);

      expect(result.totalQuestions).toBe(2);
      expect(result.correctAnswers).toBe(2);
      expect(result.score).toBe(100);
      expect(result.answers.every((answer) => answer.isCorrect)).toBe(true);
    });

    it('marks partial multiple choice selections as incorrect', () => {
      const result = evaluateQuizAttempt(questions, [
        {
          questionId: 'question-1',
          selectedOptionIds: ['option-1a'],
        },
        {
          questionId: 'question-2',
          selectedOptionIds: ['option-2a'],
        },
      ]);

      expect(result.correctAnswers).toBe(1);
      expect(result.score).toBe(50);
      expect(result.answers[1]?.isCorrect).toBe(false);
    });

    it('rejects an unknown option id', () => {
      expect(() =>
        evaluateQuizAttempt(questions, [
          {
            questionId: 'question-1',
            selectedOptionIds: ['missing-option'],
          },
        ]),
      ).toThrow(BadRequestException);
    });

    it('rejects duplicate submitted answers for the same question', () => {
      expect(() =>
        evaluateQuizAttempt(questions, [
          {
            questionId: 'question-1',
            selectedOptionIds: ['option-1a'],
          },
          {
            questionId: 'question-1',
            selectedOptionIds: ['option-1b'],
          },
        ]),
      ).toThrow(BadRequestException);
    });

    it('rejects a submitted answer that references an unknown question', () => {
      expect(() =>
        evaluateQuizAttempt(questions, [
          {
            questionId: 'missing-question',
            selectedOptionIds: ['option-1a'],
          },
        ]),
      ).toThrow(BadRequestException);
    });

    it('rejects quiz questions that do not define any options', () => {
      expect(() =>
        evaluateQuizAttempt(
          [
            {
              id: 'question-1',
              promptEn: 'Broken',
              promptFi: 'Broken',
              type: QuizQuestionType.SINGLE_CHOICE,
              options: [],
            },
          ],
          [],
        ),
      ).toThrow(BadRequestException);
    });
  });
});
