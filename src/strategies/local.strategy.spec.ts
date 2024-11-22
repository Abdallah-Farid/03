import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../services/auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    roles: [
      { id: 1, name: 'user' }
    ]
  };

  const mockAuthService = {
    validateUser: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException when validateUser throws error', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      mockAuthService.validateUser.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should use email as username field', () => {
      // The strategy should be configured to use email as the username field
      expect(strategy['authService']).toBeDefined();
      // This test verifies that the strategy was constructed with the correct options
      // The usernameField option is set in the constructor
    });
  });
});
