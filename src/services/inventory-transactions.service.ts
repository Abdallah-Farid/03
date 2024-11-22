import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryTransaction } from '../entities/inventory-transactions.entity';

@Injectable()
export class InventoryTransactionsService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async findAll(): Promise<InventoryTransaction[]> {
    return this.transactionRepository.find({
      relations: ['inventoryItem'],
    });
  }

  async findOne(id: number): Promise<InventoryTransaction> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['inventoryItem'],
    });
  }

  async findByInventoryItem(itemId: number): Promise<InventoryTransaction[]> {
    return this.transactionRepository.find({
      where: { inventoryItem: { id: itemId } },
      relations: ['inventoryItem'],
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<InventoryTransaction[]> {
    return this.transactionRepository.find({
      where: {
        transactionDate: Between(startDate, endDate),
      },
      relations: ['inventoryItem'],
    });
  }

  async findByType(type: 'IN' | 'OUT'): Promise<InventoryTransaction[]> {
    return this.transactionRepository.find({
      where: { type },
      relations: ['inventoryItem'],
    });
  }

  async create(
    transaction: Partial<InventoryTransaction>,
  ): Promise<InventoryTransaction> {
    const newTransaction = this.transactionRepository.create(transaction);
    return this.transactionRepository.save(newTransaction);
  }

  async update(
    id: number,
    transaction: Partial<InventoryTransaction>,
  ): Promise<InventoryTransaction> {
    await this.transactionRepository.update(id, transaction);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.transactionRepository.delete(id);
  }

  async getRunningBalance(itemId: number): Promise<number> {
    const transactions = await this.findByInventoryItem(itemId);
    return transactions.reduce((balance, transaction) => {
      switch (transaction.type) {
        case 'IN':
          return balance + transaction.quantity;
        case 'OUT':
          return balance - transaction.quantity;
        default:
          return balance;
      }
    }, 0);
  }

  async getTransactionHistory(
    itemId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<InventoryTransaction[]> {
    return this.transactionRepository.find({
      where: {
        inventoryItem: { id: itemId },
        transactionDate: Between(startDate, endDate),
      },
      relations: ['inventoryItem'],
      order: {
        transactionDate: 'DESC',
      },
    });
  }
}
