import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { InventoryItem } from '../entities/inventory-items.entity';

@Injectable()
export class InventoryItemsService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
  ) {}

  async findAll(): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'inventoryTransactions'],
    });
  }

  async findOne(id: number): Promise<InventoryItem> {
    return this.inventoryItemRepository.findOne({
      where: { id },
      relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'inventoryTransactions'],
    });
  }

  async findBySupplier(supplierId: number): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { supplier: { id: supplierId } },
      relations: ['supplier', 'orderItems', 'purchaseOrderItems', 'inventoryTransactions'],
    });
  }

  async create(inventoryItem: Partial<InventoryItem>): Promise<InventoryItem> {
    const newItem = this.inventoryItemRepository.create(inventoryItem);
    return this.inventoryItemRepository.save(newItem);
  }

  async update(id: number, inventoryItem: Partial<InventoryItem>): Promise<InventoryItem> {
    await this.inventoryItemRepository.update(id, inventoryItem);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.inventoryItemRepository.delete(id);
  }

  async findLowStock(threshold: number): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { currentStock: LessThan(threshold) },
      relations: ['supplier'],
    });
  }

  async findByStockRange(min: number, max: number): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { currentStock: Between(min, max) },
      relations: ['supplier'],
    });
  }

  async adjustStock(id: number, quantity: number, type: 'add' | 'subtract'): Promise<InventoryItem> {
    const item = await this.findOne(id);
    if (!item) {
      throw new HttpException('Inventory item not found', HttpStatus.NOT_FOUND);
    }

    if (type === 'subtract' && item.currentStock < quantity) {
      throw new HttpException('Insufficient stock', HttpStatus.BAD_REQUEST);
    }

    item.currentStock = type === 'add' 
      ? item.currentStock + quantity 
      : item.currentStock - quantity;

    return this.inventoryItemRepository.save(item);
  }

  async findOutOfStock(): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { currentStock: 0 },
      relations: ['supplier'],
    });
  }

  async findOverstock(threshold: number): Promise<InventoryItem[]> {
    return this.inventoryItemRepository.find({
      where: { currentStock: MoreThan(threshold) },
      relations: ['supplier'],
    });
  }
}
