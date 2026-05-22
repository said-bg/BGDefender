import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';

export enum CertificateSignerRole {
  DIRECTOR = 'director',
  PROGRAM_DIRECTOR = 'program_director',
}

@Entity('certificate_signers')
export class CertificateSigner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  fullName!: string;

  @Column({
    type: 'enum',
    enum: CertificateSignerRole,
  })
  role!: CertificateSignerRole;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'longtext' })
  signatureData!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Course, (course) => course.programDirector)
  managedCourses!: Course[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
