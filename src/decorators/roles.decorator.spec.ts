import { ROLES_KEY, Roles } from './roles.decorator';

describe('RolesDecorator', () => {
  it('should set metadata with roles', () => {
    // Create a test class with the Roles decorator
    @Roles('admin', 'user')
    class TestClass {}

    // Get the metadata
    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);

    // Verify the metadata
    expect(metadata).toEqual(['admin', 'user']);
  });

  it('should set metadata with single role', () => {
    // Create a test class with a single role
    @Roles('admin')
    class TestClass {}

    // Get the metadata
    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);

    // Verify the metadata
    expect(metadata).toEqual(['admin']);
  });

  it('should set metadata with no roles', () => {
    // Create a test class with no roles
    @Roles()
    class TestClass {}

    // Get the metadata
    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);

    // Verify the metadata
    expect(metadata).toEqual([]);
  });
});
