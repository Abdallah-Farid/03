import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/services/auth.service';
import { UsersService } from '../src/services/users.service';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let itemId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get JWT token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });

    jwtToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Inventory Items', () => {
    it('should create an inventory item', async () => {
      const response = await request(app.getHttpServer())
        .post('/inventory-items')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Test Item',
          description: 'Test Description',
          quantity: 100,
          unitPrice: 9.99
        })
        .expect(201);

      itemId = response.body.id;
      expect(response.body.name).toBe('Test Item');
    });

    it('should get all inventory items', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory-items')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update an inventory item', async () => {
      await request(app.getHttpServer())
        .patch(`/inventory-items/${itemId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Updated Test Item',
          quantity: 150
        })
        .expect(200);
    });
  });

  describe('Inventory Transactions', () => {
    it('should create an inventory transaction', async () => {
      const transaction = {
        inventoryItemId: itemId,
        quantity: 10,
        type: 'IN',
        notes: 'Test transaction'
      };

      await request(app.getHttpServer())
        .post('/inventory-transactions')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(transaction)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe(transaction.type);
          expect(res.body.quantity).toBe(transaction.quantity);
        });
    });

    it('should get transaction history', async () => {
      await request(app.getHttpServer())
        .get(`/inventory-transactions/item/${itemId}/history`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should get running balance', async () => {
      await request(app.getHttpServer())
        .get(`/inventory-transactions/item/${itemId}/balance`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toBe('number');
        });
    });
  });
});
