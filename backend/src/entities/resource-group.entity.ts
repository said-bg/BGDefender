import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ResourceGroupMember } from './resource-group-member.entity';
import { Resource } from './resource.entity';

@Entity('resource_groups')
export class ResourceGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', nullable: true })
  createdByUserId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser!: User | null;

  @OneToMany(() => ResourceGroupMember, (member) => member.group)
  members!: ResourceGroupMember[];

  @OneToMany(() => Resource, (resource) => resource.assignedGroup)
  resources!: Resource[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
