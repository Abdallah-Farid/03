import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { RegisterDto, UserRole } from '../dto/auth.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return login response', async () => {
      const loginResponse = {
        access_token: 'mock-jwt-token',
        user: mockUser,
      };
      mockAuthService.login.mockResolvedValue(loginResponse);

      const req = { user: mockUser };
      const result = await controller.login(req);

      expect(result).toEqual(loginResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValue(
        new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED),
      );

      const req = { user: mockUser };
      await expect(controller.login(req)).rejects.toThrow(HttpException);
      await expect(controller.login(req)).rejects.toThrow('Invalid credentials');
    });

    it('should handle missing user in request', async () => {
      const req = {};
      await expect(controller.login(req)).rejects.toThrow(HttpException);
      await expect(controller.login(req)).rejects.toThrow('User not found in request');
    });

    it('should handle internal server errors during login', async () => {
      mockAuthService.login.mockRejectedValue(new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR));

      const req = { user: mockUser };
      const result = controller.login(req);
      await expect(result).rejects.toThrow(HttpException);
      await expect(result).rejects.toThrow('Internal server error');
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const registeredUser = {
        id: 2,
        email: registerDto.email,
        username: registerDto.username,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
      };

      mockAuthService.register.mockResolvedValue(registeredUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(registeredUser);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'existinguser',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockAuthService.register.mockRejectedValue(
        new HttpException('User already exists', HttpStatus.CONFLICT),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(HttpException);
      await expect(controller.register(registerDto)).rejects.toThrow('User already exists');
    });

    it('should register user with default role when role is not provided', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
      };

      const registeredUser = {
        id: 2,
        email: registerDto.email,
        username: registerDto.username,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER, // Default role
      };

      mockAuthService.register.mockResolvedValue(registeredUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(registeredUser);
      expect(authService.register).toHaveBeenCalledWith({
        ...registerDto,
        role: UserRole.USER,
      });
    });

    it('should handle invalid role in registration', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: 'invalid-role',
      };

      await expect(controller.register(registerDto as RegisterDto)).rejects.toThrow(HttpException);
      await expect(controller.register(registerDto as RegisterDto)).rejects.toThrow('Invalid role');
    });

    it('should handle internal server errors during registration', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      mockAuthService.register.mockRejectedValue(new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR));

      const result = controller.register(registerDto);
      await expect(result).rejects.toThrow(HttpException);
      await expect(result).rejects.toThrow('Registration failed');
    });

    it('should register admin user', async () => {
      const registerDto: RegisterDto = {
        email: 'admin@example.com',
        password: 'password123',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const registeredUser = {
        access_token: 'mock-jwt-token',
        user: {
          id: 3,
          email: registerDto.email,
          username: registerDto.username,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          roles: [{ name: UserRole.ADMIN }],
        },
      };

      mockAuthService.register.mockResolvedValue(registeredUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(registeredUser);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.user.roles[0].name).toBe(UserRole.ADMIN);
    });
  });
});
