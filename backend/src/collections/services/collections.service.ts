import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseCollection } from '../../entities/course-collection.entity';
import { CourseCollectionItem } from '../../entities/course-collection-item.entity';
import { Course, CourseStatus } from '../../entities/course.entity';
import { CreateCourseCollectionDto } from '../dto/create-course-collection.dto';
import { UpdateCourseCollectionDto } from '../dto/update-course-collection.dto';
import {
  clampOrderIndex,
  normalizeOrderIndexes,
  shiftAfterDelete,
  shiftForInsert,
  shiftForMove,
} from '../../courses/services/order-index.utils';

type CollectionView = {
  id: string;
  titleEn: string;
  titleFi: string;
  descriptionEn: string | null;
  descriptionFi: string | null;
  coverImage: string | null;
  orderIndex: number;
  isPublished: boolean;
  courses: Course[];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CourseCollection)
    private readonly collectionRepository: Repository<CourseCollection>,
    @InjectRepository(CourseCollectionItem)
    private readonly collectionItemRepository: Repository<CourseCollectionItem>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async listAdminCollections(): Promise<CollectionView[]> {
    const collections = await this.collectionRepository.find({
      relations: [
        'items',
        'items.course',
        'items.course.authors',
        'items.course.finalTests',
        'items.course.chapters',
        'items.course.chapters.trainingQuiz',
        'items.course.chapters.subChapters',
      ],
      order: {
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
    });

    return collections.map((collection) => this.toView(collection, false));
  }

  async listPublishedCollections(): Promise<CollectionView[]> {
    const collections = await this.collectionRepository.find({
      where: { isPublished: true },
      relations: [
        'items',
        'items.course',
        'items.course.authors',
        'items.course.finalTests',
        'items.course.chapters',
        'items.course.chapters.trainingQuiz',
        'items.course.chapters.subChapters',
      ],
      order: {
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
    });

    return collections
      .map((collection) => this.toView(collection, true))
      .filter((collection) => collection.courses.length > 0);
  }

  async create(dto: CreateCourseCollectionDto): Promise<CollectionView> {
    const courses = await this.resolveCourses(dto.courseIds ?? []);
    const siblings = await this.loadOrderedCollectionSiblings();
    await this.normalizeCollectionSiblings(siblings);

    const orderIndex = clampOrderIndex(
      dto.orderIndex ?? siblings.length + 1,
      siblings.length + 1,
    );
    const shiftedCollections = shiftForInsert(siblings, orderIndex);

    if (shiftedCollections.length > 0) {
      await this.collectionRepository.save(shiftedCollections);
    }

    const collection = this.collectionRepository.create({
      titleEn: dto.titleEn.trim(),
      titleFi: dto.titleFi.trim(),
      descriptionEn: dto.descriptionEn?.trim() || null,
      descriptionFi: dto.descriptionFi?.trim() || null,
      coverImage: dto.coverImage?.trim() || null,
      orderIndex,
      isPublished: dto.isPublished ?? true,
      items: (dto.courseIds ?? []).map((courseId, index) =>
        this.collectionItemRepository.create({
          courseId,
          orderIndex: index + 1,
          course: courses.find((course) => course.id === courseId),
        }),
      ),
    });

    const savedCollection = await this.collectionRepository.save(collection);
    const hydratedCollection = await this.findCollectionOrThrow(
      savedCollection.id,
    );

    return this.toView(hydratedCollection, false);
  }

  async update(
    id: string,
    dto: UpdateCourseCollectionDto,
  ): Promise<CollectionView> {
    const collection = await this.findCollectionOrThrow(id);
    const siblings = await this.loadOrderedCollectionSiblings();
    await this.normalizeCollectionSiblings(siblings);

    if (dto.titleEn !== undefined) {
      collection.titleEn = dto.titleEn.trim();
    }

    if (dto.titleFi !== undefined) {
      collection.titleFi = dto.titleFi.trim();
    }

    if (dto.descriptionEn !== undefined) {
      collection.descriptionEn = dto.descriptionEn?.trim() || null;
    }

    if (dto.descriptionFi !== undefined) {
      collection.descriptionFi = dto.descriptionFi?.trim() || null;
    }

    if (dto.coverImage !== undefined) {
      collection.coverImage = dto.coverImage?.trim() || null;
    }

    if (dto.orderIndex !== undefined) {
      const normalizedCollection = siblings.find(
        (sibling) => sibling.id === collection.id,
      );
      const previousOrderIndex =
        normalizedCollection?.orderIndex ?? collection.orderIndex;
      const nextOrderIndex = clampOrderIndex(dto.orderIndex, siblings.length);
      const shiftedCollections = shiftForMove(
        siblings,
        collection.id,
        previousOrderIndex,
        nextOrderIndex,
      );

      if (shiftedCollections.length > 0) {
        await this.collectionRepository.save(shiftedCollections);
      }

      collection.orderIndex = nextOrderIndex;
    }

    if (dto.isPublished !== undefined) {
      collection.isPublished = dto.isPublished;
    }

    let rebuiltItems: CourseCollectionItem[] | null = null;

    if (dto.courseIds !== undefined) {
      const courses = await this.resolveCourses(dto.courseIds);
      rebuiltItems = dto.courseIds.map((courseId, index) =>
        this.collectionItemRepository.create({
          collectionId: collection.id,
          courseId,
          orderIndex: index + 1,
          course: courses.find((course) => course.id === courseId),
        }),
      );
    }

    await this.collectionRepository.save(collection);

    if (rebuiltItems !== null) {
      await this.collectionItemRepository.delete({
        collectionId: collection.id,
      });

      if (rebuiltItems.length > 0) {
        await this.collectionItemRepository.save(rebuiltItems);
      }

      collection.items = rebuiltItems;
    }

    const hydratedCollection = await this.findCollectionOrThrow(collection.id);

    return this.toView(hydratedCollection, false);
  }

  async delete(id: string): Promise<void> {
    const collection = await this.findCollectionOrThrow(id);
    const siblings = await this.loadOrderedCollectionSiblings();
    await this.normalizeCollectionSiblings(siblings);
    const normalizedCollection = siblings.find(
      (sibling) => sibling.id === collection.id,
    );
    const removedOrderIndex =
      normalizedCollection?.orderIndex ?? collection.orderIndex;

    await this.collectionRepository.remove(collection);

    const shiftedCollections = shiftAfterDelete(
      siblings,
      collection.id,
      removedOrderIndex,
    );

    if (shiftedCollections.length > 0) {
      await this.collectionRepository.save(shiftedCollections);
    }
  }

  private async loadOrderedCollectionSiblings(): Promise<CourseCollection[]> {
    return this.collectionRepository.find({
      order: {
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  private async normalizeCollectionSiblings(
    collections: CourseCollection[],
  ): Promise<void> {
    const normalizedCollections = normalizeOrderIndexes(collections);

    if (normalizedCollections.length > 0) {
      await this.collectionRepository.save(normalizedCollections);
    }
  }

  private async resolveCourses(courseIds: string[]): Promise<Course[]> {
    if (courseIds.length === 0) {
      return [];
    }

    const courses = await this.courseRepository.findByIds(courseIds);

    if (courses.length !== courseIds.length) {
      throw new NotFoundException('One or more courses not found');
    }

    return courses;
  }

  private async findCollectionOrThrow(id: string): Promise<CourseCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.course',
        'items.course.authors',
        'items.course.finalTests',
        'items.course.chapters',
        'items.course.chapters.trainingQuiz',
        'items.course.chapters.subChapters',
      ],
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return collection;
  }

  private toView(
    collection: CourseCollection,
    publishedOnly: boolean,
  ): CollectionView {
    const sortedItems = [...(collection.items ?? [])].sort(
      (left, right) => left.orderIndex - right.orderIndex,
    );
    const courses = sortedItems
      .map((item) => item.course)
      .filter((course): course is Course => Boolean(course))
      .filter((course) =>
        publishedOnly ? course.status === CourseStatus.PUBLISHED : true,
      )
      .map((course) => this.sortCourseTree(course));

    return {
      id: collection.id,
      titleEn: collection.titleEn,
      titleFi: collection.titleFi,
      descriptionEn: collection.descriptionEn,
      descriptionFi: collection.descriptionFi,
      coverImage: collection.coverImage,
      orderIndex: collection.orderIndex,
      isPublished: collection.isPublished,
      courses,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
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
    }

    return course;
  }
}
