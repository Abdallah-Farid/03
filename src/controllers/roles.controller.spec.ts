import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from '../services/roles.service';
import { Role } from '../entities/roles.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockPermission = {
    id: 1,
    name: 'create:users',
    roles: [],
  };

  const mockRole: Partial<Role> = {
    id: 1,
    name: 'Admin',
    permissions: [mockPermission as any],
  };

  const mockRolesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPermissions: jest.fn(),
    removePermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const roles = [mockRole];
      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll();

      expect(result).toEqual(roles);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single role', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRole);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Role not found');
    });
  });

  describe('create', () => {
    const createRoleDto: Partial<Role> = {
      name: 'Admin',
    };

    it('should create a new role', async () => {
      const newRole = { id: 2, ...createRoleDto };
      mockRolesService.create.mockResolvedValue(newRole);

      const result = await controller.create(createRoleDto);

      expect(result).toEqual(newRole);
      expect(service.create).toHaveBeenCalledWith(createRoleDto);
    });

    it('should validate role name is required', async () => {
      await expect(controller.create({})).rejects.toThrow(HttpException);
      await expect(controller.create({})).rejects.toThrow('Role name is required');
    });

    it('should validate role name is not empty', async () => {
      await expect(controller.create({ name: '' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '' })).rejects.toThrow('Role name is required');
    });

    it('should validate role name is not just whitespace', async () => {
      await expect(controller.create({ name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '   ' })).rejects.toThrow('Role name is required');
    });

    it('should handle validation errors from service', async () => {
      mockRolesService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(createRoleDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateRoleDto: Partial<Role> = {
      name: 'Super Admin',
    };

    it('should update an existing role', async () => {
      const updatedRole = { ...mockRole, ...updateRoleDto };
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.update.mockResolvedValue(updatedRole);

      const result = await controller.update('1', updateRoleDto);

      expect(result).toEqual(updatedRole);
      expect(service.update).toHaveBeenCalledWith(1, updateRoleDto);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateRoleDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateRoleDto)).rejects.toThrow('Role not found');
    });

    it('should validate role name is not empty on update', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      await expect(controller.update('1', { name: '' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '' })).rejects.toThrow('Role name cannot be empty');
    });

    it('should validate role name is not just whitespace on update', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      await expect(controller.update('1', { name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '   ' })).rejects.toThrow('Role name cannot be empty');
    });

    it('should handle validation errors from service', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.update.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.update('1', updateRoleDto)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing role', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Role not found');
    });
  });

  describe('updatePermissions', () => {
    const validPermissionUpdate = {
      permissionIds: [1, 2, 3],
      action: 'add' as const,
    };

    it('should add permissions to a role', async () => {
      const updatedRole = { ...mockRole, permissions: [...mockRole.permissions, { id: 2 }] };
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.addPermissions.mockResolvedValue(updatedRole);

      const result = await controller.updatePermissions('1', validPermissionUpdate);

      expect(result).toEqual(updatedRole);
      expect(service.addPermissions).toHaveBeenCalledWith(1, validPermissionUpdate.permissionIds);
    });

    it('should remove permissions from a role', async () => {
      const updateData = { ...validPermissionUpdate, action: 'remove' as const };
      const updatedRole = { ...mockRole, permissions: [] };
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.removePermissions.mockResolvedValue(updatedRole);

      const result = await controller.updatePermissions('1', updateData);

      expect(result).toEqual(updatedRole);
      expect(service.removePermissions).toHaveBeenCalledWith(1, updateData.permissionIds);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRolesService.findOne.mockResolvedValue(null);

      await expect(controller.updatePermissions('1', validPermissionUpdate)).rejects.toThrow(HttpException);
      await expect(controller.updatePermissions('1', validPermissionUpdate)).rejects.toThrow('Role not found');
    });

    it('should validate permissionIds is a non-empty array', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      await expect(controller.updatePermissions('1', { ...validPermissionUpdate, permissionIds: [] }))
        .rejects.toThrow(HttpException);
      await expect(controller.updatePermissions('1', { ...validPermissionUpdate, permissionIds: [] }))
        .rejects.toThrow('Permission IDs must be a non-empty array');
    });

    it('should validate permissionIds is provided', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      await expect(controller.updatePermissions('1', { action: 'add' } as any))
        .rejects.toThrow(HttpException);
      await expect(controller.updatePermissions('1', { action: 'add' } as any))
        .rejects.toThrow('Permission IDs must be a non-empty array');
    });

    it('should validate action is either "add" or "remove"', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      await expect(controller.updatePermissions('1', { ...validPermissionUpdate, action: 'invalid' as any }))
        .rejects.toThrow(HttpException);
      await expect(controller.updatePermissions('1', { ...validPermissionUpdate, action: 'invalid' as any }))
        .rejects.toThrow('Action must be either "add" or "remove"');
    });

    it('should handle validation errors from service', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);
      mockRolesService.addPermissions.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.updatePermissions('1', validPermissionUpdate)).rejects.toThrow();
    });
  });
});
