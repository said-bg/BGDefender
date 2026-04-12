import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  COURSE_PUBLISHED = 'course_published',
  RESOURCE_SHARED = 'resource_shared',
  CERTIFICATE_AVAILABLE = 'certificate_available',
  COMPLETE_PROFILE_FOR_CERTIFICATE = 'complete_profile_for_certificate',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  userId!: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  courseId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  courseTitleEnSnapshot!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  courseTitleFiSnapshot!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceTitleSnapshot!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link!: string | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
