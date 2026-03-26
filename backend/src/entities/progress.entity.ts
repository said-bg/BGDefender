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

@Entity('progress')
@Index(['userId', 'courseId'], { unique: true })
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

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

  @ManyToOne(() => User, {})
  user: User;

  @ManyToOne(() => Course, {})
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
