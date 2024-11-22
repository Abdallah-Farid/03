import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryTransactionsService } from './inventory-transactions.service';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';
import { InventoryItem } from '../entities/inventory-items.entity';

describe('InventoryTransactionsService', () => {
  let service: InventoryTransactionsService;
  let transactionRepository: Repository<InventoryTransaction>;

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

  const mockTransaction: InventoryTransaction = {
    id: 1,
    type: 'IN',
    quantity: 10,
    transactionDate: new Date(),
    notes: 'Test transaction',
    inventoryItem: mockInventoryItem,
    user: null
  };

  const mockTransactionRepository = {
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
        InventoryTransactionsService,
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryTransactionsService>(InventoryTransactionsService);
    transactionRepository = module.get<Repository<InventoryTransaction>>(
      getRepositoryToken(InventoryTransaction),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.findAll();
      expect(result).toEqual(transactions);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        relations: ['inventoryItem'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);

      const result = await service.findOne(1);
      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['inventoryItem'],
      });
    });

    it('should return null if transaction not found', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('findByInventoryItem', () => {
    it('should return transactions for a specific inventory item', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.findByInventoryItem(1);
      expect(result).toEqual(transactions);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: { inventoryItem: { id: 1 } },
        relations: ['inventoryItem'],
      });
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const transactions = [mockTransaction];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.findByDateRange(startDate, endDate);
      expect(result).toEqual(transactions);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: {
          transactionDate: Between(startDate, endDate),
        },
        relations: ['inventoryItem'],
      });
    });
  });

  describe('findByType', () => {
    it('should return transactions of specific type', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.findByType('IN');
      expect(result).toEqual(transactions);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: { type: 'IN' },
        relations: ['inventoryItem'],
      });
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createTransactionDto = {
        type: 'IN' as const,
        quantity: 10,
        transactionDate: new Date(),
        notes: 'Test transaction',
        inventoryItem: mockInventoryItem,
        user: null
      };
      const newTransaction = { ...mockTransaction };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(newTransaction);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue(newTransaction);

      const result = await service.create(createTransactionDto);
      expect(result).toEqual(newTransaction);
      expect(transactionRepository.create).toHaveBeenCalledWith(createTransactionDto);
      expect(transactionRepository.save).toHaveBeenCalledWith(newTransaction);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const updateTransactionDto = { quantity: 15 };
      const updatedTransaction = { ...mockTransaction, ...updateTransactionDto };

      jest.spyOn(transactionRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(updatedTransaction);

      const result = await service.update(1, updateTransactionDto);
      expect(result).toEqual(updatedTransaction);
      expect(transactionRepository.update).toHaveBeenCalledWith(1, updateTransactionDto);
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      jest.spyOn(transactionRepository, 'delete').mockResolvedValue(undefined);

      await service.delete(1);
      expect(transactionRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('getRunningBalance', () => {
    it('should calculate running balance for inventory item', async () => {
      const transactions = [
        { ...mockTransaction, type: 'IN' as const, quantity: 10 },
        { ...mockTransaction, type: 'OUT' as const, quantity: 3 },
        { ...mockTransaction, type: 'IN' as const, quantity: 5 },
      ];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.getRunningBalance(1);
      expect(result).toEqual(12); // 10 - 3 + 5
    });

    it('should return 0 if no transactions found', async () => {
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.getRunningBalance(1);
      expect(result).toEqual(0);
    });

    it('should handle invalid transaction types', async () => {
      const transactions = [
        { ...mockTransaction, type: 'IN' as const, quantity: 10 },
        { ...mockTransaction, type: 'INVALID' as any, quantity: 5 },
      ];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.getRunningBalance(1);
      expect(result).toEqual(10); // Only counts the valid IN transaction
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for inventory item within date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const transactions = [mockTransaction];
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(transactions);

      const result = await service.getTransactionHistory(1, startDate, endDate);
      expect(result).toEqual(transactions);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: {
          inventoryItem: { id: 1 },
          transactionDate: Between(startDate, endDate),
        },
        relations: ['inventoryItem'],
        order: {
          transactionDate: 'DESC',
        },
      });
    });
  });
});
