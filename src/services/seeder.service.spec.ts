import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SeederService } from './seeder.service';
import { Role } from '../entities/roles.entity';

describe('SeederService', () => {
  let service: SeederService;
  let roleRepository: Repository<Role>;

  const mockRole = {
    id: 1,
    name: 'admin',
    permissions: [],
    users: []
  } as Role;

  const mockRoleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<SeederService>(SeederService);
    roleRepository = module.get<Repository<Role>>(
      getRepositoryToken(Role),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should call seedRoles on bootstrap', async () => {
      const seedRolesSpy = jest.spyOn(service, 'seedRoles');
      
      await service.onApplicationBootstrap();
      
      expect(seedRolesSpy).toHaveBeenCalled();
    });
  });

  describe('seedRoles', () => {
    const expectedRoles = ['admin', 'user', 'inventory-manager', 'order-manager', 'notification-manager'];

    it('should create roles that do not exist', async () => {
      // Mock that no roles exist
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'create').mockImplementation((dto) => ({
        ...mockRole,
        ...dto,
      } as Role));
      jest.spyOn(roleRepository, 'save').mockImplementation(async (role) => role as Role);

      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log');

      await service.seedRoles();

      // Verify findOne was called for each role
      expect(roleRepository.findOne).toHaveBeenCalledTimes(expectedRoles.length);
      expectedRoles.forEach(roleName => {
        expect(roleRepository.findOne).toHaveBeenCalledWith({
          where: { name: roleName },
        });
      });

      // Verify create was called for each role
      expect(roleRepository.create).toHaveBeenCalledTimes(expectedRoles.length);
      expectedRoles.forEach(roleName => {
        expect(roleRepository.create).toHaveBeenCalledWith({ name: roleName });
      });

      // Verify save was called for each role
      expect(roleRepository.save).toHaveBeenCalledTimes(expectedRoles.length);

      // Verify console.log was called for each role
      expect(consoleLogSpy).toHaveBeenCalledTimes(expectedRoles.length);
      expectedRoles.forEach(roleName => {
        expect(consoleLogSpy).toHaveBeenCalledWith(`Created role: ${roleName}`);
      });
    });

    it('should not create roles that already exist', async () => {
      // Mock that all roles exist
      jest.spyOn(roleRepository, 'findOne').mockImplementation(async ({ where }) => ({
        ...mockRole,
        name: (where as { name: string }).name,
      } as Role));
      jest.spyOn(roleRepository, 'create');
      jest.spyOn(roleRepository, 'save');

      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log');

      await service.seedRoles();

      // Verify findOne was called for each role
      expect(roleRepository.findOne).toHaveBeenCalledTimes(expectedRoles.length);
      expectedRoles.forEach(roleName => {
        expect(roleRepository.findOne).toHaveBeenCalledWith({
          where: { name: roleName },
        });
      });

      // Verify create and save were not called
      expect(roleRepository.create).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();

      // Verify console.log was not called
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle mixed scenario of existing and non-existing roles', async () => {
      // Mock that only 'admin' and 'user' roles exist
      const existingRoles = ['admin', 'user'];
      jest.spyOn(roleRepository, 'findOne').mockImplementation(async ({ where }) => {
        const roleName = (where as { name: string }).name;
        if (existingRoles.includes(roleName)) {
          return { ...mockRole, name: roleName } as Role;
        }
        return null;
      });
      jest.spyOn(roleRepository, 'create').mockImplementation((dto) => ({
        ...mockRole,
        ...dto,
      } as Role));
      jest.spyOn(roleRepository, 'save').mockImplementation(async (role) => role as Role);

      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log');

      await service.seedRoles();

      // Verify findOne was called for each role
      expect(roleRepository.findOne).toHaveBeenCalledTimes(expectedRoles.length);

      // Calculate number of roles that should be created
      const rolesToCreate = expectedRoles.filter(role => !existingRoles.includes(role));

      // Verify create and save were called only for non-existing roles
      expect(roleRepository.create).toHaveBeenCalledTimes(rolesToCreate.length);
      expect(roleRepository.save).toHaveBeenCalledTimes(rolesToCreate.length);

      // Verify console.log was called only for created roles
      expect(consoleLogSpy).toHaveBeenCalledTimes(rolesToCreate.length);
      rolesToCreate.forEach(roleName => {
        expect(consoleLogSpy).toHaveBeenCalledWith(`Created role: ${roleName}`);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(roleRepository, 'findOne').mockRejectedValue(new Error('Database error'));

      await expect(service.seedRoles()).rejects.toThrow('Database error');
      
      // Verify create and save were not called after error
      expect(roleRepository.create).not.toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });
  });
});
