import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseCollectionItem } from './course-collection-item.entity';

@Entity('course_collections')
export class CourseCollection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  titleEn!: string;

  @Column({ type: 'varchar', length: 200 })
  titleFi!: string;

  @Column({ type: 'text', nullable: true })
  descriptionEn!: string | null;

  @Column({ type: 'text', nullable: true })
  descriptionFi!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage!: string | null;

  @Column({ type: 'int', default: 1 })
  orderIndex!: number;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @OneToMany(() => CourseCollectionItem, (item) => item.collection, {
    cascade: true,
  })
  items!: CourseCollectionItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
