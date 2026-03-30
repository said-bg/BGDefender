import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  CREATOR = 'CREATOR',
  ADMIN = 'ADMIN',
}

export enum UserPlan {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  occupation!: string | null;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan!: UserPlan;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
