import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Course, CourseStatus } from '../../entities/course.entity';
import { Author } from '../../entities/author.entity';
import { Progress } from '../../entities/progress.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizScope } from '../../entities/quiz-scope.enum';
import { User, UserRole } from '../../entities/user.entity';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { normalizeOrderIndexes } from './order-index.utils';
import { appendSlugSuffix, slugifyCourseTitle } from './course-slug.utils';

export interface AdminCourseSummary {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
}

export type CourseManagementScope = 'mine' | 'review';

export interface CourseOwnerSummary {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export type CourseActorSummary = CourseOwnerSummary;

export interface CourseLearningSummary {
  startedLearners: number;
  completedLearners: number;
  averageProgress: number | null;
  finalTestAttempts: number;
  finalTestPassRate: number | null;
}

type LearningAnalyticsData = {
  progressRows: Progress[];
  finalTestAttempts: QuizAttempt[];
  finalQuizToCourseMap: Map<string, string>;
};

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createCourseDto: CreateCourseDto,
    currentUser: SafeUser,
  ): Promise<Course> {
    const { authorIds, ...courseData } = createCourseDto;
    const [slugEn, slugFi] = await Promise.all([
      this.generateUniqueCourseSlug('slugEn', createCourseDto.titleEn),
      this.generateUniqueCourseSlug('slugFi', createCourseDto.titleFi),
    ]);

    const course = this.courseRepository.create({
      ...courseData,
      slugEn,
      slugFi,
      ownerUserId: currentUser.id,
      createdByUserId: currentUser.id,
      lastEditedByUserId: currentUser.id,
      publishedByUserId:
        courseData.status === CourseStatus.PUBLISHED ? currentUser.id : null,
      publishedAt:
        courseData.status === CourseStatus.PUBLISHED ? new Date() : null,
    });

    if (authorIds && authorIds.length > 0) {
      course.authors = await this.resolveAuthorsForManagement(
        authorIds,
        currentUser.id,
        currentUser,
      );
    }

    const savedCourse = await this.courseRepository.save(course);

    if (savedCourse.status === CourseStatus.PUBLISHED) {
      await this.notificationsService.notifyCoursePublished(savedCourse);
    }

    return savedCourse;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Course[], number]> {
    const [courses, count] = await this.courseRepository.findAndCount({
      where: { status: CourseStatus.PUBLISHED },
      relations: [
        'authors',
        'finalTests',
        'chapters',
        'chapters.trainingQuiz',
        'chapters.subChapters',
      ],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return [courses.map((course) => this.sortCourseTree(course)), count];
  }

  async findAllForAdmin(
    limit: number = 20,
    offset: number = 0,
    currentUser: SafeUser,
    scope: CourseManagementScope = 'mine',
  ): Promise<[Course[], number]> {
    const scopeWhere = this.buildManagementWhere(currentUser, undefined, scope);
    const [courses, count] = await this.courseRepository.findAndCount({
      where: scopeWhere,
      relations: [
        'authors',
        'finalTests',
        'chapters',
        'chapters.trainingQuiz',
        'chapters.subChapters',
      ],
      take: limit,
      skip: offset,
      order: { updatedAt: 'DESC' },
    });
    const sortedCourses = courses.map((course) => this.sortCourseTree(course));
    const coursesWithAuditActors = await this.attachCourseActors(sortedCourses);

    return [await this.attachLearningSummaries(coursesWithAuditActors), count];
  }

  async getAdminSummary(
    currentUser: SafeUser,
    scope: CourseManagementScope = 'mine',
  ): Promise<AdminCourseSummary> {
    const totalCoursesWhere = this.buildManagementWhere(
      currentUser,
      undefined,
      scope,
    );
    const publishedCoursesWhere = this.buildManagementWhere(
      currentUser,
      CourseStatus.PUBLISHED,
      scope,
    );
    const draftCoursesWhere = this.buildManagementWhere(
      currentUser,
      CourseStatus.DRAFT,
      scope,
    );
    const [totalCourses, publishedCourses, draftCourses] = await Promise.all([
      totalCoursesWhere
        ? this.courseRepository.count({ where: totalCoursesWhere })
        : this.courseRepository.count(),
      this.courseRepository.count({
        where: publishedCoursesWhere,
      }),
      this.courseRepository.count({
        where: draftCoursesWhere,
      }),
    ]);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
    };
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: [
        { id, status: CourseStatus.PUBLISHED },
        { slugEn: id, status: CourseStatus.PUBLISHED },
        { slugFi: id, status: CourseStatus.PUBLISHED },
      ],
      relations: [
        'authors',
        'finalTests',
        'chapters',
        'chapters.trainingQuiz',
        'chapters.subChapters',
        'chapters.subChapters.pedagogicalContents',
      ],
    });

    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }

    return this.sortCourseTree(course);
  }

  async findByIdForAdmin(id: string, currentUser: SafeUser): Promise<Course> {
    const course = await this.findCourseOrFail(id, [
      'authors',
      'finalTests',
      'chapters',
      'chapters.trainingQuiz',
      'chapters.subChapters',
      'chapters.subChapters.pedagogicalContents',
    ]);

    this.assertCanManageResolvedCourse(course, currentUser);

    const [courseWithOwner] = await this.attachCourseActors([
      this.sortCourseTree(course),
    ]);
    const [courseWithLearningSummary] = await this.attachLearningSummaries([
      courseWithOwner,
    ]);

    return courseWithLearningSummary;
  }

  async findManageableAuthors(
    id: string,
    currentUser: SafeUser,
  ): Promise<Author[]> {
    const course = await this.findCourseOrFail(id, ['authors']);
    this.assertCanManageResolvedCourse(course, currentUser);

    return await this.resolveAvailableAuthorsForOwner(
      course.ownerUserId,
      currentUser,
    );
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    currentUser: SafeUser,
  ): Promise<Course> {
    const course = await this.findByIdForAdmin(id, currentUser);
    const previousStatus = course.status;
    const { authorIds, ...courseData } = updateCourseDto;

    Object.assign(course, courseData);
    course.lastEditedByUserId = currentUser.id;

    if (
      updateCourseDto.titleEn !== undefined ||
      updateCourseDto.titleFi !== undefined ||
      !course.slugEn ||
      !course.slugFi
    ) {
      const [slugEn, slugFi] = await Promise.all([
        this.generateUniqueCourseSlug(
          'slugEn',
          updateCourseDto.titleEn ?? course.titleEn,
          course.id,
        ),
        this.generateUniqueCourseSlug(
          'slugFi',
          updateCourseDto.titleFi ?? course.titleFi,
          course.id,
        ),
      ]);

      course.slugEn = slugEn;
      course.slugFi = slugFi;
    }

    if (authorIds !== undefined) {
      if (authorIds.length === 0) {
        course.authors = [];
      } else {
        course.authors = await this.resolveAuthorsForManagement(
          authorIds,
          course.ownerUserId,
          currentUser,
        );
      }
    }

    if (
      previousStatus !== CourseStatus.PUBLISHED &&
      course.status === CourseStatus.PUBLISHED
    ) {
      course.publishedByUserId = currentUser.id;
      course.publishedAt = new Date();
    }

    const savedCourse = await this.courseRepository.save(course);

    if (
      previousStatus !== CourseStatus.PUBLISHED &&
      savedCourse.status === CourseStatus.PUBLISHED
    ) {
      await this.notificationsService.notifyCoursePublished(savedCourse);
    } else if (
      previousStatus === CourseStatus.PUBLISHED &&
      savedCourse.status !== CourseStatus.PUBLISHED
    ) {
      await this.notificationsService.deleteCourseNotifications(savedCourse.id);
    }

    return savedCourse;
  }

  async delete(id: string, currentUser: SafeUser): Promise<void> {
    const course = await this.findByIdForAdmin(id, currentUser);
    await this.courseRepository.remove(course);
    await this.notificationsService.deleteCourseNotifications(course.id);
  }

  async assertCanManageCourse(
    id: string,
    currentUser: SafeUser,
  ): Promise<void> {
    const course = await this.findCourseOrFail(id);
    this.assertCanManageResolvedCourse(course, currentUser);
  }

  private buildManagementWhere(
    currentUser: SafeUser,
    status?: CourseStatus,
    scope: CourseManagementScope = 'mine',
  ): FindOptionsWhere<Course> | FindOptionsWhere<Course>[] | undefined {
    if (currentUser.role === UserRole.ADMIN) {
      if (scope === 'review') {
        return {
          ...(status ? { status } : {}),
          ownerUserId: Not(currentUser.id),
        };
      }

      return [
        {
          ...(status ? { status } : {}),
          ownerUserId: currentUser.id,
        },
        {
          ...(status ? { status } : {}),
          ownerUserId: IsNull(),
        },
      ];
    }

    const where: FindOptionsWhere<Course> = {
      ownerUserId: currentUser.id,
    };

    if (status) {
      where.status = status;
    }

    return where;
  }

  private async findCourseOrFail(
    id: string,
    relations?: string[],
  ): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations,
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  private async generateUniqueCourseSlug(
    slugField: 'slugEn' | 'slugFi',
    title: string,
    excludeCourseId?: string,
  ): Promise<string> {
    const baseSlug = slugifyCourseTitle(title);
    let candidate = baseSlug;
    let suffix = 2;

    while (
      await this.courseRepository.findOne({
        where: excludeCourseId
          ? { [slugField]: candidate, id: Not(excludeCourseId) }
          : { [slugField]: candidate },
        select: {
          id: true,
        },
      })
    ) {
      candidate = appendSlugSuffix(baseSlug, suffix);
      suffix += 1;
    }

    return candidate;
  }

  private async resolveAuthorsForManagement(
    authorIds: string[],
    ownerUserId: number | null,
    currentUser: SafeUser,
  ): Promise<Author[]> {
    const normalizedAuthorIds = [...new Set(authorIds)];
    const authors = await this.authorRepository.find({
      where: this.buildAuthorOwnershipWhere(
        normalizedAuthorIds,
        ownerUserId,
        currentUser,
      ),
    });

    if (authors.length !== normalizedAuthorIds.length) {
      throw new NotFoundException('One or more authors not found');
    }

    return authors;
  }

  private async resolveAvailableAuthorsForOwner(
    ownerUserId: number | null,
    currentUser: SafeUser,
  ): Promise<Author[]> {
    return await this.authorRepository.find({
      where: this.buildAuthorOwnershipWhere(undefined, ownerUserId, currentUser),
      order: { updatedAt: 'DESC' },
    });
  }

  private buildAuthorOwnershipWhere(
    authorIds: string[] | undefined,
    ownerUserId: number | null,
    currentUser: SafeUser,
  ): FindOptionsWhere<Author> | FindOptionsWhere<Author>[] {
    const idFilter = authorIds ? { id: In(authorIds) } : {};

    if (
      currentUser.role === UserRole.ADMIN &&
      (ownerUserId === null || ownerUserId === currentUser.id)
    ) {
      return [
        {
          ...idFilter,
          ownerUserId: currentUser.id,
        },
        {
          ...idFilter,
          ownerUserId: IsNull(),
        },
      ];
    }

    if (ownerUserId === null) {
      throw new ForbiddenException('You do not have access to these authors');
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      ownerUserId !== currentUser.id
    ) {
      throw new ForbiddenException('You do not have access to these authors');
    }

    return {
      ...idFilter,
      ownerUserId,
    };
  }

  async getLearningSummary(
    currentUser: SafeUser,
    scope: CourseManagementScope = 'mine',
  ): Promise<CourseLearningSummary> {
    const scopeWhere = this.buildManagementWhere(currentUser, undefined, scope);
    const courses = await this.courseRepository.find({
      where: scopeWhere,
    });
    const courseIds = courses.map((course) => course.id);

    if (courseIds.length === 0) {
      return {
        startedLearners: 0,
        completedLearners: 0,
        averageProgress: null,
        finalTestAttempts: 0,
        finalTestPassRate: null,
      };
    }

    const { progressRows, finalTestAttempts } =
      await this.loadLearningAnalyticsData(courseIds);

    const startedLearnerIds = new Set(progressRows.map((progress) => progress.userId));
    const completedLearnerIds = new Set(
      progressRows
        .filter(
          (progress) =>
            progress.completed || progress.completionPercentage >= 100,
        )
        .map((progress) => progress.userId),
    );
    const averageProgress =
      progressRows.length > 0
        ? Math.round(
            progressRows.reduce(
              (total, progress) => total + progress.completionPercentage,
              0,
            ) / progressRows.length,
          )
        : null;
    const passedFinalTestAttempts = finalTestAttempts.filter(
      (attempt) => attempt.passed,
    ).length;

    return {
      startedLearners: startedLearnerIds.size,
      completedLearners: completedLearnerIds.size,
      averageProgress,
      finalTestAttempts: finalTestAttempts.length,
      finalTestPassRate:
        finalTestAttempts.length > 0
          ? Math.round(
              (passedFinalTestAttempts / finalTestAttempts.length) * 100,
            )
          : null,
    };
  }

  private async attachLearningSummaries(courses: Course[]): Promise<Course[]> {
    const courseIds = courses.map((course) => course.id);

    if (courseIds.length === 0) {
      return courses.map((course) =>
        Object.assign(course, { learningSummary: this.createEmptyLearningSummary() }),
      );
    }

    const { progressRows, finalTestAttempts, finalQuizToCourseMap } =
      await this.loadLearningAnalyticsData(courseIds);

    const progressByCourse = new Map<string, Progress[]>();

    for (const progress of progressRows) {
      const entries = progressByCourse.get(progress.courseId) ?? [];
      entries.push(progress);
      progressByCourse.set(progress.courseId, entries);
    }

    const finalAttemptsByCourse = new Map<string, QuizAttempt[]>();

    for (const attempt of finalTestAttempts) {
      const courseId = finalQuizToCourseMap.get(attempt.quizId);

      if (!courseId) {
        continue;
      }

      const entries = finalAttemptsByCourse.get(courseId) ?? [];
      entries.push(attempt);
      finalAttemptsByCourse.set(courseId, entries);
    }

    return courses.map((course) => {
      const courseProgressRows = progressByCourse.get(course.id) ?? [];
      const courseFinalAttempts = finalAttemptsByCourse.get(course.id) ?? [];
      const startedLearnerIds = new Set(
        courseProgressRows.map((progress) => progress.userId),
      );
      const completedLearnerIds = new Set(
        courseProgressRows
          .filter(
            (progress) =>
              progress.completed || progress.completionPercentage >= 100,
          )
          .map((progress) => progress.userId),
      );
      const averageProgress =
        courseProgressRows.length > 0
          ? Math.round(
              courseProgressRows.reduce(
                (total, progress) => total + progress.completionPercentage,
                0,
              ) / courseProgressRows.length,
            )
          : null;
      const passedFinalAttempts = courseFinalAttempts.filter(
        (attempt) => attempt.passed,
      ).length;

      return Object.assign(course, {
        learningSummary: {
          startedLearners: startedLearnerIds.size,
          completedLearners: completedLearnerIds.size,
          averageProgress,
          finalTestAttempts: courseFinalAttempts.length,
          finalTestPassRate:
            courseFinalAttempts.length > 0
              ? Math.round(
                  (passedFinalAttempts / courseFinalAttempts.length) * 100,
                )
              : null,
        },
      });
    });
  }

  private async loadLearningAnalyticsData(
    courseIds: string[],
  ): Promise<LearningAnalyticsData> {
    const [progressRows, finalTests] = await Promise.all([
      this.progressRepository.find({
        where: { courseId: In(courseIds) },
      }),
      this.quizRepository.find({
        where: {
          scope: QuizScope.COURSE_FINAL,
          courseId: In(courseIds),
        },
      }),
    ]);

    const finalQuizIds = finalTests.map((quiz) => quiz.id);
    const finalTestAttempts =
      finalQuizIds.length > 0
        ? await this.quizAttemptRepository.find({
            where: { quizId: In(finalQuizIds) },
          })
        : [];

    return {
      progressRows,
      finalTestAttempts,
      finalQuizToCourseMap: new Map(
        finalTests
          .filter((quiz): quiz is Quiz & { courseId: string } => quiz.courseId !== null)
          .map((quiz) => [quiz.id, quiz.courseId] as const),
      ),
    };
  }

  private createEmptyLearningSummary(): CourseLearningSummary {
    return {
      startedLearners: 0,
      completedLearners: 0,
      averageProgress: null,
      finalTestAttempts: 0,
      finalTestPassRate: null,
    };
  }

  private async attachCourseActors(courses: Course[]): Promise<Course[]> {
    const userIds = [
      ...new Set(
        courses
          .flatMap((course) => [
            course.ownerUserId,
            course.createdByUserId,
            course.lastEditedByUserId,
            course.publishedByUserId,
          ])
          .filter((userId): userId is number => userId !== null),
      ),
    ];

    if (userIds.length === 0) {
      return courses.map((course) =>
        Object.assign(course, {
          owner: null,
          createdBy: null,
          lastEditedBy: null,
          publishedBy: null,
        }),
      );
    }

    const owners = await this.userRepository.find({
      where: { id: In(userIds) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const ownerMap = new Map<number, CourseActorSummary>(
      owners.map((owner) => [
        owner.id,
        {
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
        },
      ]),
    );

    return courses.map((course) =>
      Object.assign(course, {
        owner:
          course.ownerUserId === null
            ? null
            : ownerMap.get(course.ownerUserId) ?? null,
        createdBy:
          course.createdByUserId === null
            ? null
            : ownerMap.get(course.createdByUserId) ?? null,
        lastEditedBy:
          course.lastEditedByUserId === null
            ? null
            : ownerMap.get(course.lastEditedByUserId) ?? null,
        publishedBy:
          course.publishedByUserId === null
            ? null
            : ownerMap.get(course.publishedByUserId) ?? null,
      }),
    );
  }

  private assertCanManageResolvedCourse(
    course: Pick<Course, 'ownerUserId'>,
    currentUser: SafeUser,
  ): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (
      currentUser.role !== UserRole.CREATOR ||
      course.ownerUserId !== currentUser.id
    ) {
      throw new ForbiddenException('You do not have access to this course');
    }
  }

  private sortCourseTree(course: Course): Course {
    if (!course.chapters?.length) {
      return course;
    }

    normalizeOrderIndexes(course.chapters);
    course.chapters.sort((left, right) => left.orderIndex - right.orderIndex);

    for (const chapter of course.chapters) {
      if (!chapter.subChapters?.length) {
        continue;
      }

      normalizeOrderIndexes(chapter.subChapters);
      chapter.subChapters.sort(
        (left, right) => left.orderIndex - right.orderIndex,
      );

      for (const subChapter of chapter.subChapters) {
        if (!subChapter.pedagogicalContents?.length) {
          continue;
        }

        normalizeOrderIndexes(subChapter.pedagogicalContents);
        subChapter.pedagogicalContents.sort(
          (left, right) => left.orderIndex - right.orderIndex,
        );
      }
    }

    return course;
  }
}
