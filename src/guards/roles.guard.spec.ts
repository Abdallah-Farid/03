import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { createMock } from '@golevelup/ts-jest';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const context = createMock<ExecutionContext>();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {
          roles: [{ name: 'admin' }]
        }
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return false when user does not have required role', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {
          roles: [{ name: 'user' }]
        }
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {
          roles: []
        }
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has undefined roles', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {}
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should handle multiple required roles', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {
          roles: [{ name: 'admin' }, { name: 'user' }]
        }
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'superuser']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(true); // Should return true as user has 'admin' role
    });

    it('should check roles case-sensitively', () => {
      const context = createMock<ExecutionContext>();
      const mockRequest = {
        user: {
          roles: [{ name: 'Admin' }]
        }
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(context, 'switchToHttp').mockReturnValue({
        getRequest: () => mockRequest
      } as any);

      const result = guard.canActivate(context);

      expect(result).toBe(false); // Should return false as 'Admin' !== 'admin'
    });
  });
});
