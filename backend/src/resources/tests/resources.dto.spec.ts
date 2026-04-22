import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ResourceSource, ResourceType } from '../../entities/resource.entity';
import { CreateAdminResourceDto } from '../dto/create-admin-resource.dto';
import { CreateMyResourceDto } from '../dto/create-my-resource.dto';
import { ListResourcesDto } from '../dto/list-resources.dto';

describe('Resources DTOs', () => {
  describe('CreateAdminResourceDto', () => {
    it('trims strings, normalizes blank optional descriptions and converts assignedUserId', () => {
      const dto = plainToInstance(CreateAdminResourceDto, {
        title: '  Security guide  ',
        description: '   ',
        type: ResourceType.FILE,
        fileUrl: '/uploads/resources/guide.pdf',
        assignedUserId: '7',
      });

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
      expect(dto.title).toBe('Security guide');
      expect(dto.description).toBeNull();
      expect(dto.assignedUserId).toBe(7);
    });

    it('rejects invalid assigned user ids', () => {
      const dto = plainToInstance(CreateAdminResourceDto, {
        title: 'Security guide',
        type: ResourceType.LINK,
        linkUrl: 'https://example.com',
        assignedUserId: '0',
      });

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'assignedUserId')).toBe(
        true,
      );
    });
  });

  describe('CreateMyResourceDto', () => {
    it('trims strings and keeps optional blank descriptions as null', () => {
      const dto = plainToInstance(CreateMyResourceDto, {
        title: '  My checklist  ',
        description: '   ',
        type: ResourceType.LINK,
        linkUrl: 'https://example.com',
      });

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
      expect(dto.title).toBe('My checklist');
      expect(dto.description).toBeNull();
    });

    it('rejects titles longer than the allowed limit', () => {
      const dto = plainToInstance(CreateMyResourceDto, {
        title: 'a'.repeat(181),
        type: ResourceType.LINK,
        linkUrl: 'https://example.com',
      });

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'title')).toBe(true);
    });
  });

  describe('ListResourcesDto', () => {
    it('trims search and converts numeric query parameters', () => {
      const dto = plainToInstance(ListResourcesDto, {
        search: '  playbook  ',
        assignedUserId: '7',
        type: ResourceType.FILE,
        source: ResourceSource.ADMIN,
        limit: '50',
        offset: '5',
      });

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
      expect(dto.search).toBe('playbook');
      expect(dto.assignedUserId).toBe(7);
      expect(dto.limit).toBe(50);
      expect(dto.offset).toBe(5);
    });

    it('keeps default pagination values when none are provided', () => {
      const dto = plainToInstance(ListResourcesDto, {});

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
      expect(dto.limit).toBe(25);
      expect(dto.offset).toBe(0);
    });

    it('rejects invalid pagination values', () => {
      const dto = plainToInstance(ListResourcesDto, {
        assignedUserId: '0',
        limit: '101',
        offset: '-1',
      });

      const errors = validateSync(dto);
      const invalidProperties = errors.map((error) => error.property);

      expect(invalidProperties).toEqual(
        expect.arrayContaining(['assignedUserId', 'limit', 'offset']),
      );
    });
  });
});
