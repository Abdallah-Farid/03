import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionsController } from './inventory-transactions.controller';
import { InventoryTransactionsService } from '../services/inventory-transactions.service';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('InventoryTransactionsController', () => {
  let controller: InventoryTransactionsController;
  let service: InventoryTransactionsService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockTransaction: Partial<InventoryTransaction> = {
    id: 1,
    type: 'IN',
    quantity: 10,
    inventoryItem: { id: 1, name: 'Test Item' } as any,
    notes: 'Test transaction',
    user: mockUser as any
  };

  const mockService = {
    create: jest.fn((transaction) => {
      if (transaction.type !== 'IN' && transaction.type !== 'OUT') {
        throw new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST);
      }
      if (transaction.quantity <= 0) {
        throw new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST);
      }
      return Promise.resolve(mockTransaction);
    }),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn((id, transaction) => {
      if (transaction.quantity <= 0) {
        throw new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST);
      }
      return Promise.resolve({ ...mockTransaction, ...transaction });
    }),
    delete: jest.fn(),
    findByDateRange: jest.fn((startDate, endDate) => {
      if (endDate < startDate) {
        throw new HttpException('End date must be after start date', HttpStatus.BAD_REQUEST);
      }
      return Promise.resolve([mockTransaction]);
    }),
    findByType: jest.fn((type) => {
      if (type !== 'IN' && type !== 'OUT') {
        throw new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST);
      }
      return Promise.resolve([mockTransaction]);
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryTransactionsController],
      providers: [
        {
          provide: InventoryTransactionsService,
          useValue: mockService
        }
      ],
    }).compile();

    controller = module.get<InventoryTransactionsController>(InventoryTransactionsController);
    service = module.get<InventoryTransactionsService>(InventoryTransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      mockService.create.mockResolvedValueOnce(mockTransaction);

      const result = await controller.create(mockTransaction as InventoryTransaction);

      expect(result).toEqual(mockTransaction);
      expect(service.create).toHaveBeenCalledWith(mockTransaction);
    });

    it('should validate transaction type', async () => {
      mockService.create.mockRejectedValueOnce(
        new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST)
      );

      const invalidTransaction = { ...mockTransaction, type: 'INVALID' };
      await expect(controller.create(invalidTransaction as InventoryTransaction))
        .rejects.toThrow(new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST));
    });

    it('should validate quantity', async () => {
      mockService.create.mockRejectedValueOnce(
        new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST)
      );

      const invalidTransaction = { ...mockTransaction, quantity: -1 };
      await expect(controller.create(invalidTransaction as InventoryTransaction))
        .rejects.toThrow(new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST));
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      const transactions = [mockTransaction];
      mockService.findAll.mockResolvedValue(transactions);

      const result = await controller.findAll();

      expect(result).toEqual(transactions);
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('999'))
        .rejects.toThrow(new HttpException('Inventory transaction not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);
      mockService.update.mockResolvedValue({ ...mockTransaction, quantity: 20 });

      const result = await controller.update('1', { quantity: 20 } as InventoryTransaction);

      expect(result.quantity).toBe(20);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockService.findOne.mockResolvedValue(null);

      await expect(controller.update('999', {} as InventoryTransaction))
        .rejects.toThrow(new HttpException('Inventory transaction not found', HttpStatus.NOT_FOUND));
    });

    it('should validate quantity on update', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);
      mockService.update.mockRejectedValueOnce(
        new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.update('1', { quantity: -1 } as InventoryTransaction))
        .rejects.toThrow(new HttpException('Quantity must be positive', HttpStatus.BAD_REQUEST));
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);
      mockService.delete.mockResolvedValue({ affected: 1 });

      await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockService.findOne.mockResolvedValue(null);

      await expect(controller.delete('999'))
        .rejects.toThrow(new HttpException('Inventory transaction not found', HttpStatus.NOT_FOUND));
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const transactions = [mockTransaction];

      mockService.findByDateRange.mockResolvedValue(transactions);

      const result = await controller.findByDateRange(startDate, endDate);

      expect(result).toEqual(transactions);
      expect(service.findByDateRange).toHaveBeenCalledWith(new Date(startDate), new Date(endDate));
    });

    it('should validate date range', async () => {
      mockService.findByDateRange.mockRejectedValueOnce(
        new HttpException('End date must be after start date', HttpStatus.BAD_REQUEST)
      );

      const startDate = '2023-12-31';
      const endDate = '2023-01-01';

      await expect(controller.findByDateRange(startDate, endDate))
        .rejects.toThrow(new HttpException('End date must be after start date', HttpStatus.BAD_REQUEST));
    });
  });

  describe('findByType', () => {
    it('should return transactions of specific type', async () => {
      const transactions = [mockTransaction];
      mockService.findByType.mockResolvedValue(transactions);

      const result = await controller.findByType('IN');

      expect(result).toEqual(transactions);
      expect(service.findByType).toHaveBeenCalledWith('IN');
    });

    it('should validate transaction type', async () => {
      mockService.findByType.mockRejectedValueOnce(
        new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST)
      );

      await expect(controller.findByType('INVALID' as any))
        .rejects.toThrow(new HttpException('Invalid transaction type', HttpStatus.BAD_REQUEST));
    });
  });
});
