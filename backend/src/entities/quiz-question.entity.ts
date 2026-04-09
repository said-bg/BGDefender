import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { QuizOption } from './quiz-option.entity';
import { QuizQuestionType } from './quiz-question-type.enum';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;

  @Column('varchar', { length: 300 })
  promptEn: string;

  @Column('varchar', { length: 300 })
  promptFi: string;

  @Column('text', { nullable: true })
  explanationEn: string | null;

  @Column('text', { nullable: true })
  explanationFi: string | null;

  @Column('enum', { enum: QuizQuestionType })
  type: QuizQuestionType;

  @Column('int')
  orderIndex: number;

  @OneToMany(() => QuizOption, (option) => option.question)
  options: QuizOption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
