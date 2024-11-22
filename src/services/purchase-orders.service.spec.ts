import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from '../entities/purchase-orders.entity';
import { Supplier } from '../entities/suppliers.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let purchaseOrderRepository: Repository<PurchaseOrder>;

  const mockSupplier: Supplier = {
    id: 1,
    name: 'Test Supplier',
    contactInfo: '123-456-7890',
    address: '123 Test St',
    createdAt: new Date(),
    updatedAt: new Date(),
    inventoryItems: [],
    purchaseOrders: []
  };

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

  const mockPurchaseOrderItem: PurchaseOrderItem = {
    id: 1,
    quantity: 2,
    unitPrice: 19.99,
    price: 19.99,
    totalPrice: 39.98,
    purchaseOrder: null,
    inventoryItem: mockInventoryItem
  };

  const mockPurchaseOrder: PurchaseOrder = {
    id: 1,
    supplier: mockSupplier,
    orderDate: new Date(),
    status: 'Pending',
    totalAmount: 39.98,
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    receivedDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    purchaseOrderItems: [mockPurchaseOrderItem]
  };

  const mockPurchaseOrderRepository = {
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
        PurchaseOrdersService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: mockPurchaseOrderRepository,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(
      getRepositoryToken(PurchaseOrder),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of purchase orders', async () => {
      const purchaseOrders = [mockPurchaseOrder];
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findAll();
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single purchase order', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(mockPurchaseOrder);

      const result = await service.findOne(1);
      expect(result).toEqual(mockPurchaseOrder);
      expect(purchaseOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
      });
    });

    it('should return null if purchase order not found', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findBySupplier', () => {
    it('should return purchase orders for a specific supplier', async () => {
      const purchaseOrders = [mockPurchaseOrder];
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findBySupplier(1);
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        where: { supplier: { id: 1 } },
        relations: ['supplier', 'purchaseOrderItems', 'purchaseOrderItems.inventoryItem'],
      });
    });
  });

  describe('create', () => {
    it('should create a new purchase order', async () => {
      const createPurchaseOrderDto = {
        supplier: mockSupplier,
        purchaseOrderItems: [mockPurchaseOrderItem]
      };
      const newPurchaseOrder = { ...mockPurchaseOrder };

      jest.spyOn(purchaseOrderRepository, 'create').mockReturnValue(newPurchaseOrder);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue(newPurchaseOrder);

      const result = await service.create(createPurchaseOrderDto);
      expect(result).toEqual(newPurchaseOrder);
      expect(purchaseOrderRepository.create).toHaveBeenCalledWith(createPurchaseOrderDto);
      expect(purchaseOrderRepository.save).toHaveBeenCalledWith(newPurchaseOrder);
    });
  });

  describe('update', () => {
    it('should update a purchase order', async () => {
      const updatePurchaseOrderDto = { status: 'Completed' as const };
      const updatedPurchaseOrder = { ...mockPurchaseOrder, ...updatePurchaseOrderDto };

      jest.spyOn(purchaseOrderRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(updatedPurchaseOrder);

      const result = await service.update(1, updatePurchaseOrderDto);
      expect(result).toEqual(updatedPurchaseOrder);
      expect(purchaseOrderRepository.update).toHaveBeenCalledWith(1, updatePurchaseOrderDto);
    });
  });

  describe('delete', () => {
    it('should delete a purchase order', async () => {
      jest.spyOn(purchaseOrderRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(purchaseOrderRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findByDateRange', () => {
    it('should return purchase orders within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const purchaseOrders = [mockPurchaseOrder];

      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findByDateRange(startDate, endDate);
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        where: {
          orderDate: Between(startDate, endDate),
        },
        relations: ['supplier', 'purchaseOrderItems'],
      });
    });
  });

  describe('findByStatus', () => {
    it('should return purchase orders with specific status', async () => {
      const purchaseOrders = [mockPurchaseOrder];
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findByStatus('Pending');
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        where: { status: 'Pending' },
        relations: ['supplier', 'purchaseOrderItems'],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update purchase order status', async () => {
      const updatedPurchaseOrder = { ...mockPurchaseOrder, status: 'Completed' as const };
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(mockPurchaseOrder);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue(updatedPurchaseOrder);

      const result = await service.updateStatus(1, 'Completed');
      expect(result).toEqual(updatedPurchaseOrder);
      expect(purchaseOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw error if purchase order not found', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateStatus(999, 'Completed')).rejects.toThrow(
        new HttpException('Purchase order not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should set receivedDate when status is Completed', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const updatedPurchaseOrder = {
        ...mockPurchaseOrder,
        status: 'Completed' as const,
        receivedDate: now
      };

      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(mockPurchaseOrder);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue(updatedPurchaseOrder);

      const result = await service.updateStatus(1, 'Completed');
      expect(result.receivedDate).toEqual(now);
      expect(purchaseOrderRepository.save).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total amount for purchase order', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(mockPurchaseOrder);

      const result = await service.calculateTotal(1);
      expect(result).toEqual(39.98); // 2 * 19.99
    });

    it('should throw error if purchase order not found', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.calculateTotal(999)).rejects.toThrow(
        new HttpException('Purchase order not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should handle empty purchase order items', async () => {
      const emptyPurchaseOrder = { ...mockPurchaseOrder, purchaseOrderItems: [] };
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(emptyPurchaseOrder);

      const result = await service.calculateTotal(1);
      expect(result).toEqual(0);
    });
  });

  describe('findPendingOrders', () => {
    it('should return pending purchase orders ordered by date', async () => {
      const purchaseOrders = [mockPurchaseOrder];
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findPendingOrders();
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        where: {
          status: 'Pending',
        },
        relations: ['supplier', 'purchaseOrderItems'],
        order: {
          orderDate: 'ASC',
        },
      });
    });
  });

  describe('findOverdueOrders', () => {
    it('should return overdue pending orders', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const purchaseOrders = [mockPurchaseOrder];
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue(purchaseOrders);

      const result = await service.findOverdueOrders();
      expect(result).toEqual(purchaseOrders);
      expect(purchaseOrderRepository.find).toHaveBeenCalledWith({
        where: {
          expectedDeliveryDate: LessThan(now),
          status: 'Pending',
        },
        relations: ['supplier', 'purchaseOrderItems'],
        order: {
          expectedDeliveryDate: 'ASC',
        },
      });

      jest.useRealTimers();
    });
  });
});
