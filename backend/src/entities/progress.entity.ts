import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

export enum ProgressViewType {
  OVERVIEW = 'overview',
  CHAPTER = 'chapter',
  SUBCHAPTER = 'subchapter',
}

@Entity('progress')
@Index(['userId', 'courseId'], { unique: true })
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  userId: number;

  @Column('uuid')
  courseId: string;

  @Column('int', { default: 0 })
  completionPercentage: number;

  @Column('boolean', { default: false })
  completed: boolean;

  @Column('timestamp', { nullable: true })
  completedAt: Date | null;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  lastAccessedAt: Date;

  // Keep the last visible step so the user can resume the course later.
  @Column({
    type: 'enum',
    enum: ProgressViewType,
    nullable: true,
  })
  lastViewedType: ProgressViewType | null;

  @Column('uuid', { nullable: true })
  lastChapterId: string | null;

  @Column('uuid', { nullable: true })
  lastSubChapterId: string | null;

  @ManyToOne(() => User, {})
  user: User;

  @ManyToOne(() => Course, {})
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
