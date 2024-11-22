import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../entities/roles.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/users.entity';
import { RegisterDto, UserRole } from '../dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let roleRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    roleRepository = module.get(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should successfully validate a user with correct credentials', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        username: 'testuser',
        roles: [],
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(testUser as User);

      const result = await service.validateUser('test@example.com', 'password123');
      
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe(testUser.email);
      expect(result.username).toBe(testUser.username);
    });

    it('should throw unauthorized exception for invalid password', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        username: 'testuser',
        roles: [],
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(testUser as User);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow(new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED));
    });

    it('should throw not found exception for non-existent user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow(new HttpException('User not found', HttpStatus.NOT_FOUND));
    });

    it('should handle internal server error', async () => {
      jest.spyOn(usersService, 'findByEmail').mockRejectedValue(new Error('Database error'));

      await expect(
        service.validateUser('test@example.com', 'password123')
      ).rejects.toThrow(new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR));
    });
  });

  describe('login', () => {
    it('should generate access token and return user data', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        roles: [{ id: 1, name: 'user' }],
      };

      const mockToken = 'mock.jwt.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login(testUser);

      expect(result).toBeDefined();
      expect(result.access_token).toBe(mockToken);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(testUser.id);
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.username).toBe(testUser.username);
      expect(result.user.roles).toEqual(testUser.roles);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: testUser.email,
        sub: testUser.id,
        roles: ['user'],
      });
    });

    it('should handle login errors', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      const testUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        roles: [{ id: 1, name: 'user' }],
      };

      await expect(service.login(testUser)).rejects.toThrow(
        new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      const userRole = { id: 1, name: UserRole.USER };
      const createdUser = {
        id: 1,
        ...registerDto,
        roles: [userRole],
      };

      const mockToken = 'mock.jwt.token';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(userRole);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUser as User);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.access_token).toBe(mockToken);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.username).toBe(registerDto.username);
      expect(result.user.roles).toEqual([userRole]);
    });

    it('should throw conflict exception if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
        firstName: 'Existing',
        lastName: 'User',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({ id: 1 } as User);

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('User already exists', HttpStatus.CONFLICT)
      );
    });

    it('should throw bad request if role not found', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException(`Role ${UserRole.ADMIN} not found`, HttpStatus.BAD_REQUEST)
      );
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      const userRole = { id: 1, name: UserRole.USER };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(userRole);
      jest.spyOn(usersService, 'create').mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });
  });
});
