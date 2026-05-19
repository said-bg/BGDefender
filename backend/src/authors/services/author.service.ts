import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { Author } from '../../entities/author.entity';
import { UserRole } from '../../entities/user.entity';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
  ) {}

  async create(
    createAuthorDto: CreateAuthorDto,
    currentUser: SafeUser,
  ): Promise<Author> {
    const author = this.authorRepository.create({
      ...createAuthorDto,
      ownerUserId: currentUser.id,
    });

    return await this.authorRepository.save(author);
  }

  async findAll(
    currentUser: SafeUser,
    limit: number = 10,
    offset: number = 0,
  ): Promise<[Author[], number]> {
    return await this.authorRepository.findAndCount({
      where: this.buildLibraryWhere(currentUser),
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, currentUser: SafeUser): Promise<Author> {
    return await this.findOwnedAuthorOrFail(id, currentUser);
  }

  async findAvailableForOwner(
    ownerUserId: number | null,
    currentUser: SafeUser,
  ): Promise<Author[]> {
    return await this.authorRepository.find({
      where: this.buildCourseAuthorWhere(ownerUserId, currentUser),
      order: { updatedAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    currentUser: SafeUser,
  ): Promise<Author> {
    const author = await this.findOwnedAuthorOrFail(id, currentUser);
    Object.assign(author, updateAuthorDto);
    return await this.authorRepository.save(author);
  }

  async delete(id: string, currentUser: SafeUser): Promise<void> {
    const author = await this.findOwnedAuthorOrFail(id, currentUser);
    await this.authorRepository.remove(author);
  }

  private async findOwnedAuthorOrFail(
    id: string,
    currentUser: SafeUser,
  ): Promise<Author> {
    const author = await this.authorRepository.findOne({
      where: { id },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    if (!this.canAccessAuthor(author, currentUser)) {
      throw new ForbiddenException('You do not have access to this author');
    }

    return author;
  }

  private buildLibraryWhere(
    currentUser: SafeUser,
  ): FindOptionsWhere<Author> | FindOptionsWhere<Author>[] {
    if (currentUser.role === UserRole.ADMIN) {
      return [
        { ownerUserId: currentUser.id },
        { ownerUserId: IsNull() },
      ];
    }

    return {
      ownerUserId: currentUser.id,
    };
  }

  private buildCourseAuthorWhere(
    ownerUserId: number | null,
    currentUser: SafeUser,
  ): FindOptionsWhere<Author> | FindOptionsWhere<Author>[] {
    if (
      currentUser.role === UserRole.ADMIN &&
      (ownerUserId === null || ownerUserId === currentUser.id)
    ) {
      return [
        { ownerUserId: currentUser.id },
        { ownerUserId: IsNull() },
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
      ownerUserId,
    };
  }

  private canAccessAuthor(author: Author, currentUser: SafeUser): boolean {
    if (author.ownerUserId === currentUser.id) {
      return true;
    }

    return currentUser.role === UserRole.ADMIN && author.ownerUserId === null;
  }
}
