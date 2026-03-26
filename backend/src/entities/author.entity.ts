import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  roleEn: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  roleFi: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  biographyEn: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  biographyFi: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  photo: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
