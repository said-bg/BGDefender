import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Author } from './author.entity';
import { Chapter } from './chapter.entity';
import { Quiz } from './quiz.entity';

export enum CourseLevel {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('courses')
export class Course {
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
    type: 'enum',
    enum: CourseLevel,
    default: CourseLevel.FREE,
  })
  level: CourseLevel;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @Column({
    type: 'int',
    nullable: true,
  })
  estimatedDuration: number | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  coverImage: string | null;

  @ManyToMany(() => Author)
  @JoinTable({
    name: 'course_authors',
    joinColumn: { name: 'courseId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'authorId', referencedColumnName: 'id' },
  })
  authors: Author[];

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @OneToMany(() => Quiz, (quiz) => quiz.course)
  finalTests: Quiz[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
