import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from '../entities/permissions.entity';
import { Role } from '../entities/roles.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: Repository<Permission>;

  const mockRole: Role = {
    id: 1,
    name: 'Admin',
    permissions: [],
    users: []
  };

  const mockPermission: Permission = {
    id: 1,
    name: 'create:orders',
    roles: [mockRole]
  };

  const mockPermissionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of permissions', async () => {
      const permissions = [mockPermission];
      jest.spyOn(permissionRepository, 'find').mockResolvedValue(permissions);

      const result = await service.findAll();
      expect(result).toEqual(permissions);
      expect(permissionRepository.find).toHaveBeenCalledWith({
        relations: ['roles'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single permission', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValue(mockPermission);

      const result = await service.findOne(1);
      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['roles'],
      });
    });

    it('should return null if permission not found', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a permission by name', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValue(mockPermission);

      const result = await service.findByName('create:orders');
      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'create:orders' },
        relations: ['roles'],
      });
    });

    it('should return null if permission not found', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByName('nonexistent:permission');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new permission', async () => {
      const createPermissionDto = {
        name: 'create:orders',
      };
      const newPermission = { ...mockPermission };

      jest.spyOn(permissionRepository, 'create').mockReturnValue(newPermission);
      jest.spyOn(permissionRepository, 'save').mockResolvedValue(newPermission);

      const result = await service.create(createPermissionDto);
      expect(result).toEqual(newPermission);
      expect(permissionRepository.create).toHaveBeenCalledWith(createPermissionDto);
      expect(permissionRepository.save).toHaveBeenCalledWith(newPermission);
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const updatePermissionDto = { name: 'update:orders' };
      const updatedPermission = { ...mockPermission, ...updatePermissionDto };

      jest.spyOn(permissionRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValue(updatedPermission);

      const result = await service.update(1, updatePermissionDto);
      expect(result).toEqual(updatedPermission);
      expect(permissionRepository.update).toHaveBeenCalledWith(1, updatePermissionDto);
    });
  });

  describe('delete', () => {
    it('should delete a permission', async () => {
      jest.spyOn(permissionRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(permissionRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findByRoleId', () => {
    it('should return permissions for a specific role', async () => {
      const permissions = [mockPermission];
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(permissions),
      };

      jest.spyOn(permissionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByRoleId(1);
      expect(result).toEqual(permissions);
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('permission.roles', 'role');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.id = :roleId', { roleId: 1 });
    });

    it('should return empty array if no permissions found', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(permissionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByRoleId(999);
      expect(result).toEqual([]);
    });
  });
});
