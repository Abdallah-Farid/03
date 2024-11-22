import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../entities/roles.entity';
import { Permission } from '../entities/permissions.entity';
import { Repository } from 'typeorm';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: Repository<Role>;

  const mockPermission1: Permission = {
    id: 1,
    name: 'read',
    roles: [],
  };

  const mockPermission2: Permission = {
    id: 2,
    name: 'write',
    roles: [],
  };

  const mockPermission3: Permission = {
    id: 3,
    name: 'delete',
    roles: [],
  };

  const mockRole: Role = {
    id: 1,
    name: 'admin',
    users: [],
    permissions: [],
  };

  const mockRoleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const roles = [mockRole];
      jest.spyOn(roleRepository, 'find').mockResolvedValue(roles);

      const result = await service.findAll();
      expect(result).toEqual(roles);
      expect(roleRepository.find).toHaveBeenCalledWith({
        relations: ['permissions', 'users'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole);

      const result = await service.findOne(1);
      expect(result).toEqual(mockRole);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['permissions', 'users'],
      });
    });

    it('should return null if role not found', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a role by name', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole);

      const result = await service.findByName('admin');
      expect(result).toEqual(mockRole);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
        relations: ['permissions', 'users'],
      });
    });

    it('should return null if role not found', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByName('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = { name: 'new-role' };
      const newRole = { ...mockRole, ...createRoleDto };

      jest.spyOn(roleRepository, 'create').mockReturnValue(newRole);
      jest.spyOn(roleRepository, 'save').mockResolvedValue(newRole);

      const result = await service.create(createRoleDto);
      expect(result).toEqual(newRole);
      expect(roleRepository.create).toHaveBeenCalledWith(createRoleDto);
      expect(roleRepository.save).toHaveBeenCalledWith(newRole);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateRoleDto = { name: 'updated-role' };
      const updatedRole = { ...mockRole, ...updateRoleDto };

      jest.spyOn(roleRepository, 'update').mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(updatedRole);

      const result = await service.update(1, updateRoleDto);
      expect(result).toEqual(updatedRole);
      expect(roleRepository.update).toHaveBeenCalledWith(1, updateRoleDto);
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      jest.spyOn(roleRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      await service.delete(1);
      expect(roleRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('addPermissions', () => {
    it('should add permissions to a role', async () => {
      const permissionIds = [1, 2];
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission1, mockPermission2],
      };

      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockRole);
      jest.spyOn(roleRepository, 'save').mockResolvedValue(roleWithPermissions);

      const result = await service.addPermissions(1, permissionIds);
      expect(result).toEqual(roleWithPermissions);
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should return null if role not found', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      const result = await service.addPermissions(999, [1, 2]);
      expect(result).toBeNull();
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from a role', async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission1, mockPermission2, mockPermission3],
      };
      const permissionIdsToRemove = [1, 2];
      const roleAfterRemoval = {
        ...mockRole,
        permissions: [mockPermission3],
      };

      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(roleWithPermissions);
      jest.spyOn(roleRepository, 'save').mockResolvedValue(roleAfterRemoval);

      const result = await service.removePermissions(1, permissionIdsToRemove);
      expect(result).toEqual(roleAfterRemoval);
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should return null if role not found', async () => {
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      const result = await service.removePermissions(999, [1, 2]);
      expect(result).toBeNull();
    });
  });
});
