import { validate } from 'class-validator';
import { CreateUserDto, UpdateUserDto } from './user.dto';

describe('UserDto', () => {
  describe('CreateUserDto', () => {
    it('should validate valid user data', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate invalid email', async () => {
      const dto = new CreateUserDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should validate short password', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = '123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should validate missing firstName', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate missing lastName', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should validate optional roleIds', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      dto.roleIds = [1, 2, 3];

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate invalid roleIds type', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';
      (dto as any).roleIds = 'invalid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isArray');
    });
  });

  describe('UpdateUserDto', () => {
    it('should validate valid update data', async () => {
      const dto = new UpdateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.firstName = 'Test';
      dto.lastName = 'User';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate invalid email', async () => {
      const dto = new UpdateUserDto();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should validate short password', async () => {
      const dto = new UpdateUserDto();
      dto.password = '123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should validate empty update', async () => {
      const dto = new UpdateUserDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
