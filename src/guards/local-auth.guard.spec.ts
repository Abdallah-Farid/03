import { ExecutionContext } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

// Mock AuthGuard before importing LocalAuthGuard
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
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(() => {
    guard = new LocalAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid context', async () => {
      const mockContext = createMock<ExecutionContext>();
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
    });
  });
});
