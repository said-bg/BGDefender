import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ResourceType {
  FILE = 'FILE',
  LINK = 'LINK',
}

export enum ResourceSource {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: ResourceType })
  type!: ResourceType;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  fileUrl!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  linkUrl!: string | null;

  @Column({ type: 'enum', enum: ResourceSource })
  source!: ResourceSource;

  @Column({ type: 'int' })
  assignedUserId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser!: User;

  @Column({ type: 'int', nullable: true })
  createdByUserId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
