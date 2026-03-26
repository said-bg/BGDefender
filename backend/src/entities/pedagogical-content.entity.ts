import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubChapter } from './sub-chapter.entity';
import { ContentType } from './content-type.enum';

@Entity('pedagogical_contents')
export class PedagogicalContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 200 })
  titleEn: string;

  @Column('varchar', { length: 200 })
  titleFi: string;

  @Column('enum', { enum: ContentType })
  type: ContentType;

  @Column('text', { nullable: true })
  contentEn: string | null;

  @Column('text', { nullable: true })
  contentFi: string | null;

  @Column('varchar', { length: 500, nullable: true })
  url: string | null;

  @Column('int')
  orderIndex: number;

  @Column('uuid')
  subChapterId: string;

  @ManyToOne(() => SubChapter, (subChapter) => subChapter.pedagogicalContents, {
    onDelete: 'CASCADE',
  })
  subChapter: SubChapter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
