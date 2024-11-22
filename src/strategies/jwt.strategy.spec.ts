import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../services/users.service';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    roles: [
      { id: 1, name: 'user' },
      { id: 2, name: 'admin' }
    ]
  };

  const mockUsersService = {
    findOne: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user data', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        roles: mockUser.roles.map(role => ({
          id: role.id,
          name: role.name
        }))
      });
      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 999, email: 'nonexistent@example.com' };
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
    });

    it('should throw UnauthorizedException when findOne throws error', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      mockUsersService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token')
      );
    });

    it('should properly map user roles', async () => {
      const payload = { sub: 1, email: 'test@example.com' };
      const userWithRoles = {
        ...mockUser,
        roles: [
          { id: 1, name: 'user', permissions: ['read'] },
          { id: 2, name: 'admin', permissions: ['read', 'write'] }
        ]
      };
      mockUsersService.findOne.mockResolvedValue(userWithRoles);

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual([
        { id: 1, name: 'user' },
        { id: 2, name: 'admin' }
      ]);
    });
  });

  describe('constructor', () => {
    it('should use correct jwt configuration', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
