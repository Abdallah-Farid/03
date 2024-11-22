import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { User } from '../entities/users.entity';
import { Role } from '../entities/roles.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AssignRoleDto } from '../dto/assign-role.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockRole: Partial<Role> = {
    id: 1,
    name: 'admin',
  };

  const mockUser: Partial<User> = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    roles: [mockRole as Role],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignRole: jest.fn(),
    removeRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    const updateUserDto: Partial<User> = {
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
    };

    it('should update an existing user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateUserDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateUserDto)).rejects.toThrow('User not found');
    });

    it('should validate email format', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.update('1', { email: 'invalid-email' }))
        .rejects.toThrow(HttpException);
      await expect(controller.update('1', { email: 'invalid-email' }))
        .rejects.toThrow('Invalid email format');
    });

    it('should validate username is not empty', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.update('1', { username: '' }))
        .rejects.toThrow(HttpException);
      await expect(controller.update('1', { username: '' }))
        .rejects.toThrow('Username cannot be empty');
    });

    it('should validate username is not just whitespace', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.update('1', { username: '   ' }))
        .rejects.toThrow(HttpException);
      await expect(controller.update('1', { username: '   ' }))
        .rejects.toThrow('Username cannot be empty');
    });

    it('should validate password length', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.update('1', { password: '12345' }))
        .rejects.toThrow(HttpException);
      await expect(controller.update('1', { password: '12345' }))
        .rejects.toThrow('Password must be at least 6 characters');
    });

    it('should handle validation errors from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.update('1', updateUserDto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete an existing user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.remove.mockResolvedValue(undefined);

      await expect(controller.remove('1')).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.remove('1')).rejects.toThrow(HttpException);
      await expect(controller.remove('1')).rejects.toThrow('User not found');
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      userId: 1,
      roleName: 'admin',
    };

    it('should assign a role to a user', async () => {
      const updatedUser = { ...mockUser, roles: [...mockUser.roles, { id: 2, name: 'new-role' }] };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.assignRole.mockResolvedValue(updatedUser);

      const result = await controller.assignRole(assignRoleDto);

      expect(result).toEqual(updatedUser);
      expect(service.assignRole).toHaveBeenCalledWith(assignRoleDto.userId, assignRoleDto.roleName);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.assignRole(assignRoleDto)).rejects.toThrow(HttpException);
      await expect(controller.assignRole(assignRoleDto)).rejects.toThrow('User not found');
    });

    it('should validate role name is not empty', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.assignRole({ ...assignRoleDto, roleName: '' }))
        .rejects.toThrow(HttpException);
      await expect(controller.assignRole({ ...assignRoleDto, roleName: '' }))
        .rejects.toThrow('Role name cannot be empty');
    });

    it('should validate role name is not just whitespace', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(controller.assignRole({ ...assignRoleDto, roleName: '   ' }))
        .rejects.toThrow(HttpException);
      await expect(controller.assignRole({ ...assignRoleDto, roleName: '   ' }))
        .rejects.toThrow('Role name cannot be empty');
    });

    it('should handle validation errors from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.assignRole.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.assignRole(assignRoleDto)).rejects.toThrow();
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      const updatedUser = { ...mockUser, roles: [] };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.removeRole.mockResolvedValue(updatedUser);

      const result = await controller.removeRole('1', '1');

      expect(result).toEqual(updatedUser);
      expect(service.removeRole).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(controller.removeRole('1', '1')).rejects.toThrow(HttpException);
      await expect(controller.removeRole('1', '1')).rejects.toThrow('User not found');
    });

    it('should handle validation errors from service', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.removeRole.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.removeRole('1', '1')).rejects.toThrow();
    });
  });
});
