import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { Role } from '../entities/roles.entity';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      const defaultRole = { id: 1, name: 'user' };
      const hashedPassword = 'hashedpassword123';

      // Mock bcrypt hash
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(defaultRole as Role);
      jest.spyOn(usersRepository, 'create').mockReturnValue({
        ...userData,
        id: 1,
        password: hashedPassword,
        roles: [defaultRole],
      } as User);
      jest.spyOn(usersRepository, 'save').mockResolvedValue({
        ...userData,
        id: 1,
        password: hashedPassword,
        roles: [defaultRole],
      } as User);

      const result = await service.create(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('user');
      expect(await bcrypt.compare(userData.password, result.password)).toBe(true);
    });

    it('should throw conflict exception if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue({ id: 1 } as User);

      await expect(service.create(userData)).rejects.toThrow(
        new HttpException('User with this email already exists', HttpStatus.CONFLICT),
      );
    });

    it('should throw error if default role not found', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(userData)).rejects.toThrow(
        new HttpException('Default role not found', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        { id: 1, email: 'user1@example.com', roles: [] },
        { id: 2, email: 'user2@example.com', roles: [] },
      ];

      jest.spyOn(usersRepository, 'find').mockResolvedValue(users as User[]);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(usersRepository.find).toHaveBeenCalledWith({ relations: ['roles'] });
    });

    it('should handle errors when fetching users', async () => {
      jest.spyOn(usersRepository, 'find').mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        roles: [],
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);

      const result = await service.findOne(1);
      expect(result).toEqual(user);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['roles'],
      });
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        roles: [],
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(user);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['roles'],
      });
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('update', () => {
    it('should successfully update a user', async () => {
      const userId = 1;
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const existingUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [],
      };

      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(existingUser as User);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(updatedUser as User);

      const result = await service.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should hash password when updating password', async () => {
      const userId = 1;
      const updateData = {
        password: 'newpassword123',
      };

      const existingUser = {
        id: userId,
        email: 'test@example.com',
        password: 'oldhashedpassword',
        roles: [],
      };

      const hashedPassword = 'hashedpassword123';

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(existingUser as User);
      jest.spyOn(usersRepository, 'save').mockImplementation(async (user) => user as User);

      const result = await service.update(userId, updateData);

      expect(await bcrypt.compare(updateData.password, result.password)).toBe(true);
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, { firstName: 'Test' })).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      const userId = 1;
      const user = { id: userId, email: 'test@example.com', roles: [] };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(usersRepository, 'remove').mockResolvedValue(user as User);

      await service.remove(userId);

      expect(usersRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('assignRole', () => {
    it('should successfully assign a role to a user', async () => {
      const userId = 1;
      const roleName = 'admin';
      const user = {
        id: userId,
        email: 'test@example.com',
        roles: [{ id: 1, name: 'user' }],
      };
      const role = { id: 2, name: roleName };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(role as Role);
      jest.spyOn(usersRepository, 'save').mockImplementation(async (user) => user as User);

      const result = await service.assignRole(userId, roleName);

      expect(result.roles).toHaveLength(2);
      expect(result.roles).toContainEqual(role);
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.assignRole(999, 'admin')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw not found exception if role does not exist', async () => {
      const user = { id: 1, email: 'test@example.com', roles: [] };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.assignRole(1, 'nonexistent')).rejects.toThrow(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw bad request if user already has the role', async () => {
      const userId = 1;
      const roleName = 'admin';
      const role = { id: 1, name: roleName };
      const user = {
        id: userId,
        email: 'test@example.com',
        roles: [role],
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(role as Role);

      await expect(service.assignRole(userId, roleName)).rejects.toThrow(
        new HttpException('User already has this role', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('removeRole', () => {
    it('should successfully remove a role from a user', async () => {
      const userId = 1;
      const roleId = 2;
      const role = { id: roleId, name: 'admin' };
      const user = {
        id: userId,
        email: 'test@example.com',
        roles: [{ id: 1, name: 'user' }, role],
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(role as Role);
      jest.spyOn(usersRepository, 'save').mockImplementation(async (user) => user as User);

      const result = await service.removeRole(userId, roleId);

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('user');
    });

    it('should throw not found exception if user does not exist', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeRole(999, 1)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw not found exception if role does not exist', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        roles: [{ id: 1, name: 'user' }],
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeRole(1, 999)).rejects.toThrow(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
