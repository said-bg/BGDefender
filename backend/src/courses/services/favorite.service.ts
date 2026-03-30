import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../../entities/favorite.entity';
import { Course } from '../../entities/course.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async findAllForUser(userId: number): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserAndCourse(
    userId: number,
    courseId: string,
  ): Promise<Favorite | null> {
    return this.favoriteRepository.findOne({
      where: { userId, courseId },
      relations: ['course'],
    });
  }

  async addForUserAndCourse(userId: number, courseId: string): Promise<Favorite> {
    const existingFavorite = await this.findByUserAndCourse(userId, courseId);

    if (existingFavorite) {
      return existingFavorite;
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const favorite = this.favoriteRepository.create({
      userId,
      courseId,
      course,
    });

    return this.favoriteRepository.save(favorite);
  }

  async deleteByUserAndCourse(userId: number, courseId: string): Promise<void> {
    const favorite = await this.findByUserAndCourse(userId, courseId);

    if (!favorite) {
      return;
    }

    await this.favoriteRepository.remove(favorite);
  }
}
