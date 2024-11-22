import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuppliersService } from './suppliers.service';
import { Supplier } from '../entities/suppliers.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { PurchaseOrder } from '../entities/purchase-orders.entity';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let supplierRepository: Repository<Supplier>;

  const mockInventoryItem: InventoryItem = {
    id: 1,
    name: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    reorderLevel: 10,
    reorderQuantity: 50,
    autoReorder: false,
    price: 19.99,
    currentStock: 100,
    unitPrice: 19.99,
    supplier: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [],
    purchaseOrderItems: [],
    transactions: []
  };

  const mockPurchaseOrder: PurchaseOrder = {
    id: 1,
    supplier: null,
    orderDate: new Date(),
    expectedDeliveryDate: new Date(),
    receivedDate: null,
    status: 'Pending',
    totalAmount: 199.90,
    createdAt: new Date(),
    updatedAt: new Date(),
    purchaseOrderItems: []
  };

  const mockSupplier: Supplier = {
    id: 1,
    name: 'Test Supplier',
    contactInfo: '+1234567890',
    address: '123 Supplier St',
    createdAt: new Date(),
    updatedAt: new Date(),
    inventoryItems: [mockInventoryItem],
    purchaseOrders: [mockPurchaseOrder]
  };

  const mockSupplierRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    supplierRepository = module.get<Repository<Supplier>>(
      getRepositoryToken(Supplier),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of suppliers', async () => {
      const suppliers = [mockSupplier];
      jest.spyOn(supplierRepository, 'find').mockResolvedValue(suppliers);

      const result = await service.findAll();
      expect(result).toEqual(suppliers);
      expect(supplierRepository.find).toHaveBeenCalledWith({
        relations: ['inventoryItems', 'purchaseOrders'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);
      expect(result).toEqual(mockSupplier);
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['inventoryItems', 'purchaseOrders'],
      });
    });

    it('should return null if supplier not found', async () => {
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return a supplier by name', async () => {
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(mockSupplier);

      const result = await service.findByName('Test Supplier');
      expect(result).toEqual(mockSupplier);
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Test Supplier' },
        relations: ['inventoryItems', 'purchaseOrders'],
      });
    });

    it('should return null if supplier not found', async () => {
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByName('Nonexistent Supplier');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const createSupplierDto = {
        name: 'Test Supplier',
        contactInfo: '+1234567890',
        address: '123 Supplier St',
      };
      const newSupplier = { ...mockSupplier };

      jest.spyOn(supplierRepository, 'create').mockReturnValue(newSupplier);
      jest.spyOn(supplierRepository, 'save').mockResolvedValue(newSupplier);

      const result = await service.create(createSupplierDto);
      expect(result).toEqual(newSupplier);
      expect(supplierRepository.create).toHaveBeenCalledWith(createSupplierDto);
      expect(supplierRepository.save).toHaveBeenCalledWith(newSupplier);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const updateSupplierDto = { name: 'Updated Supplier' };
      const updatedSupplier = { ...mockSupplier, ...updateSupplierDto };

      jest.spyOn(supplierRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateSupplierDto);
      expect(result).toEqual(updatedSupplier);
      expect(supplierRepository.update).toHaveBeenCalledWith(1, updateSupplierDto);
    });
  });

  describe('delete', () => {
    it('should delete a supplier', async () => {
      jest.spyOn(supplierRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(supplierRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('findByInventoryItem', () => {
    it('should return suppliers for a specific inventory item', async () => {
      const suppliers = [mockSupplier];
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(suppliers),
      };

      jest.spyOn(supplierRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByInventoryItem(1);
      expect(result).toEqual(suppliers);
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith('supplier.inventoryItems', 'item');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('item.id = :itemId', { itemId: 1 });
    });

    it('should return empty array if no suppliers found', async () => {
      const mockQueryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(supplierRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByInventoryItem(999);
      expect(result).toEqual([]);
    });
  });

  describe('findByPurchaseOrderTotal', () => {
    it('should return suppliers with purchase order total above minimum', async () => {
      const suppliers = [mockSupplier];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(suppliers),
      };

      jest.spyOn(supplierRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByPurchaseOrderTotal(100);
      expect(result).toEqual(suppliers);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('supplier.purchaseOrders', 'po');
      expect(mockQueryBuilder.having).toHaveBeenCalledWith('SUM(po.totalAmount) >= :minTotal', { minTotal: 100 });
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('supplier.id');
    });

    it('should return empty array if no suppliers found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(supplierRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findByPurchaseOrderTotal(1000);
      expect(result).toEqual([]);
    });
  });
});
