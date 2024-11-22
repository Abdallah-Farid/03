import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemsController } from './order-items.controller';
import { OrderItemsService } from '../services/order-items.service';
import { OrderItem } from '../entities/order-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('OrderItemsController', () => {
  let controller: OrderItemsController;
  let service: OrderItemsService;

  const mockInventoryItem = {
    id: 1,
    name: 'Test Item',
    sku: 'TEST-123',
    currentStock: 100,
  };

  const mockOrder = {
    id: 1,
    status: 'Pending',
    orderDate: new Date('2024-01-01'),
    totalAmount: 102.50,
  };

  const mockOrderItem: Partial<OrderItem> = {
    id: 1,
    order: mockOrder as any,
    inventoryItem: mockInventoryItem as any,
    quantity: 5,
    unitPrice: 20.50,
    price: 20.50,
    totalPrice: 102.50,
  };

  const mockOrderItemsService = {
    findAll: jest.fn(),
    findByOrder: jest.fn(),
    findByInventoryItem: jest.fn(),
    findOne: jest.fn(),
    calculateSubtotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateQuantity: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderItemsController],
      providers: [
        {
          provide: OrderItemsService,
          useValue: mockOrderItemsService,
        },
      ],
    }).compile();

    controller = module.get<OrderItemsController>(OrderItemsController);
    service = module.get<OrderItemsService>(OrderItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of order items', async () => {
      const items = [mockOrderItem];
      mockOrderItemsService.findAll.mockResolvedValue(items);

      const result = await controller.findAll();

      expect(result).toEqual(items);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByOrder', () => {
    it('should return items for a specific order', async () => {
      const items = [mockOrderItem];
      mockOrderItemsService.findByOrder.mockResolvedValue(items);

      const result = await controller.findByOrder('1');

      expect(result).toEqual(items);
      expect(service.findByOrder).toHaveBeenCalledWith(1);
    });

    it('should handle invalid order id', async () => {
      mockOrderItemsService.findByOrder.mockRejectedValue(
        new Error('Invalid order ID'),
      );

      await expect(controller.findByOrder('invalid')).rejects.toThrow();
    });
  });

  describe('findByInventoryItem', () => {
    it('should return items for a specific inventory item', async () => {
      const items = [mockOrderItem];
      mockOrderItemsService.findByInventoryItem.mockResolvedValue(items);

      const result = await controller.findByInventoryItem('1');

      expect(result).toEqual(items);
      expect(service.findByInventoryItem).toHaveBeenCalledWith(1);
    });

    it('should handle invalid inventory item id', async () => {
      mockOrderItemsService.findByInventoryItem.mockRejectedValue(
        new Error('Invalid inventory item ID'),
      );

      await expect(controller.findByInventoryItem('invalid')).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a single order item', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(mockOrderItem);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockOrderItem);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Order item not found');
    });
  });

  describe('calculateSubtotal', () => {
    it('should return the total price of an order item', async () => {
      const total = 102.50;
      mockOrderItemsService.calculateSubtotal.mockResolvedValue(total);

      const result = await controller.calculateSubtotal('1');

      expect(result).toEqual(total);
      expect(service.calculateSubtotal).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockOrderItemsService.calculateSubtotal.mockRejectedValue(
        new HttpException('Order item not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.calculateSubtotal('1')).rejects.toThrow(HttpException);
      await expect(controller.calculateSubtotal('1')).rejects.toThrow('Order item not found');
    });
  });

  describe('create', () => {
    const createOrderItemDto: Partial<OrderItem> = {
      order: mockOrder as any,
      inventoryItem: mockInventoryItem as any,
      quantity: 5,
      unitPrice: 20.50,
    };

    it('should create a new order item', async () => {
      const newItem = { id: 2, ...createOrderItemDto, totalPrice: 102.50 };
      mockOrderItemsService.create.mockResolvedValue(newItem);

      const result = await controller.create(createOrderItemDto);

      expect(result).toEqual(newItem);
      expect(service.create).toHaveBeenCalledWith(createOrderItemDto);
    });

    it('should handle validation errors', async () => {
      mockOrderItemsService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create({})).rejects.toThrow();
    });

    it('should validate quantity is positive', async () => {
      const invalidItem = { ...createOrderItemDto, quantity: -1 };

      await expect(controller.create(invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.create(invalidItem)).rejects.toThrow('Quantity must be positive');
    });

    it('should validate unit price is positive', async () => {
      const invalidItem = { ...createOrderItemDto, unitPrice: -1 };

      await expect(controller.create(invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.create(invalidItem)).rejects.toThrow('Unit price must be positive');
    });
  });

  describe('update', () => {
    const updateOrderItemDto: Partial<OrderItem> = {
      quantity: 10,
      unitPrice: 25.00,
    };

    it('should update an existing order item', async () => {
      const updatedItem = { ...mockOrderItem, ...updateOrderItemDto };
      mockOrderItemsService.findOne.mockResolvedValue(mockOrderItem);
      mockOrderItemsService.update.mockResolvedValue(updatedItem);

      const result = await controller.update('1', updateOrderItemDto);

      expect(result).toEqual(updatedItem);
      expect(service.update).toHaveBeenCalledWith(1, updateOrderItemDto);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateOrderItemDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateOrderItemDto)).rejects.toThrow('Order item not found');
    });

    it('should validate quantity is positive on update', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(mockOrderItem);
      const invalidItem = { quantity: -1 };

      await expect(controller.update('1', invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.update('1', invalidItem)).rejects.toThrow('Quantity must be positive');
    });

    it('should validate unit price is positive on update', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(mockOrderItem);
      const invalidItem = { unitPrice: -1 };

      await expect(controller.update('1', invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.update('1', invalidItem)).rejects.toThrow('Unit price must be positive');
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an order item', async () => {
      const updatedItem = { ...mockOrderItem, quantity: 10 };
      mockOrderItemsService.updateQuantity.mockResolvedValue(updatedItem);

      const result = await controller.updateQuantity('1', 10);

      expect(result).toEqual(updatedItem);
      expect(service.updateQuantity).toHaveBeenCalledWith(1, 10);
    });

    it('should validate quantity is positive', async () => {
      await expect(controller.updateQuantity('1', -1)).rejects.toThrow(HttpException);
      await expect(controller.updateQuantity('1', -1)).rejects.toThrow('Quantity must be positive');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockOrderItemsService.updateQuantity.mockRejectedValue(
        new HttpException('Order item not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.updateQuantity('1', 10)).rejects.toThrow(HttpException);
      await expect(controller.updateQuantity('1', 10)).rejects.toThrow('Order item not found');
    });
  });

  describe('delete', () => {
    it('should delete an existing order item', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(mockOrderItem);
      mockOrderItemsService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Order item not found');
    });
  });
});
