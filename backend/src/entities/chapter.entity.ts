import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { SubChapter } from './sub-chapter.entity';
import { Quiz } from './quiz.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 200,
  })
  titleEn: string;

  @Column({
    type: 'varchar',
    length: 200,
  })
  titleFi: string;

  @Column({
    type: 'text',
  })
  descriptionEn: string;

  @Column({
    type: 'text',
  })
  descriptionFi: string;

  @Column({
    type: 'int',
  })
  orderIndex: number;

  @ManyToOne(() => Course, (course) => course.chapters, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  courseId: string;

  @OneToMany(() => SubChapter, (subChapter) => subChapter.chapter)
  subChapters: SubChapter[];

  @OneToOne(() => Quiz, (quiz) => quiz.chapter)
  trainingQuiz: Quiz | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
