import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderItemsController } from './purchase-order-items.controller';
import { PurchaseOrderItemsService } from '../services/purchase-order-items.service';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PurchaseOrderItemsController', () => {
  let controller: PurchaseOrderItemsController;
  let service: PurchaseOrderItemsService;

  const mockInventoryItem = {
    id: 1,
    name: 'Test Item',
    sku: 'TEST-123',
    currentStock: 100,
  };

  const mockPurchaseOrder = {
    id: 1,
    status: 'Pending',
    orderDate: new Date('2024-01-01'),
    totalAmount: 102.50,
  };

  const mockPurchaseOrderItem: Partial<PurchaseOrderItem> = {
    id: 1,
    purchaseOrder: mockPurchaseOrder as any,
    inventoryItem: mockInventoryItem as any,
    quantity: 5,
    unitPrice: 20.50,
    price: 20.50,
    totalPrice: 102.50,
  };

  const mockPurchaseOrderItemsService = {
    findAll: jest.fn(),
    findByPurchaseOrder: jest.fn(),
    findByInventoryItem: jest.fn(),
    findOne: jest.fn(),
    calculateSubtotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderItemsController],
      providers: [
        {
          provide: PurchaseOrderItemsService,
          useValue: mockPurchaseOrderItemsService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrderItemsController>(PurchaseOrderItemsController);
    service = module.get<PurchaseOrderItemsService>(PurchaseOrderItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of purchase order items', async () => {
      const items = [mockPurchaseOrderItem];
      mockPurchaseOrderItemsService.findAll.mockResolvedValue(items);

      const result = await controller.findAll();

      expect(result).toEqual(items);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByPurchaseOrder', () => {
    it('should return items for a specific purchase order', async () => {
      const items = [mockPurchaseOrderItem];
      mockPurchaseOrderItemsService.findByPurchaseOrder.mockResolvedValue(items);

      const result = await controller.findByPurchaseOrder('1');

      expect(result).toEqual(items);
      expect(service.findByPurchaseOrder).toHaveBeenCalledWith(1);
    });

    it('should handle invalid purchase order id', async () => {
      mockPurchaseOrderItemsService.findByPurchaseOrder.mockRejectedValue(
        new Error('Invalid purchase order ID'),
      );

      await expect(controller.findByPurchaseOrder('invalid')).rejects.toThrow();
    });
  });

  describe('findByInventoryItem', () => {
    it('should return items for a specific inventory item', async () => {
      const items = [mockPurchaseOrderItem];
      mockPurchaseOrderItemsService.findByInventoryItem.mockResolvedValue(items);

      const result = await controller.findByInventoryItem('1');

      expect(result).toEqual(items);
      expect(service.findByInventoryItem).toHaveBeenCalledWith(1);
    });

    it('should handle invalid inventory item id', async () => {
      mockPurchaseOrderItemsService.findByInventoryItem.mockRejectedValue(
        new Error('Invalid inventory item ID'),
      );

      await expect(controller.findByInventoryItem('invalid')).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a single purchase order item', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(mockPurchaseOrderItem);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockPurchaseOrderItem);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Purchase order item not found');
    });
  });

  describe('calculateSubtotal', () => {
    it('should return the total price of a purchase order item', async () => {
      const total = 102.50;
      mockPurchaseOrderItemsService.calculateSubtotal.mockResolvedValue(total);

      const result = await controller.calculateSubtotal('1');

      expect(result).toEqual(total);
      expect(service.calculateSubtotal).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPurchaseOrderItemsService.calculateSubtotal.mockRejectedValue(
        new HttpException('Purchase order item not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.calculateSubtotal('1')).rejects.toThrow(HttpException);
      await expect(controller.calculateSubtotal('1')).rejects.toThrow('Purchase order item not found');
    });
  });

  describe('create', () => {
    const createPurchaseOrderItemDto: Partial<PurchaseOrderItem> = {
      purchaseOrder: mockPurchaseOrder as any,
      inventoryItem: mockInventoryItem as any,
      quantity: 5,
      unitPrice: 20.50,
    };

    it('should create a new purchase order item', async () => {
      const newItem = { id: 2, ...createPurchaseOrderItemDto, totalPrice: 102.50 };
      mockPurchaseOrderItemsService.create.mockResolvedValue(newItem);

      const result = await controller.create(createPurchaseOrderItemDto);

      expect(result).toEqual(newItem);
      expect(service.create).toHaveBeenCalledWith(createPurchaseOrderItemDto);
    });

    it('should handle validation errors', async () => {
      mockPurchaseOrderItemsService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create({})).rejects.toThrow();
    });

    it('should validate quantity is positive', async () => {
      const invalidItem = { ...createPurchaseOrderItemDto, quantity: -1 };

      await expect(controller.create(invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.create(invalidItem)).rejects.toThrow('Quantity must be positive');
    });

    it('should validate unit price is positive', async () => {
      const invalidItem = { ...createPurchaseOrderItemDto, unitPrice: -1 };

      await expect(controller.create(invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.create(invalidItem)).rejects.toThrow('Unit price must be positive');
    });
  });

  describe('update', () => {
    const updatePurchaseOrderItemDto: Partial<PurchaseOrderItem> = {
      quantity: 10,
      unitPrice: 25.00,
    };

    it('should update an existing purchase order item', async () => {
      const updatedItem = { ...mockPurchaseOrderItem, ...updatePurchaseOrderItemDto };
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(mockPurchaseOrderItem);
      mockPurchaseOrderItemsService.update.mockResolvedValue(updatedItem);

      const result = await controller.update('1', updatePurchaseOrderItemDto);

      expect(result).toEqual(updatedItem);
      expect(service.update).toHaveBeenCalledWith(1, updatePurchaseOrderItemDto);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updatePurchaseOrderItemDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updatePurchaseOrderItemDto)).rejects.toThrow('Purchase order item not found');
    });

    it('should validate quantity is positive on update', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(mockPurchaseOrderItem);
      const invalidItem = { quantity: -1 };

      await expect(controller.update('1', invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.update('1', invalidItem)).rejects.toThrow('Quantity must be positive');
    });

    it('should validate unit price is positive on update', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(mockPurchaseOrderItem);
      const invalidItem = { unitPrice: -1 };

      await expect(controller.update('1', invalidItem)).rejects.toThrow(HttpException);
      await expect(controller.update('1', invalidItem)).rejects.toThrow('Unit price must be positive');
    });
  });

  describe('delete', () => {
    it('should delete an existing purchase order item', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(mockPurchaseOrderItem);
      mockPurchaseOrderItemsService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPurchaseOrderItemsService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Purchase order item not found');
    });
  });
});
