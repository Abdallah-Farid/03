import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../entities/permissions.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let service: PermissionsService;

  const mockRole = {
    id: 1,
    name: 'Admin',
    permissions: [],
  };

  const mockPermission: Partial<Permission> = {
    id: 1,
    name: 'create:users',
    roles: [mockRole as any],
  };

  const mockPermissionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByRoleId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    service = module.get<PermissionsService>(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of permissions', async () => {
      const permissions = [mockPermission];
      mockPermissionsService.findAll.mockResolvedValue(permissions);

      const result = await controller.findAll();

      expect(result).toEqual(permissions);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single permission', async () => {
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockPermission);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPermissionsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Permission not found');
    });
  });

  describe('findByRoleId', () => {
    it('should return permissions for a specific role', async () => {
      const permissions = [mockPermission];
      mockPermissionsService.findByRoleId.mockResolvedValue(permissions);

      const result = await controller.findByRoleId('1');

      expect(result).toEqual(permissions);
      expect(service.findByRoleId).toHaveBeenCalledWith(1);
    });

    it('should handle invalid role id', async () => {
      mockPermissionsService.findByRoleId.mockRejectedValue(
        new Error('Invalid role ID'),
      );

      await expect(controller.findByRoleId('invalid')).rejects.toThrow();
    });
  });

  describe('create', () => {
    const createPermissionDto: Partial<Permission> = {
      name: 'create:users',
    };

    it('should create a new permission', async () => {
      const newPermission = { id: 2, ...createPermissionDto };
      mockPermissionsService.create.mockResolvedValue(newPermission);

      const result = await controller.create(createPermissionDto);

      expect(result).toEqual(newPermission);
      expect(service.create).toHaveBeenCalledWith(createPermissionDto);
    });

    it('should validate permission name is required', async () => {
      await expect(controller.create({})).rejects.toThrow(HttpException);
      await expect(controller.create({})).rejects.toThrow('Permission name is required');
    });

    it('should validate permission name is not empty', async () => {
      await expect(controller.create({ name: '' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '' })).rejects.toThrow('Permission name is required');
    });

    it('should validate permission name is not just whitespace', async () => {
      await expect(controller.create({ name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '   ' })).rejects.toThrow('Permission name is required');
    });

    it('should handle validation errors from service', async () => {
      mockPermissionsService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(createPermissionDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updatePermissionDto: Partial<Permission> = {
      name: 'update:users',
    };

    it('should update an existing permission', async () => {
      const updatedPermission = { ...mockPermission, ...updatePermissionDto };
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);
      mockPermissionsService.update.mockResolvedValue(updatedPermission);

      const result = await controller.update('1', updatePermissionDto);

      expect(result).toEqual(updatedPermission);
      expect(service.update).toHaveBeenCalledWith(1, updatePermissionDto);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPermissionsService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updatePermissionDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updatePermissionDto)).rejects.toThrow('Permission not found');
    });

    it('should validate permission name is not empty on update', async () => {
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);

      await expect(controller.update('1', { name: '' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '' })).rejects.toThrow('Permission name cannot be empty');
    });

    it('should validate permission name is not just whitespace on update', async () => {
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);

      await expect(controller.update('1', { name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '   ' })).rejects.toThrow('Permission name cannot be empty');
    });

    it('should handle validation errors from service', async () => {
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);
      mockPermissionsService.update.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.update('1', updatePermissionDto)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing permission', async () => {
      mockPermissionsService.findOne.mockResolvedValue(mockPermission);
      mockPermissionsService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPermissionsService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Permission not found');
    });
  });
});
