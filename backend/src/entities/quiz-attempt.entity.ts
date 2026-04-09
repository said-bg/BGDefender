import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from './user.entity';
import { QuizAttemptAnswer } from './quiz-attempt-answer.entity';

@Entity('quiz_attempts')
@Index(['quizId', 'userId'])
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;

  @Column('int')
  userId: number;

  @ManyToOne(() => User, {})
  user: User;

  @Column('int')
  totalQuestions: number;

  @Column('int')
  correctAnswers: number;

  @Column('int')
  score: number;

  @Column('boolean')
  passed: boolean;

  @OneToMany(() => QuizAttemptAnswer, (answer) => answer.attempt)
  answers: QuizAttemptAnswer[];

  @CreateDateColumn()
  submittedAt: Date;
}
