import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

export enum CertificateStatus {
  PENDING_PROFILE = 'PENDING_PROFILE',
  ISSUED = 'ISSUED',
}

@Entity('certificates')
@Index(['userId', 'courseId'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  userId!: number;

  @Column('uuid')
  courseId!: string;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.PENDING_PROFILE,
  })
  status!: CertificateStatus;

  @Column({ type: 'varchar', length: 40, unique: true })
  certificateCode!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstNameSnapshot!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastNameSnapshot!: string | null;

  @Column({ type: 'varchar', length: 220 })
  courseTitleEnSnapshot!: string;

  @Column({ type: 'varchar', length: 220 })
  courseTitleFiSnapshot!: string;

  @Column({ type: 'timestamp', nullable: true })
  issuedAt!: Date | null;

  @ManyToOne(() => User, {})
  user!: User;

  @ManyToOne(() => Course, {})
  course!: Course;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
