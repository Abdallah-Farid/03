import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { PurchaseOrder } from '../entities/purchase-orders.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;
  let service: PurchaseOrdersService;

  const mockSupplier = {
    id: 1,
    name: 'Test Supplier',
    email: 'supplier@example.com',
  };

  const mockPurchaseOrderItem = {
    id: 1,
    quantity: 5,
    unitPrice: 20.50,
    totalPrice: 102.50,
  };

  const mockPurchaseOrder: Partial<PurchaseOrder> = {
    id: 1,
    supplier: mockSupplier as any,
    orderDate: new Date('2024-01-01'),
    status: 'Pending',
    totalAmount: 102.50,
    expectedDeliveryDate: new Date('2024-01-15'),
    receivedDate: null,
    purchaseOrderItems: [mockPurchaseOrderItem] as any[],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPurchaseOrdersService = {
    findAll: jest.fn(),
    findBySupplier: jest.fn(),
    findByDateRange: jest.fn(),
    findByStatus: jest.fn(),
    findPendingOrders: jest.fn(),
    findOverdueOrders: jest.fn(),
    findOne: jest.fn(),
    calculateTotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        {
          provide: PurchaseOrdersService,
          useValue: mockPurchaseOrdersService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of purchase orders', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll();

      expect(result).toEqual(orders);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findBySupplier', () => {
    it('should return purchase orders for a specific supplier', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findBySupplier.mockResolvedValue(orders);

      const result = await controller.findBySupplier('1');

      expect(result).toEqual(orders);
      expect(service.findBySupplier).toHaveBeenCalledWith(1);
    });

    it('should handle invalid supplier id', async () => {
      mockPurchaseOrdersService.findBySupplier.mockRejectedValue(new Error('Invalid supplier ID'));

      await expect(controller.findBySupplier('invalid')).rejects.toThrow();
    });
  });

  describe('findByDateRange', () => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    it('should return purchase orders within date range', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findByDateRange.mockResolvedValue(orders);

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
      ).rejects.toThrow(HttpException);
    });
  });

  describe('findByStatus', () => {
    it('should return purchase orders with specific status', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findByStatus.mockResolvedValue(orders);

      const result = await controller.findByStatus('Pending');

      expect(result).toEqual(orders);
      expect(service.findByStatus).toHaveBeenCalledWith('Pending');
    });

    it('should handle invalid status', async () => {
      await expect(
        controller.findByStatus('Invalid' as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('findPendingOrders', () => {
    it('should return pending purchase orders', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findPendingOrders.mockResolvedValue(orders);

      const result = await controller.findPendingOrders();

      expect(result).toEqual(orders);
      expect(service.findPendingOrders).toHaveBeenCalled();
    });
  });

  describe('findOverdueOrders', () => {
    it('should return overdue purchase orders', async () => {
      const orders = [mockPurchaseOrder];
      mockPurchaseOrdersService.findOverdueOrders.mockResolvedValue(orders);

      const result = await controller.findOverdueOrders();

      expect(result).toEqual(orders);
      expect(service.findOverdueOrders).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single purchase order', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(mockPurchaseOrder);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockPurchaseOrder);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when purchase order not found', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Purchase order not found');
    });
  });

  describe('calculateTotal', () => {
    it('should return the total amount of a purchase order', async () => {
      const total = 102.50;
      mockPurchaseOrdersService.calculateTotal.mockResolvedValue(total);

      const result = await controller.calculateTotal('1');

      expect(result).toEqual(total);
      expect(service.calculateTotal).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    const createPurchaseOrderDto: Partial<PurchaseOrder> = {
      supplier: mockSupplier as any,
      purchaseOrderItems: [mockPurchaseOrderItem] as any[],
      expectedDeliveryDate: new Date('2024-01-15'),
    };

    it('should create a new purchase order', async () => {
      const newOrder = { id: 2, ...createPurchaseOrderDto, status: 'Pending' };
      mockPurchaseOrdersService.create.mockResolvedValue(newOrder);

      const result = await controller.create(createPurchaseOrderDto);

      expect(result).toEqual(newOrder);
      expect(service.create).toHaveBeenCalledWith(createPurchaseOrderDto);
    });

    it('should handle validation errors', async () => {
      mockPurchaseOrdersService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create({})).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updatePurchaseOrderDto: Partial<PurchaseOrder> = {
      status: 'Completed',
      totalAmount: 150.75,
      expectedDeliveryDate: new Date('2024-01-20'),
    };

    it('should update an existing purchase order', async () => {
      const updatedOrder = { ...mockPurchaseOrder, ...updatePurchaseOrderDto };
      mockPurchaseOrdersService.findOne.mockResolvedValue(mockPurchaseOrder);
      mockPurchaseOrdersService.update.mockResolvedValue(updatedOrder);

      const result = await controller.update('1', updatePurchaseOrderDto);

      expect(result).toEqual(updatedOrder);
      expect(service.update).toHaveBeenCalledWith(1, updatePurchaseOrderDto);
    });

    it('should throw NotFoundException when purchase order not found', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updatePurchaseOrderDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updatePurchaseOrderDto)).rejects.toThrow('Purchase order not found');
    });
  });

  describe('updateStatus', () => {
    it('should update purchase order status', async () => {
      const updatedOrder = { ...mockPurchaseOrder, status: 'Completed' };
      mockPurchaseOrdersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus('1', 'Completed');

      expect(result).toEqual(updatedOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(1, 'Completed');
    });

    it('should handle invalid status', async () => {
      await expect(
        controller.updateStatus('1', 'Invalid' as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('delete', () => {
    it('should delete an existing purchase order', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(mockPurchaseOrder);
      mockPurchaseOrdersService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when purchase order not found', async () => {
      mockPurchaseOrdersService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Purchase order not found');
    });
  });
});
