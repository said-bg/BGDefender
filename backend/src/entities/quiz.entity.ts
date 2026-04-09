import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { Course } from './course.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { QuizScope } from './quiz-scope.enum';

@Entity('quizzes')
@Index(['scope', 'chapterId'], { unique: true })
@Index(['scope', 'courseId'], { unique: true })
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 200 })
  titleEn: string;

  @Column('varchar', { length: 200 })
  titleFi: string;

  @Column('text', { nullable: true })
  descriptionEn: string | null;

  @Column('text', { nullable: true })
  descriptionFi: string | null;

  @Column('int', { default: 70 })
  passingScore: number;

  @Column('boolean', { default: false })
  isPublished: boolean;

  @Column({
    type: 'enum',
    enum: QuizScope,
    default: QuizScope.CHAPTER_TRAINING,
  })
  scope: QuizScope;

  @Column('uuid', { nullable: true })
  chapterId: string | null;

  @Column('uuid', { nullable: true })
  courseId: string | null;

  @OneToOne(() => Chapter, (chapter) => chapter.trainingQuiz, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapterId' })
  chapter: Chapter | null;

  @ManyToOne(() => Course, (course) => course.finalTests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course | null;

  @OneToMany(() => QuizQuestion, (question) => question.quiz)
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
