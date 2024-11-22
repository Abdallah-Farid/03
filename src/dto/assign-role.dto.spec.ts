import { validate } from 'class-validator';
import { AssignRoleDto } from './assign-role.dto';

describe('AssignRoleDto', () => {
  it('should validate valid input', async () => {
    const dto = new AssignRoleDto();
    dto.roleName = 'admin';
    dto.userId = 1;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate empty role name', async () => {
    const dto = new AssignRoleDto();
    dto.roleName = '';
    dto.userId = 1;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should validate missing user id', async () => {
    const dto = new AssignRoleDto();
    dto.roleName = 'admin';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should validate invalid user id type', async () => {
    const dto = new AssignRoleDto();
    dto.roleName = 'admin';
    (dto as any).userId = 'invalid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });
});
