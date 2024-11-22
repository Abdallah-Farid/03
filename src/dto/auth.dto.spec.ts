import { validate } from 'class-validator';
import { LoginDto, RegisterDto } from './auth.dto';

describe('AuthDto', () => {
  describe('LoginDto', () => {
    it('should validate valid login data', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate invalid email', async () => {
      const dto = new LoginDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should validate short password', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = '123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });

  describe('RegisterDto', () => {
    it('should validate valid registration data', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate invalid email', async () => {
      const dto = new RegisterDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should validate short password', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = '123';
      dto.username = 'testuser';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should validate missing username', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate missing firstName', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate missing lastName', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.firstName = 'Test';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});
