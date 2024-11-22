import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsController } from './inventory-items.controller';
import { InventoryItemsService } from '../services/inventory-items.service';
import { InventoryItem } from '../entities/inventory-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('InventoryItemsController', () => {
  let controller: InventoryItemsController;
  let service: InventoryItemsService;

  const mockInventoryItem: Partial<InventoryItem> = {
    id: 1,
    name: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    reorderLevel: 10,
    reorderQuantity: 50,
    autoReorder: true,
    price: 19.99,
    currentStock: 100,
    unitPrice: 15.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInventoryItemsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findLowStock: jest.fn(),
    findOutOfStock: jest.fn(),
    findOverstock: jest.fn(),
    findByStockRange: jest.fn(),
    findBySupplier: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    adjustStock: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryItemsController],
      providers: [
        {
          provide: InventoryItemsService,
          useValue: mockInventoryItemsService,
        },
      ],
    }).compile();

    controller = module.get<InventoryItemsController>(InventoryItemsController);
    service = module.get<InventoryItemsService>(InventoryItemsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of inventory items', async () => {
      const items = [mockInventoryItem];
      mockInventoryItemsService.findAll.mockResolvedValue(items);

      const result = await controller.findAll();

      expect(result).toEqual(items);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should handle empty inventory list', async () => {
      mockInventoryItemsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findLowStock', () => {
    it('should return items below threshold', async () => {
      const items = [mockInventoryItem];
      mockInventoryItemsService.findLowStock.mockResolvedValue(items);

      const result = await controller.findLowStock('20');

      expect(result).toEqual(items);
      expect(service.findLowStock).toHaveBeenCalledWith(20);
    });

    it('should handle invalid threshold', async () => {
      mockInventoryItemsService.findLowStock.mockRejectedValue(
        new Error('Invalid threshold'),
      );

      await expect(controller.findLowStock('invalid')).rejects.toThrow();
    });
  });

  describe('findOutOfStock', () => {
    it('should return out of stock items', async () => {
      const items = [{ ...mockInventoryItem, currentStock: 0 }];
      mockInventoryItemsService.findOutOfStock.mockResolvedValue(items);

      const result = await controller.findOutOfStock();

      expect(result).toEqual(items);
      expect(service.findOutOfStock).toHaveBeenCalled();
    });
  });

  describe('findOverstock', () => {
    it('should return overstocked items', async () => {
      const items = [mockInventoryItem];
      mockInventoryItemsService.findOverstock.mockResolvedValue(items);

      const result = await controller.findOverstock('150');

      expect(result).toEqual(items);
      expect(service.findOverstock).toHaveBeenCalledWith(150);
    });

    it('should handle invalid threshold', async () => {
      mockInventoryItemsService.findOverstock.mockRejectedValue(
        new Error('Invalid threshold'),
      );

      await expect(controller.findOverstock('invalid')).rejects.toThrow();
    });
  });

  describe('findByStockRange', () => {
    it('should return items within stock range', async () => {
      const items = [mockInventoryItem];
      mockInventoryItemsService.findByStockRange.mockResolvedValue(items);

      const result = await controller.findByStockRange('50', '150');

      expect(result).toEqual(items);
      expect(service.findByStockRange).toHaveBeenCalledWith(50, 150);
    });

    it('should handle invalid range values', async () => {
      mockInventoryItemsService.findByStockRange.mockRejectedValue(
        new Error('Invalid range'),
      );

      await expect(controller.findByStockRange('invalid', '150')).rejects.toThrow();
    });
  });

  describe('findBySupplier', () => {
    it('should return items for a supplier', async () => {
      const items = [mockInventoryItem];
      mockInventoryItemsService.findBySupplier.mockResolvedValue(items);

      const result = await controller.findBySupplier('1');

      expect(result).toEqual(items);
      expect(service.findBySupplier).toHaveBeenCalledWith(1);
    });

    it('should handle invalid supplier id', async () => {
      mockInventoryItemsService.findBySupplier.mockRejectedValue(
        new Error('Invalid supplier ID'),
      );

      await expect(controller.findBySupplier('invalid')).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return a single inventory item', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(mockInventoryItem);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockInventoryItem);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Inventory item not found');
    });
  });

  describe('create', () => {
    const createItemDto = {
      name: 'New Item',
      description: 'New Description',
      quantity: 50,
      reorderLevel: 5,
      reorderQuantity: 25,
      autoReorder: true,
      price: 29.99,
      unitPrice: 25.99,
    };

    it('should create a new inventory item', async () => {
      const newItem = { id: 2, ...createItemDto };
      mockInventoryItemsService.create.mockResolvedValue(newItem);

      const result = await controller.create(createItemDto);

      expect(result).toEqual(newItem);
      expect(service.create).toHaveBeenCalledWith(createItemDto);
    });

    it('should handle validation errors', async () => {
      const invalidItem = { name: '' };
      mockInventoryItemsService.create.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(controller.create(invalidItem)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateItemDto = {
      name: 'Updated Item',
      description: 'Updated Description',
    };

    it('should update an existing inventory item', async () => {
      const updatedItem = { ...mockInventoryItem, ...updateItemDto };
      mockInventoryItemsService.findOne.mockResolvedValue(mockInventoryItem);
      mockInventoryItemsService.update.mockResolvedValue(updatedItem);

      const result = await controller.update('1', updateItemDto);

      expect(result).toEqual(updatedItem);
      expect(service.update).toHaveBeenCalledWith(1, updateItemDto);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateItemDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateItemDto)).rejects.toThrow(
        'Inventory item not found',
      );
    });
  });

  describe('adjustStock', () => {
    it('should add stock to inventory item', async () => {
      const adjustedItem = { ...mockInventoryItem, quantity: 150 };
      mockInventoryItemsService.adjustStock.mockResolvedValue(adjustedItem);

      const result = await controller.adjustStock('1', { quantity: 50, type: 'add' });

      expect(result).toEqual(adjustedItem);
      expect(service.adjustStock).toHaveBeenCalledWith(1, 50, 'add');
    });

    it('should subtract stock from inventory item', async () => {
      const adjustedItem = { ...mockInventoryItem, quantity: 50 };
      mockInventoryItemsService.adjustStock.mockResolvedValue(adjustedItem);

      const result = await controller.adjustStock('1', {
        quantity: 50,
        type: 'subtract',
      });

      expect(result).toEqual(adjustedItem);
      expect(service.adjustStock).toHaveBeenCalledWith(1, 50, 'subtract');
    });

    it('should handle invalid adjustment type', async () => {
      mockInventoryItemsService.adjustStock.mockRejectedValue(
        new Error('Invalid adjustment type'),
      );

      await expect(
        controller.adjustStock('1', { quantity: 50, type: 'invalid' as any }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing inventory item', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(mockInventoryItem);
      mockInventoryItemsService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Inventory item not found');
    });

    it('should handle delete operation errors', async () => {
      mockInventoryItemsService.findOne.mockResolvedValue(mockInventoryItem);
      mockInventoryItemsService.delete.mockRejectedValue(
        new Error('Delete operation failed'),
      );

      await expect(controller.delete('1')).rejects.toThrow();
    });
  });
});
