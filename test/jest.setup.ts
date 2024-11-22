import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/services/auth.service';
import { UsersService } from '../src/services/users.service';
import { RolesService } from '../src/services/roles.service';

let app: INestApplication;
let moduleRef: TestingModule;

beforeAll(async () => {
  // Load environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USERNAME = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_DATABASE = 'logimate_test';
  process.env.JWT_SECRET = 'test-secret';

  // Create test module
  moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  // Get services
  const authService = moduleRef.get(AuthService);
  const usersService = moduleRef.get(UsersService);
  const rolesService = moduleRef.get(RolesService);

  // Create admin role if not exists
  let adminRole = await rolesService.findByName('admin');
  if (!adminRole) {
    adminRole = await rolesService.create({ name: 'admin' });
  }

  // Create test user if not exists
  const testUser = await usersService.findByEmail('admin@example.com');
  if (!testUser) {
    await usersService.create({
      email: 'admin@example.com',
      password: 'admin123',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      roles: [adminRole]
    });
  }
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});
