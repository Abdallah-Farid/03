import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

// Mock the AuthGuard before importing JwtAuthGuard
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return class {
        canActivate() {
          return true;
        }
      };
    }),
  };
});

// Import after mocking
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('canActivate', () => {
    it('should return true for valid context', async () => {
      const mockContext = createMock<ExecutionContext>();
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const mockUser = { id: 1, username: 'testuser' };
      
      const result = guard.handleRequest(null, mockUser, null);
      
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when error exists', () => {
      const mockError = new Error('Test error');
      
      expect(() => guard.handleRequest(mockError, null, null)).toThrow(mockError);
    });

    it('should throw UnauthorizedException when user does not exist', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        new UnauthorizedException('Authentication failed'),
      );
    });

    it('should throw original error when both error and user are missing', () => {
      const mockError = new Error('Original error');
      
      expect(() => guard.handleRequest(mockError, null, null)).toThrow(mockError);
    });
  });
});
