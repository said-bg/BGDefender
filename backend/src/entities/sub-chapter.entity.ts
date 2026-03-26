import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { PedagogicalContent } from './pedagogical-content.entity';

@Entity('sub_chapters')
export class SubChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 200 })
  titleEn: string;

  @Column('varchar', { length: 200 })
  titleFi: string;

  @Column('text')
  descriptionEn: string;

  @Column('text')
  descriptionFi: string;

  @Column('int')
  orderIndex: number;

  @Column('uuid')
  chapterId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.subChapters, {
    onDelete: 'CASCADE',
  })
  chapter: Chapter;

  @OneToMany(
    () => PedagogicalContent,
    (pedagogicalContent) => pedagogicalContent.subChapter,
  )
  pedagogicalContents: PedagogicalContent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
