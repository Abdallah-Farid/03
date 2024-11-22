import { Test, TestingModule } from '@nestjs/testing';
import { InventoryItemsService } from './inventory-items.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryItem } from '../entities/inventory-items.entity';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('InventoryItemsService', () => {
  let service: InventoryItemsService;
  let inventoryItemRepository: Repository<InventoryItem>;

  const mockInventoryItem: InventoryItem = {
    id: 1,
    name: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    reorderLevel: 10,
    reorderQuantity: 50,
    autoReorder: false,
    price: 19.99,
    currentStock: 75,
    unitPrice: 15.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: null,
    orderItems: [],
    purchaseOrderItems: [],
    transactions: []
  };

  const mockInventoryItemRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryItemsService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockInventoryItemRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryItemsService>(InventoryItemsService);
    inventoryItemRepository = module.get<Repository<InventoryItem>>(
      getRepositoryToken(InventoryItem),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of inventory items', async () => {
      const items = [mockInventoryItem];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(items);

      const result = await service.findAll();
      expect(result).toEqual(items);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'transactions'],
      });
    });
  });

  describe('findOne', () => {
    it('should return an inventory item by id', async () => {
      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(mockInventoryItem);

      const result = await service.findOne(1);
      expect(result).toEqual(mockInventoryItem);
      expect(inventoryItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'transactions'],
      });
    });

    it('should return null if item not found', async () => {
      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findBySupplier', () => {
    it('should return inventory items for a specific supplier', async () => {
      const items = [mockInventoryItem];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(items);

      const result = await service.findBySupplier(1);
      expect(result).toEqual(items);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        where: { supplier: { id: 1 } },
        relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'transactions'],
      });
    });
  });

  describe('create', () => {
    it('should create a new inventory item', async () => {
      const createItemDto = {
        name: 'New Item',
        description: 'New Description',
        currentStock: 100,
      };
      const newItem = { ...mockInventoryItem, ...createItemDto };

      jest.spyOn(inventoryItemRepository, 'create').mockReturnValue(newItem);
      jest.spyOn(inventoryItemRepository, 'save').mockResolvedValue(newItem);

      const result = await service.create(createItemDto);
      expect(result).toEqual(newItem);
      expect(inventoryItemRepository.create).toHaveBeenCalledWith(createItemDto);
      expect(inventoryItemRepository.save).toHaveBeenCalledWith(newItem);
    });
  });

  describe('update', () => {
    it('should update an inventory item', async () => {
      const updateItemDto = { name: 'Updated Item' };
      const updatedItem = { ...mockInventoryItem, ...updateItemDto };

      jest.spyOn(inventoryItemRepository, 'update').mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(updatedItem);

      const result = await service.update(1, updateItemDto);
      expect(result).toEqual(updatedItem);
      expect(inventoryItemRepository.update).toHaveBeenCalledWith(1, updateItemDto);
    });
  });

  describe('delete', () => {
    it('should delete an inventory item', async () => {
      jest.spyOn(inventoryItemRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      await service.delete(1);
      expect(inventoryItemRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findLowStock', () => {
    it('should return items with stock below threshold', async () => {
      const lowStockItems = [{ ...mockInventoryItem, currentStock: 5 }];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(lowStockItems);

      const result = await service.findLowStock(10);
      expect(result).toEqual(lowStockItems);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        where: { currentStock: LessThan(10) },
        relations: ['supplier'],
      });
    });
  });

  describe('findByStockRange', () => {
    it('should return items within stock range', async () => {
      const items = [mockInventoryItem];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(items);

      const result = await service.findByStockRange(50, 100);
      expect(result).toEqual(items);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        where: { currentStock: Between(50, 100) },
        relations: ['supplier'],
      });
    });
  });

  describe('adjustStock', () => {
    it('should add stock to an item', async () => {
      const initialStock = 75;
      const addQuantity = 25;
      const item = { ...mockInventoryItem, currentStock: initialStock };
      const updatedItem = { ...item, currentStock: initialStock + addQuantity };

      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(inventoryItemRepository, 'save').mockResolvedValue(updatedItem);

      const result = await service.adjustStock(1, addQuantity, 'add');
      expect(result).toEqual(updatedItem);
      expect(result.currentStock).toBe(initialStock + addQuantity);
    });

    it('should subtract stock from an item', async () => {
      const initialStock = 75;
      const subtractQuantity = 25;
      const item = { ...mockInventoryItem, currentStock: initialStock };
      const updatedItem = { ...item, currentStock: initialStock - subtractQuantity };

      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(item);
      jest.spyOn(inventoryItemRepository, 'save').mockResolvedValue(updatedItem);

      const result = await service.adjustStock(1, subtractQuantity, 'subtract');
      expect(result).toEqual(updatedItem);
      expect(result.currentStock).toBe(initialStock - subtractQuantity);
    });

    it('should throw error when item not found', async () => {
      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.adjustStock(999, 10, 'add')).rejects.toThrow(
        new HttpException('Inventory item not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw error when insufficient stock for subtraction', async () => {
      const item = { ...mockInventoryItem, currentStock: 5 };
      jest.spyOn(inventoryItemRepository, 'findOne').mockResolvedValue(item);

      await expect(service.adjustStock(1, 10, 'subtract')).rejects.toThrow(
        new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('findOutOfStock', () => {
    it('should return items with zero stock', async () => {
      const outOfStockItems = [{ ...mockInventoryItem, currentStock: 0 }];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(outOfStockItems);

      const result = await service.findOutOfStock();
      expect(result).toEqual(outOfStockItems);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        where: { currentStock: 0 },
        relations: ['supplier'],
      });
    });
  });

  describe('findOverstock', () => {
    it('should return items with stock above threshold', async () => {
      const overstockItems = [{ ...mockInventoryItem, currentStock: 150 }];
      jest.spyOn(inventoryItemRepository, 'find').mockResolvedValue(overstockItems);

      const result = await service.findOverstock(100);
      expect(result).toEqual(overstockItems);
      expect(inventoryItemRepository.find).toHaveBeenCalledWith({
        where: { currentStock: MoreThan(100) },
        relations: ['supplier'],
      });
    });
  });
});
