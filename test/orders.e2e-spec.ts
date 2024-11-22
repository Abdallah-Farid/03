import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SeederService } from '../src/services/seeder.service';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let seederService: SeederService;
  let jwtToken: string;
  let orderId: number;
  let itemId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    seederService = moduleFixture.get<SeederService>(SeederService);
    
    // Initialize the database with roles
    await seederService.seedRoles();
    
    await app.init();

    // Login as admin to get token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });

    jwtToken = response.body.access_token;

    // Create a test inventory item
    const itemResponse = await request(app.getHttpServer())
      .post('/inventory-items')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Test Item for Order',
        description: 'Test Description',
        sku: 'ORDER123',
        quantity: 100,
        reorderPoint: 10,
        unitPrice: 9.99
      });

    itemId = itemResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Orders', () => {
    const testOrder = {
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      status: 'PENDING',
      items: [
        {
          inventoryItemId: 1, // Will be updated with actual itemId
          quantity: 5,
          unitPrice: 9.99
        }
      ]
    };

    beforeEach(() => {
      testOrder.items[0].inventoryItemId = itemId;
    });

    it('should create a new order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(testOrder)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.customerName).toBe(testOrder.customerName);
          orderId = res.body.id;
        });
    });

    it('should get all orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should get a specific order', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orderId);
          expect(res.body.customerName).toBe(testOrder.customerName);
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should update order status', () => {
      return request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ status: 'PROCESSING' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('PROCESSING');
        });
    });

    it('should get order history', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}/history`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Order Items', () => {
    it('should add item to order', () => {
      const newItem = {
        inventoryItemId: itemId,
        quantity: 3,
        unitPrice: 9.99
      };

      return request(app.getHttpServer())
        .post(`/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newItem)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.quantity).toBe(newItem.quantity);
        });
    });

    it('should update order item quantity', () => {
      const updateData = {
        quantity: 4
      };

      return request(app.getHttpServer())
        .put(`/orders/${orderId}/items/1`) // Assuming first item has ID 1
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.quantity).toBe(updateData.quantity);
        });
    });

    it('should remove item from order', () => {
      return request(app.getHttpServer())
        .delete(`/orders/${orderId}/items/1`) // Assuming first item has ID 1
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });
});
