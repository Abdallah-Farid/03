import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderItemsService } from './purchase-order-items.service';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';
import { PurchaseOrder } from '../entities/purchase-orders.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PurchaseOrderItemsService', () => {
  let service: PurchaseOrderItemsService;
  let purchaseOrderItemRepository: Repository<PurchaseOrderItem>;

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
    unitPrice: 19.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: null,
    orderItems: [],
    purchaseOrderItems: [],
    transactions: []
  };

  const mockPurchaseOrder: PurchaseOrder = {
    id: 1,
    supplier: null,
    orderDate: new Date(),
    expectedDeliveryDate: new Date(),
    status: 'Pending',
    totalAmount: 39.98,
    receivedDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    purchaseOrderItems: []
  };

  const mockPurchaseOrderItem: PurchaseOrderItem = {
    id: 1,
    quantity: 2,
    unitPrice: 19.99,
    price: 19.99,
    totalPrice: 39.98,
    purchaseOrder: mockPurchaseOrder,
    inventoryItem: mockInventoryItem
  };

  const mockPurchaseOrderItemRepository = {
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
        PurchaseOrderItemsService,
        {
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: mockPurchaseOrderItemRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrderItemsService>(PurchaseOrderItemsService);
    purchaseOrderItemRepository = module.get<Repository<PurchaseOrderItem>>(
      getRepositoryToken(PurchaseOrderItem),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of purchase order items', async () => {
      const purchaseOrderItems = [mockPurchaseOrderItem];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(purchaseOrderItems);

      const result = await service.findAll();
      expect(result).toEqual(purchaseOrderItems);
      expect(purchaseOrderItemRepository.find).toHaveBeenCalledWith({
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single purchase order item', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(mockPurchaseOrderItem);

      const result = await service.findOne(1);
      expect(result).toEqual(mockPurchaseOrderItem);
      expect(purchaseOrderItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });

    it('should return null if purchase order item not found', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByPurchaseOrder', () => {
    it('should return purchase order items for a specific order', async () => {
      const purchaseOrderItems = [mockPurchaseOrderItem];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(purchaseOrderItems);

      const result = await service.findByPurchaseOrder(1);
      expect(result).toEqual(purchaseOrderItems);
      expect(purchaseOrderItemRepository.find).toHaveBeenCalledWith({
        where: { purchaseOrder: { id: 1 } },
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });
  });

  describe('findByInventoryItem', () => {
    it('should return purchase order items for a specific inventory item', async () => {
      const purchaseOrderItems = [mockPurchaseOrderItem];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(purchaseOrderItems);

      const result = await service.findByInventoryItem(1);
      expect(result).toEqual(purchaseOrderItems);
      expect(purchaseOrderItemRepository.find).toHaveBeenCalledWith({
        where: { inventoryItem: { id: 1 } },
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });
  });

  describe('create', () => {
    it('should create a new purchase order item', async () => {
      const createPurchaseOrderItemDto = {
        quantity: 2,
        unitPrice: 19.99,
        price: 19.99,
        totalPrice: 39.98,
        purchaseOrder: mockPurchaseOrder,
        inventoryItem: mockInventoryItem
      };
      const newPurchaseOrderItem = { ...mockPurchaseOrderItem };

      jest.spyOn(purchaseOrderItemRepository, 'create').mockReturnValue(newPurchaseOrderItem);
      jest.spyOn(purchaseOrderItemRepository, 'save').mockResolvedValue(newPurchaseOrderItem);

      const result = await service.create(createPurchaseOrderItemDto);
      expect(result).toEqual(newPurchaseOrderItem);
      expect(purchaseOrderItemRepository.create).toHaveBeenCalledWith(createPurchaseOrderItemDto);
      expect(purchaseOrderItemRepository.save).toHaveBeenCalledWith(newPurchaseOrderItem);
    });
  });

  describe('update', () => {
    it('should update a purchase order item', async () => {
      const updatePurchaseOrderItemDto = { quantity: 3 };
      const updatedPurchaseOrderItem = { ...mockPurchaseOrderItem, ...updatePurchaseOrderItemDto };

      jest.spyOn(purchaseOrderItemRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(updatedPurchaseOrderItem);

      const result = await service.update(1, updatePurchaseOrderItemDto);
      expect(result).toEqual(updatedPurchaseOrderItem);
      expect(purchaseOrderItemRepository.update).toHaveBeenCalledWith(1, updatePurchaseOrderItemDto);
    });
  });

  describe('delete', () => {
    it('should delete a purchase order item', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(purchaseOrderItemRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update purchase order item quantity', async () => {
      const updatedPurchaseOrderItem = { ...mockPurchaseOrderItem, quantity: 3 };
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(mockPurchaseOrderItem);
      jest.spyOn(purchaseOrderItemRepository, 'save').mockResolvedValue(updatedPurchaseOrderItem);

      const result = await service.updateQuantity(1, 3);
      expect(result).toEqual(updatedPurchaseOrderItem);
      expect(purchaseOrderItemRepository.save).toHaveBeenCalled();
    });

    it('should throw error if purchase order item not found', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateQuantity(999, 3)).rejects.toThrow(
        new HttpException('Purchase order item not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal for purchase order item', async () => {
      const orderItem = { ...mockPurchaseOrderItem, quantity: 2, unitPrice: 19.99 };
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(orderItem);

      const result = await service.calculateSubtotal(1);
      expect(result).toEqual(39.98); // 2 * 19.99
    });

    it('should throw error if purchase order item not found', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.calculateSubtotal(999)).rejects.toThrow(
        new HttpException('Purchase order item not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('findByPendingOrder', () => {
    it('should return pending purchase order items', async () => {
      const pendingItems = [mockPurchaseOrderItem];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(pendingItems);

      const result = await service.findByPendingOrder();
      expect(result).toEqual(pendingItems);
      expect(purchaseOrderItemRepository.find).toHaveBeenCalledWith({
        where: {
          purchaseOrder: { status: 'Pending' },
        },
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });
  });

  describe('findPendingItemsByInventoryItem', () => {
    it('should return pending items for a specific inventory item', async () => {
      const pendingItems = [mockPurchaseOrderItem];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(pendingItems);

      const result = await service.findPendingItemsByInventoryItem(1);
      expect(result).toEqual(pendingItems);
      expect(purchaseOrderItemRepository.find).toHaveBeenCalledWith({
        where: {
          inventoryItem: { id: 1 },
          purchaseOrder: { status: 'Pending' },
        },
        relations: ['purchaseOrder', 'inventoryItem'],
      });
    });
  });

  describe('getTotalPendingQuantity', () => {
    it('should calculate total pending quantity for an inventory item', async () => {
      const pendingItems = [
        { ...mockPurchaseOrderItem, quantity: 2 },
        { ...mockPurchaseOrderItem, quantity: 3 },
      ];
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue(pendingItems);

      const result = await service.getTotalPendingQuantity(1);
      expect(result).toEqual(5); // 2 + 3
    });

    it('should return 0 if no pending items found', async () => {
      jest.spyOn(purchaseOrderItemRepository, 'find').mockResolvedValue([]);

      const result = await service.getTotalPendingQuantity(1);
      expect(result).toEqual(0);
    });
  });
});
