import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { basename, join } from 'path';
import { existsSync } from 'fs';
import type { AppLanguage } from '../../config/request-language';
import {
  Resource,
  ResourceSource,
  ResourceType,
} from '../../entities/resource.entity';
import { User, UserRole } from '../../entities/user.entity';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CreateAdminResourceDto } from '../dto/create-admin-resource.dto';
import { CreateMyResourceDto } from '../dto/create-my-resource.dto';
import { ListResourcesDto } from '../dto/list-resources.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';

type ResourceView = {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  fileUrl: string | null;
  filename: string | null;
  mimeType: string | null;
  linkUrl: string | null;
  source: ResourceSource;
  assignedUserId: number;
  assignedUser: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  createdByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type ResourceDownload = {
  filePath: string;
  filename: string;
  mimeType: string;
};

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listAdminResources(
    query: ListResourcesDto,
  ): Promise<{ data: ResourceView[]; count: number }> {
    const queryBuilder = this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.assignedUser', 'assignedUser')
      .andWhere('resource.source = :adminSource', {
        adminSource: ResourceSource.ADMIN,
      })
      .orderBy('resource.createdAt', 'DESC');

    if (query.search) {
      const normalizedSearch = `%${query.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(resource.title) LIKE :search', {
            search: normalizedSearch,
          })
            .orWhere('LOWER(resource.description) LIKE :search', {
              search: normalizedSearch,
            })
            .orWhere('LOWER(assignedUser.email) LIKE :search', {
              search: normalizedSearch,
            });
        }),
      );
    }

    if (query.assignedUserId) {
      queryBuilder.andWhere('resource.assignedUserId = :assignedUserId', {
        assignedUserId: query.assignedUserId,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('resource.type = :type', { type: query.type });
    }

    const [resources, count] = await queryBuilder
      .take(query.limit)
      .skip(query.offset)
      .getManyAndCount();

    return {
      data: resources.map((resource) => this.toResourceView(resource)),
      count,
    };
  }

  async createAdminResource(
    dto: CreateAdminResourceDto,
    currentAdminId: number,
    language: AppLanguage = 'en',
  ): Promise<ResourceView> {
    this.validateResourcePayload(dto.type, dto.fileUrl, dto.linkUrl, language);

    const assignedUser = await this.userRepository.findOne({
      where: { id: dto.assignedUserId },
    });

    if (!assignedUser) {
      throw new NotFoundException(
        language === 'fi' ? 'Kayttajaa ei loytynyt' : 'User not found',
      );
    }

    const resource = this.resourceRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type,
      fileUrl: dto.type === ResourceType.FILE ? (dto.fileUrl ?? null) : null,
      filename: dto.type === ResourceType.FILE ? (dto.filename ?? null) : null,
      mimeType: dto.type === ResourceType.FILE ? (dto.mimeType ?? null) : null,
      linkUrl: dto.type === ResourceType.LINK ? (dto.linkUrl ?? null) : null,
      source: ResourceSource.ADMIN,
      assignedUserId: dto.assignedUserId,
      createdByUserId: currentAdminId,
    });

    const saved = await this.resourceRepository.save(resource);
    await this.notificationsService.notifyResourceShared(
      dto.assignedUserId,
      saved.id,
      saved.title,
    );

    return this.toResourceView({
      ...saved,
      assignedUser,
    });
  }

  async deleteAdminResource(
    resourceId: string,
    language: AppLanguage = 'en',
  ): Promise<void> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        language === 'fi' ? 'Resurssia ei loytynyt' : 'Resource not found',
      );
    }

    await this.resourceRepository.remove(resource);
    await this.notificationsService.deleteResourceNotifications(resource.id);
  }

  async listMyResources(userId: number): Promise<ResourceView[]> {
    const resources = await this.resourceRepository.find({
      where: { assignedUserId: userId },
      relations: ['assignedUser'],
      order: { createdAt: 'DESC' },
    });

    return resources.map((resource) => this.toResourceView(resource));
  }

  async createMyResource(
    dto: CreateMyResourceDto,
    userId: number,
    language: AppLanguage = 'en',
  ): Promise<ResourceView> {
    this.validateResourcePayload(dto.type, dto.fileUrl, dto.linkUrl, language);

    const assignedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!assignedUser) {
      throw new NotFoundException(
        language === 'fi' ? 'Kayttajaa ei loytynyt' : 'User not found',
      );
    }

    const resource = this.resourceRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type,
      fileUrl: dto.type === ResourceType.FILE ? (dto.fileUrl ?? null) : null,
      filename: dto.type === ResourceType.FILE ? (dto.filename ?? null) : null,
      mimeType: dto.type === ResourceType.FILE ? (dto.mimeType ?? null) : null,
      linkUrl: dto.type === ResourceType.LINK ? (dto.linkUrl ?? null) : null,
      source: ResourceSource.USER,
      assignedUserId: userId,
      createdByUserId: userId,
    });

    const saved = await this.resourceRepository.save(resource);
    return this.toResourceView({
      ...saved,
      assignedUser,
    });
  }

  async deleteMyResource(
    resourceId: string,
    userId: number,
    language: AppLanguage = 'en',
  ): Promise<void> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId, assignedUserId: userId },
    });

    if (!resource) {
      throw new NotFoundException(
        language === 'fi' ? 'Resurssia ei loytynyt' : 'Resource not found',
      );
    }

    if (
      resource.source !== ResourceSource.USER ||
      resource.createdByUserId !== userId
    ) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Voit poistaa vain omat lisatyt resurssisi'
          : 'You can only delete your own uploaded resources',
      );
    }

    await this.resourceRepository.remove(resource);
  }

  async getResourceDownload(
    resourceId: string,
    currentUser: Pick<SafeUser, 'id' | 'role'>,
    language: AppLanguage = 'en',
  ): Promise<ResourceDownload> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        language === 'fi' ? 'Resurssia ei loytynyt' : 'Resource not found',
      );
    }

    const canDownload =
      resource.assignedUserId === currentUser.id ||
      (currentUser.role === UserRole.ADMIN &&
        resource.source === ResourceSource.ADMIN);

    if (!canDownload) {
      throw new ForbiddenException(
        language === 'fi'
          ? 'Sinulla ei ole oikeutta avata tata resurssia'
          : 'You do not have permission to open this resource',
      );
    }

    if (resource.type !== ResourceType.FILE || !resource.filename) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Talla resurssilla ei ole ladattavaa tiedostoa'
          : 'This resource does not have a downloadable file',
      );
    }

    const safeFilename = basename(resource.filename);

    if (safeFilename !== resource.filename) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Resurssin tiedostonimi on virheellinen'
          : 'Invalid resource filename',
      );
    }

    const filePath = join(process.cwd(), 'uploads', 'resources', safeFilename);

    if (!existsSync(filePath)) {
      throw new NotFoundException(
        language === 'fi'
          ? 'Resurssitiedostoa ei loytynyt'
          : 'Resource file not found',
      );
    }

    return {
      filePath,
      filename: safeFilename,
      mimeType: resource.mimeType ?? 'application/octet-stream',
    };
  }

  private validateResourcePayload(
    type: ResourceType,
    fileUrl: string | undefined,
    linkUrl: string | undefined,
    language: AppLanguage,
  ): void {
    if (type === ResourceType.FILE && !fileUrl) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Tiedostoresurssille tarvitaan ladattu tiedosto'
          : 'A file resource requires an uploaded file',
      );
    }

    if (type === ResourceType.LINK && !linkUrl) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Linkkiresurssille tarvitaan URL-osoite'
          : 'A link resource requires a URL',
      );
    }
  }

  private toResourceView(resource: Resource): ResourceView {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      fileUrl: resource.fileUrl,
      filename: resource.filename,
      mimeType: resource.mimeType,
      linkUrl: resource.linkUrl,
      source: resource.source,
      assignedUserId: resource.assignedUserId,
      assignedUser: {
        id: resource.assignedUser.id,
        email: resource.assignedUser.email,
        firstName: resource.assignedUser.firstName,
        lastName: resource.assignedUser.lastName,
      },
      createdByUserId: resource.createdByUserId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}
