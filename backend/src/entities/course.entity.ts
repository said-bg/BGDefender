import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Author } from './author.entity';
import { CertificateSigner } from './certificate-signer.entity';
import { Chapter } from './chapter.entity';
import { Quiz } from './quiz.entity';

export enum CourseLevel {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 220,
    unique: true,
    nullable: true,
  })
  slugEn: string | null;

  @Column({
    type: 'varchar',
    length: 220,
    unique: true,
    nullable: true,
  })
  slugFi: string | null;

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

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
  })
  programDirectorId: string | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  ownerUserId: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  createdByUserId: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  lastEditedByUserId: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  publishedByUserId: number | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  publishedAt: Date | null;

  @ManyToMany(() => Author)
  @JoinTable({
    name: 'course_authors',
    joinColumn: { name: 'courseId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'authorId', referencedColumnName: 'id' },
  })
  authors: Author[];

  @ManyToOne(
    () => CertificateSigner,
    (certificateSigner) => certificateSigner.managedCourses,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'programDirectorId' })
  programDirector: CertificateSigner | null;

  @OneToMany(() => Chapter, (chapter) => chapter.course)
  chapters: Chapter[];

  @OneToMany(() => Quiz, (quiz) => quiz.course)
  finalTests: Quiz[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
