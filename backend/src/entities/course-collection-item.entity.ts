import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CourseCollection } from './course-collection.entity';
import { Course } from './course.entity';

@Entity('course_collection_items')
export class CourseCollectionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36 })
  collectionId!: string;

  @Column({ type: 'varchar', length: 36 })
  courseId!: string;

  @Column({ type: 'int', default: 1 })
  orderIndex!: number;

  @ManyToOne(() => CourseCollection, (collection) => collection.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collectionId' })
  collection!: CourseCollection;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;
}
