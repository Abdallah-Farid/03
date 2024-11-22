import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from '../services/orders.service';
import { Order } from '../entities/orders.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockCustomer = {
    id: 1,
    name: 'Test Customer',
    email: 'test@example.com',
  };

  const mockOrderItem = {
    id: 1,
    quantity: 2,
    unitPrice: 10.99,
    totalPrice: 21.98,
  };

  const mockOrder: Partial<Order> = {
    id: 1,
    customer: mockCustomer as any,
    orderDate: new Date('2024-01-01'),
    status: 'Pending',
    totalAmount: 21.98,
    orderItems: [mockOrderItem] as any[],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOrdersService = {
    findAll: jest.fn(),
    findByCustomer: jest.fn(),
    findByDateRange: jest.fn(),
    findByStatus: jest.fn(),
    findByTotalAmount: jest.fn(),
    findOne: jest.fn(),
    calculateOrderTotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const orders = [mockOrder];
      mockOrdersService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll();

      expect(result).toEqual(orders);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByCustomer.mockResolvedValue(orders);

      const result = await controller.findByCustomer('1');

      expect(result).toEqual(orders);
      expect(service.findByCustomer).toHaveBeenCalledWith(1);
    });

    it('should handle invalid customer id', async () => {
      mockOrdersService.findByCustomer.mockRejectedValue(new Error('Invalid customer ID'));

      await expect(controller.findByCustomer('invalid')).rejects.toThrow();
    });
  });

  describe('findByDateRange', () => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    it('should return orders within date range', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByDateRange.mockResolvedValue(orders);

      const result = await controller.findByDateRange(startDate, endDate);

      expect(result).toEqual(orders);
      expect(service.findByDateRange).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should handle invalid date format', async () => {
      await expect(
        controller.findByDateRange('invalid-date', endDate),
      ).rejects.toThrow();
    });
  });

  describe('findByStatus', () => {
    it('should return orders with specific status', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByStatus.mockResolvedValue(orders);

      const result = await controller.findByStatus('Pending');

      expect(result).toEqual(orders);
      expect(service.findByStatus).toHaveBeenCalledWith('Pending');
    });
  });

  describe('findByTotalAmount', () => {
    it('should return orders within total amount range', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByTotalAmount.mockResolvedValue(orders);

      const result = await controller.findByTotalAmount('10', '30');

      expect(result).toEqual(orders);
      expect(service.findByTotalAmount).toHaveBeenCalledWith(10, 30);
    });

    it('should handle missing min amount', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByTotalAmount.mockResolvedValue(orders);

      const result = await controller.findByTotalAmount(undefined, '30');

      expect(result).toEqual(orders);
      expect(service.findByTotalAmount).toHaveBeenCalledWith(undefined, 30);
    });

    it('should handle missing max amount', async () => {
      const orders = [mockOrder];
      mockOrdersService.findByTotalAmount.mockResolvedValue(orders);

      const result = await controller.findByTotalAmount('10', undefined);

      expect(result).toEqual(orders);
      expect(service.findByTotalAmount).toHaveBeenCalledWith(10, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Order not found');
    });
  });

  describe('calculateOrderTotal', () => {
    it('should return the total amount of an order', async () => {
      const total = 21.98;
      mockOrdersService.calculateOrderTotal.mockResolvedValue(total);

      const result = await controller.calculateOrderTotal('1');

      expect(result).toEqual(total);
      expect(service.calculateOrderTotal).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        customerId: 1,
        status: 'Pending',
        orderItems: [{ inventoryItemId: 1, quantity: 2 }],
      };

      const newOrder = { id: 2, ...createOrderDto, status: 'Pending' };
      mockOrdersService.create.mockResolvedValue(newOrder);

      const result = await controller.create(createOrderDto);

      expect(result).toEqual(newOrder);
      expect(service.create).toHaveBeenCalledWith(createOrderDto);
    });

    it('should handle validation errors', async () => {
      mockOrdersService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create({} as CreateOrderDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateOrderDto: Partial<Order> = {
      status: 'Completed',
      totalAmount: 25.98,
    };

    it('should update an existing order', async () => {
      const updatedOrder = { ...mockOrder, ...updateOrderDto };
      mockOrdersService.findOne.mockResolvedValue(mockOrder);
      mockOrdersService.update.mockResolvedValue(updatedOrder);

      const result = await controller.update('1', updateOrderDto);

      expect(result).toEqual(updatedOrder);
      expect(service.update).toHaveBeenCalledWith(1, updateOrderDto);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateOrderDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateOrderDto)).rejects.toThrow('Order not found');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: 'Completed' };
      mockOrdersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus('1', 'Completed');

      expect(result).toEqual(updatedOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(1, 'Completed');
    });

    it('should handle invalid status', async () => {
      mockOrdersService.updateStatus.mockRejectedValue(new Error('Invalid status'));

      await expect(
        controller.updateStatus('1', 'Invalid' as any),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing order', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);
      mockOrdersService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Order not found');
    });
  });
});
