import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { basename, join } from 'path';
import { existsSync } from 'fs';
import type { AppLanguage } from '../../config/request-language';
import { ResourceGroupMember } from '../../entities/resource-group-member.entity';
import { ResourceGroup } from '../../entities/resource-group.entity';
import {
  Resource,
  ResourceSource,
  ResourceType,
} from '../../entities/resource.entity';
import { User, UserRole } from '../../entities/user.entity';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { CreateAdminResourceDto } from '../dto/create-admin-resource.dto';
import { CreateMyResourceDto } from '../dto/create-my-resource.dto';
import { CreateResourceGroupDto } from '../dto/create-resource-group.dto';
import { ListResourcesDto } from '../dto/list-resources.dto';
import { UpdateResourceGroupDto } from '../dto/update-resource-group.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';

type ResourceGroupUserView = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type ResourceGroupView = {
  id: string;
  title: string;
  description: string | null;
  createdByUserId: number | null;
  memberCount: number;
  members: ResourceGroupUserView[];
  createdAt: Date;
  updatedAt: Date;
};

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
  assignedUserId: number | null;
  assignedUser: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedGroupId: string | null;
  assignedGroup: {
    id: string;
    title: string;
    description: string | null;
    memberCount: number;
  } | null;
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
    @InjectRepository(ResourceGroup)
    private readonly resourceGroupRepository: Repository<ResourceGroup>,
    @InjectRepository(ResourceGroupMember)
    private readonly resourceGroupMemberRepository: Repository<ResourceGroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listAdminResources(
    query: ListResourcesDto,
  ): Promise<{ data: ResourceView[]; count: number }> {
    const queryBuilder = this.resourceRepository
      .createQueryBuilder('resource')
      .distinct(true)
      .leftJoinAndSelect('resource.assignedUser', 'assignedUser')
      .leftJoinAndSelect('resource.assignedGroup', 'assignedGroup')
      .leftJoinAndSelect('assignedGroup.members', 'groupMembers')
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
            })
            .orWhere('LOWER(assignedGroup.title) LIKE :search', {
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

    if (query.assignedGroupId) {
      queryBuilder.andWhere('resource.assignedGroupId = :assignedGroupId', {
        assignedGroupId: query.assignedGroupId,
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

  async listAdminResourceGroups(): Promise<ResourceGroupView[]> {
    const groups = await this.resourceGroupRepository.find({
      relations: ['members', 'members.user'],
      order: { createdAt: 'DESC' },
    });

    return groups.map((group) => this.toResourceGroupView(group));
  }

  async createAdminResourceGroup(
    dto: CreateResourceGroupDto,
    currentAdminId: number,
    language: AppLanguage = 'en',
  ): Promise<ResourceGroupView> {
    const memberIds = dto.memberUserIds ?? [];
    const members = await this.resolveAssignableUsers(memberIds, language);

    const createdGroup = await this.resourceGroupRepository.save(
      this.resourceGroupRepository.create({
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        createdByUserId: currentAdminId,
      }),
    );

    await this.syncResourceGroupMembers(createdGroup.id, members);

    const group = await this.getResourceGroupOrThrow(createdGroup.id, language);
    return this.toResourceGroupView(group);
  }

  async updateAdminResourceGroup(
    groupId: string,
    dto: UpdateResourceGroupDto,
    language: AppLanguage = 'en',
  ): Promise<ResourceGroupView> {
    const group = await this.getResourceGroupOrThrow(groupId, language);

    if (typeof dto.title === 'string') {
      group.title = dto.title.trim();
    }

    if ('description' in dto) {
      group.description = dto.description?.trim() || null;
    }

    await this.resourceGroupRepository.save(group);

    if (dto.memberUserIds) {
      const members = await this.resolveAssignableUsers(dto.memberUserIds, language);
      await this.syncResourceGroupMembers(group.id, members);
    }

    const reloaded = await this.getResourceGroupOrThrow(group.id, language);
    return this.toResourceGroupView(reloaded);
  }

  async deleteAdminResourceGroup(
    groupId: string,
    language: AppLanguage = 'en',
  ): Promise<void> {
    const group = await this.getResourceGroupOrThrow(groupId, language);
    const linkedResourceCount = await this.resourceRepository.count({
      where: { assignedGroupId: groupId },
    });

    if (linkedResourceCount > 0) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Poista tai siirra ryhman resurssit ennen ryhman poistamista'
          : 'Remove or reassign the group resources before deleting this group',
      );
    }

    await this.resourceGroupRepository.remove(group);
  }

  async createAdminResource(
    dto: CreateAdminResourceDto,
    currentAdminId: number,
    language: AppLanguage = 'en',
  ): Promise<ResourceView> {
    this.validateResourcePayload(dto.type, dto.fileUrl, dto.linkUrl, language);
    const target = await this.resolveAdminResourceTarget(dto, language);

    const resource = this.resourceRepository.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type,
      fileUrl: dto.type === ResourceType.FILE ? (dto.fileUrl ?? null) : null,
      filename: dto.type === ResourceType.FILE ? (dto.filename ?? null) : null,
      mimeType: dto.type === ResourceType.FILE ? (dto.mimeType ?? null) : null,
      linkUrl: dto.type === ResourceType.LINK ? (dto.linkUrl ?? null) : null,
      source: ResourceSource.ADMIN,
      assignedUserId: target.assignedUser?.id ?? null,
      assignedGroupId: target.assignedGroup?.id ?? null,
      createdByUserId: currentAdminId,
    });

    const saved = await this.resourceRepository.save(resource);

    const notificationRecipients =
      target.assignedUser !== null
        ? [target.assignedUser.id]
        : target.groupMembers.map((member) => member.id);

    await Promise.all(
      notificationRecipients.map((userId) =>
        this.notificationsService.notifyResourceShared(userId, saved.id, saved.title),
      ),
    );

    return this.toResourceView({
      ...saved,
      assignedUser: target.assignedUser,
      assignedGroup: target.assignedGroup,
    });
  }

  async deleteAdminResource(
    resourceId: string,
    language: AppLanguage = 'en',
  ): Promise<void> {
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['assignedGroup', 'assignedGroup.members'],
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
    const resources = await this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.assignedUser', 'assignedUser')
      .leftJoinAndSelect('resource.assignedGroup', 'assignedGroup')
      .leftJoinAndSelect('assignedGroup.members', 'groupMembers')
      .leftJoinAndSelect('groupMembers.user', 'groupMemberUser')
      .where('resource.assignedUserId = :userId', { userId })
      .orWhere('groupMembers.userId = :userId', { userId })
      .orderBy('resource.createdAt', 'DESC')
      .getMany();

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
      relations: ['assignedGroup', 'assignedGroup.members'],
    });

    if (!resource) {
      throw new NotFoundException(
        language === 'fi' ? 'Resurssia ei loytynyt' : 'Resource not found',
      );
    }

    const canDownload =
      resource.assignedUserId === currentUser.id ||
      (resource.assignedGroup?.members?.some(
        (member) => member.userId === currentUser.id,
      ) ?? false) ||
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

  private async resolveAdminResourceTarget(
    dto: CreateAdminResourceDto,
    language: AppLanguage,
  ): Promise<{
    assignedUser: User | null;
    assignedGroup: ResourceGroup | null;
    groupMembers: User[];
  }> {
    const hasAssignedUser = typeof dto.assignedUserId === 'number';
    const hasAssignedGroup = typeof dto.assignedGroupId === 'string';

    if (hasAssignedUser === hasAssignedGroup) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Valitse resurssille joko kohdekayttaja tai kohderyhma'
          : 'Choose either a target user or a target group for this resource',
      );
    }

    if (hasAssignedUser) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: dto.assignedUserId },
      });

      if (!assignedUser || assignedUser.role === UserRole.ADMIN) {
        throw new NotFoundException(
          language === 'fi' ? 'Kayttajaa ei loytynyt' : 'User not found',
        );
      }

      return {
        assignedUser,
        assignedGroup: null,
        groupMembers: [],
      };
    }

    const assignedGroup = await this.getResourceGroupOrThrow(
      dto.assignedGroupId!,
      language,
    );
    const groupMembers = assignedGroup.members.map((member) => member.user);

    if (groupMembers.length === 0) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Tyhjaan ryhmaan ei voi jakaa resursseja'
          : 'You cannot share a resource with an empty group',
      );
    }

    return {
      assignedUser: null,
      assignedGroup,
      groupMembers,
    };
  }

  private async resolveAssignableUsers(
    userIds: number[],
    language: AppLanguage,
  ): Promise<User[]> {
    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });

    const assignableUsers = users.filter((user) => user.role !== UserRole.ADMIN);

    if (assignableUsers.length !== new Set(userIds).size) {
      throw new NotFoundException(
        language === 'fi'
          ? 'Yhta tai useampaa ryhman jasenta ei loytynyt'
          : 'One or more group members could not be found',
      );
    }

    return assignableUsers;
  }

  private async syncResourceGroupMembers(
    groupId: string,
    users: User[],
  ): Promise<void> {
    await this.resourceGroupMemberRepository.delete({ groupId });

    if (users.length === 0) {
      return;
    }

    await this.resourceGroupMemberRepository.save(
      users.map((user) =>
        this.resourceGroupMemberRepository.create({
          groupId,
          userId: user.id,
        }),
      ),
    );
  }

  private async getResourceGroupOrThrow(
    groupId: string,
    language: AppLanguage,
  ): Promise<ResourceGroup> {
    const group = await this.resourceGroupRepository.findOne({
      where: { id: groupId },
      relations: ['members', 'members.user'],
    });

    if (!group) {
      throw new NotFoundException(
        language === 'fi' ? 'Resurssiryhmaa ei loytynyt' : 'Resource group not found',
      );
    }

    return group;
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
      assignedUser: resource.assignedUser
        ? {
            id: resource.assignedUser.id,
            email: resource.assignedUser.email,
            firstName: resource.assignedUser.firstName,
            lastName: resource.assignedUser.lastName,
          }
        : null,
      assignedGroupId: resource.assignedGroupId,
      assignedGroup: resource.assignedGroup
        ? {
            id: resource.assignedGroup.id,
            title: resource.assignedGroup.title,
            description: resource.assignedGroup.description,
            memberCount: resource.assignedGroup.members?.length ?? 0,
          }
        : null,
      createdByUserId: resource.createdByUserId,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  private toResourceGroupView(group: ResourceGroup): ResourceGroupView {
    return {
      id: group.id,
      title: group.title,
      description: group.description,
      createdByUserId: group.createdByUserId,
      memberCount: group.members.length,
      members: group.members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
      })),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
