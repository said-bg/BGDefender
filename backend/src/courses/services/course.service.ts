import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseStatus } from '../../entities/course.entity';
import { Author } from '../../entities/author.entity';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const { authorIds, ...courseData } = createCourseDto;

    const course = this.courseRepository.create(courseData);

    if (authorIds && authorIds.length > 0) {
      const authors = await this.authorRepository.findByIds(authorIds);

      if (authors.length !== authorIds.length) {
        throw new NotFoundException('One or more authors not found');
      }

      course.authors = authors;
    }

    return await this.courseRepository.save(course);
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Course[], number]> {
    const [courses, count] = await this.courseRepository.findAndCount({
      where: { status: CourseStatus.PUBLISHED },
      relations: ['authors', 'chapters', 'chapters.subChapters'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return [courses.map((course) => this.sortCourseTree(course)), count];
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: [
        'authors',
        'chapters',
        'chapters.subChapters',
        'chapters.subChapters.pedagogicalContents',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return this.sortCourseTree(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findById(id);
    const { authorIds, ...courseData } = updateCourseDto;

    Object.assign(course, courseData);

    if (authorIds !== undefined) {
      if (authorIds.length === 0) {
        course.authors = [];
      } else {
        const authors = await this.authorRepository.findByIds(authorIds);

        if (authors.length !== authorIds.length) {
          throw new NotFoundException('One or more authors not found');
        }

        course.authors = authors;
      }
    }

    return await this.courseRepository.save(course);
  }

  async delete(id: string): Promise<void> {
    const course = await this.findById(id);
    await this.courseRepository.remove(course);
  }

  private sortCourseTree(course: Course): Course {
    if (!course.chapters?.length) {
      return course;
    }

    course.chapters.sort((left, right) => left.orderIndex - right.orderIndex);

    for (const chapter of course.chapters) {
      if (!chapter.subChapters?.length) {
        continue;
      }

      chapter.subChapters.sort(
        (left, right) => left.orderIndex - right.orderIndex,
      );

      for (const subChapter of chapter.subChapters) {
        if (!subChapter.pedagogicalContents?.length) {
          continue;
        }

        subChapter.pedagogicalContents.sort(
          (left, right) => left.orderIndex - right.orderIndex,
        );
      }
    }

    return course;
  }
}
