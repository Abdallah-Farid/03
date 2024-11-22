import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from '../services/suppliers.service';
import { Supplier } from '../entities/suppliers.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSupplier: Partial<Supplier> = {
    id: 1,
    name: 'Test Supplier',
    contactInfo: 'test@supplier.com',
    address: '123 Test St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuppliersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByInventoryItem: jest.fn(),
    findByPurchaseOrderTotal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of suppliers', async () => {
      const suppliers = [mockSupplier];
      mockSuppliersService.findAll.mockResolvedValue(suppliers);

      const result = await controller.findAll();

      expect(result).toEqual(suppliers);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockSupplier);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockSuppliersService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Supplier not found');
    });
  });

  describe('findByInventoryItem', () => {
    it('should return suppliers for a specific inventory item', async () => {
      const suppliers = [mockSupplier];
      mockSuppliersService.findByInventoryItem.mockResolvedValue(suppliers);

      const result = await controller.findByInventoryItem('1');

      expect(result).toEqual(suppliers);
      expect(service.findByInventoryItem).toHaveBeenCalledWith(1);
    });
  });

  describe('findByPurchaseOrderTotal', () => {
    it('should return suppliers with purchase order total above minimum', async () => {
      const suppliers = [mockSupplier];
      mockSuppliersService.findByPurchaseOrderTotal.mockResolvedValue(suppliers);

      const result = await controller.findByPurchaseOrderTotal('1000');

      expect(result).toEqual(suppliers);
      expect(service.findByPurchaseOrderTotal).toHaveBeenCalledWith(1000);
    });

    it('should validate minTotal is provided', async () => {
      await expect(controller.findByPurchaseOrderTotal(undefined)).rejects.toThrow(HttpException);
      await expect(controller.findByPurchaseOrderTotal(undefined)).rejects.toThrow('Valid minimum total is required');
    });

    it('should validate minTotal is a valid number', async () => {
      await expect(controller.findByPurchaseOrderTotal('invalid')).rejects.toThrow(HttpException);
      await expect(controller.findByPurchaseOrderTotal('invalid')).rejects.toThrow('Valid minimum total is required');
    });

    it('should validate minTotal is not negative', async () => {
      await expect(controller.findByPurchaseOrderTotal('-100')).rejects.toThrow(HttpException);
      await expect(controller.findByPurchaseOrderTotal('-100')).rejects.toThrow('Valid minimum total is required');
    });
  });

  describe('create', () => {
    const createSupplierDto: Partial<Supplier> = {
      name: 'New Supplier',
      contactInfo: 'new@supplier.com',
      address: '456 New St',
    };

    it('should create a new supplier', async () => {
      const newSupplier = { id: 2, ...createSupplierDto };
      mockSuppliersService.create.mockResolvedValue(newSupplier);

      const result = await controller.create(createSupplierDto);

      expect(result).toEqual(newSupplier);
      expect(service.create).toHaveBeenCalledWith(createSupplierDto);
    });

    it('should validate supplier name is required', async () => {
      await expect(controller.create({})).rejects.toThrow(HttpException);
      await expect(controller.create({})).rejects.toThrow('Supplier name is required');
    });

    it('should validate supplier name is not empty', async () => {
      await expect(controller.create({ name: '' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '' })).rejects.toThrow('Supplier name is required');
    });

    it('should validate supplier name is not just whitespace', async () => {
      await expect(controller.create({ name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.create({ name: '   ' })).rejects.toThrow('Supplier name is required');
    });

    it('should handle validation errors from service', async () => {
      mockSuppliersService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(createSupplierDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateSupplierDto: Partial<Supplier> = {
      name: 'Updated Supplier',
      contactInfo: 'updated@supplier.com',
    };

    it('should update an existing supplier', async () => {
      const updatedSupplier = { ...mockSupplier, ...updateSupplierDto };
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);
      mockSuppliersService.update.mockResolvedValue(updatedSupplier);

      const result = await controller.update('1', updateSupplierDto);

      expect(result).toEqual(updatedSupplier);
      expect(service.update).toHaveBeenCalledWith(1, updateSupplierDto);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockSuppliersService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateSupplierDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateSupplierDto)).rejects.toThrow('Supplier not found');
    });

    it('should validate supplier name is not empty on update', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);

      await expect(controller.update('1', { name: '' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '' })).rejects.toThrow('Supplier name cannot be empty');
    });

    it('should validate supplier name is not just whitespace on update', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);

      await expect(controller.update('1', { name: '   ' })).rejects.toThrow(HttpException);
      await expect(controller.update('1', { name: '   ' })).rejects.toThrow('Supplier name cannot be empty');
    });

    it('should handle validation errors from service', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);
      mockSuppliersService.update.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.update('1', updateSupplierDto)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete an existing supplier', async () => {
      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);
      mockSuppliersService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('1')).resolves.toBeUndefined();
      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      mockSuppliersService.findOne.mockResolvedValue(null);

      await expect(controller.delete('1')).rejects.toThrow(HttpException);
      await expect(controller.delete('1')).rejects.toThrow('Supplier not found');
    });
  });
});
