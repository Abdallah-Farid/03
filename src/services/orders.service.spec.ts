import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from '../entities/orders.entity';
import { Customer } from '../entities/customers.entity';
import { OrderItem } from '../entities/order-items.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { HttpException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let customerRepository: Repository<Customer>;
  let orderItemRepository: Repository<OrderItem>;
  let inventoryItemRepository: Repository<InventoryItem>;

  const mockOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
  };

  const mockOrderItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInventoryItemRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryItemRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    customerRepository = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    inventoryItemRepository = module.get<Repository<InventoryItem>>(
      getRepositoryToken(InventoryItem),
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const expectedOrders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(expectedOrders);

      const result = await service.findAll();
      expect(result).toEqual(expectedOrders);
      expect(mockOrderRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const expectedOrder = {
        id: 1,
        status: 'Pending',
        customer: { id: 1, name: 'Test Customer' },
      };
      mockOrderRepository.findOne.mockResolvedValue(expectedOrder);

      const result = await service.findOne(1);
      expect(result).toEqual(expectedOrder);
      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['customer', 'orderItems', 'orderItems.inventoryItem'],
      });
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const customer = { id: 1, name: 'Test Customer' };
      const inventoryItem = {
        id: 1,
        name: 'Test Item',
        unitPrice: 10.99,
        price: 9.99,
      };
      const createOrderDto: CreateOrderDto = {
        customerId: 1,
        status: 'Pending',
        orderItems: [{ inventoryItemId: 1, quantity: 2 }],
      };

      const savedOrder = {
        id: 1,
        status: 'Pending',
        customer,
      };

      const savedOrderItem = {
        id: 1,
        order: savedOrder,
        inventoryItem,
        quantity: 2,
        unitPrice: 10.99,
        price: 9.99,
        totalPrice: 21.98,
      };

      const finalOrder = {
        ...savedOrder,
        orderItems: [savedOrderItem],
        totalAmount: 21.98,
      };

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockInventoryItemRepository.findOne.mockResolvedValue(inventoryItem);
      mockOrderRepository.create.mockReturnValue(savedOrder);
      mockOrderRepository.save.mockResolvedValue(savedOrder);
      mockOrderItemRepository.create.mockReturnValue(savedOrderItem);
      mockOrderItemRepository.save.mockResolvedValue(savedOrderItem);
      mockOrderRepository.findOne.mockResolvedValue(finalOrder);

      const result = await service.create(createOrderDto);
      expect(result).toEqual(finalOrder);
      expect(mockOrderRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockOrderItemRepository.create).toHaveBeenCalled();
      expect(mockOrderItemRepository.save).toHaveBeenCalled();
    });

    it('should throw an error if customer is not found', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: 999,
        status: 'Pending',
        orderItems: [{ inventoryItemId: 1, quantity: 2 }],
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Customer not found',
      );
    });

    it('should throw an error if inventory item is not found', async () => {
      const customer = { id: 1, name: 'Test Customer' };
      const createOrderDto: CreateOrderDto = {
        customerId: 1,
        status: 'Pending',
        orderItems: [{ inventoryItemId: 999, quantity: 2 }],
      };

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockInventoryItemRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Inventory item 999 not found',
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByCustomer(1);
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { customer: { id: 1 } },
        relations: ['customer', 'orderItems', 'orderItems.inventoryItem'],
      });
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const updateOrderDto = { status: 'Completed' as const };
      const updatedOrder = {
        id: 1,
        status: 'Completed',
        customer: { id: 1, name: 'Test Customer' },
      };

      mockOrderRepository.findOne.mockResolvedValue(updatedOrder);
      mockOrderRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      const result = await service.update(1, updateOrderDto);
      expect(result).toEqual(updatedOrder);
      expect(mockOrderRepository.update).toHaveBeenCalledWith(1, updateOrderDto);
    });
  });

  describe('delete', () => {
    it('should delete an order', async () => {
      mockOrderRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.delete(1);
      expect(mockOrderRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findByDateRange', () => {
    it('should return orders within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByDateRange(startDate, endDate);
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: {
          orderDate: Between(startDate, endDate),
        },
        relations: ['customer', 'orderItems'],
      });
    });
  });

  describe('findByStatus', () => {
    it('should return orders with specific status', async () => {
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByStatus('Pending');
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { status: 'Pending' },
        relations: ['customer', 'orderItems'],
      });
    });
  });

  describe('findByTotalAmount', () => {
    it('should return orders within total amount range', async () => {
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByTotalAmount(10, 50);
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { totalAmount: Between(10, 50) },
        relations: ['customer', 'orderItems'],
      });
    });

    it('should return orders above minimum amount', async () => {
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByTotalAmount(10);
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { totalAmount: MoreThan(10) },
        relations: ['customer', 'orderItems'],
      });
    });

    it('should return orders below maximum amount', async () => {
      const orders = [
        {
          id: 1,
          status: 'Pending',
          customer: { id: 1, name: 'Test Customer' },
        },
      ];
      mockOrderRepository.find.mockResolvedValue(orders);

      const result = await service.findByTotalAmount(undefined, 50);
      expect(result).toEqual(orders);
      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { totalAmount: LessThan(50) },
        relations: ['customer', 'orderItems'],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = {
        id: 1,
        status: 'Completed',
        customer: { id: 1, name: 'Test Customer' },
      };

      mockOrderRepository.findOne.mockResolvedValue(updatedOrder);
      mockOrderRepository.save.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus(1, 'Completed');
      expect(result).toEqual(updatedOrder);
      expect(mockOrderRepository.save).toHaveBeenCalledWith({
        ...updatedOrder,
        status: 'Completed',
      });
    });

    it('should throw error if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, 'Completed')).rejects.toThrow(
        new HttpException('Order not found', 404),
      );
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total amount for order', async () => {
      const order = {
        id: 1,
        status: 'Pending',
        customer: { id: 1, name: 'Test Customer' },
        orderItems: [
          {
            id: 1,
            quantity: 2,
            unitPrice: 10.99,
            price: 9.99,
            totalPrice: 21.98,
          },
        ],
      };

      mockOrderRepository.findOne.mockResolvedValue(order);

      const result = await service.calculateOrderTotal(1);
      expect(result).toBe(21.98);
    });

    it('should throw error if order not found', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateOrderTotal(999)).rejects.toThrow(
        new HttpException('Order not found', 404),
      );
    });

    it('should handle empty order items', async () => {
      const order = {
        id: 1,
        status: 'Pending',
        customer: { id: 1, name: 'Test Customer' },
        orderItems: [],
      };

      mockOrderRepository.findOne.mockResolvedValue(order);

      const result = await service.calculateOrderTotal(1);
      expect(result).toBe(0);
    });
  });
});
