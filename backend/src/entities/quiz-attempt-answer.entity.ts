import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuizAttempt } from './quiz-attempt.entity';
import { QuizQuestionType } from './quiz-question-type.enum';

@Entity('quiz_attempt_answers')
export class QuizAttemptAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  attemptId: string;

  @ManyToOne(() => QuizAttempt, (attempt) => attempt.answers, {
    onDelete: 'CASCADE',
  })
  attempt: QuizAttempt;

  @Column('uuid')
  questionId: string;

  @Column('enum', { enum: QuizQuestionType })
  questionType: QuizQuestionType;

  @Column('varchar', { length: 300 })
  promptEn: string;

  @Column('varchar', { length: 300 })
  promptFi: string;

  @Column('simple-json')
  selectedOptionIds: string[];

  @Column('simple-json')
  correctOptionIds: string[];

  @Column('boolean')
  isCorrect: boolean;
}
