import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderItem } from '../entities/purchase-order-items.entity';

@Injectable()
export class PurchaseOrderItemsService {
  constructor(
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
  ) {}

  async findAll(): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.find({
      relations: ['purchaseOrder', 'inventoryItem'],
    });
  }

  async findOne(id: number): Promise<PurchaseOrderItem> {
    return this.purchaseOrderItemRepository.findOne({
      where: { id },
      relations: ['purchaseOrder', 'inventoryItem'],
    });
  }

  async findByPurchaseOrder(orderId: number): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.find({
      where: { purchaseOrder: { id: orderId } },
      relations: ['purchaseOrder', 'inventoryItem'],
    });
  }

  async findByInventoryItem(itemId: number): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.find({
      where: { inventoryItem: { id: itemId } },
      relations: ['purchaseOrder', 'inventoryItem'],
    });
  }

  async create(
    purchaseOrderItem: Partial<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem> {
    const newPurchaseOrderItem =
      this.purchaseOrderItemRepository.create(purchaseOrderItem);
    return this.purchaseOrderItemRepository.save(newPurchaseOrderItem);
  }

  async update(
    id: number,
    purchaseOrderItem: Partial<PurchaseOrderItem>,
  ): Promise<PurchaseOrderItem> {
    await this.purchaseOrderItemRepository.update(id, purchaseOrderItem);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.purchaseOrderItemRepository.delete(id);
  }

  async updateQuantity(id: number, quantity: number): Promise<PurchaseOrderItem> {
    const purchaseOrderItem = await this.findOne(id);
    if (!purchaseOrderItem) {
      throw new HttpException(
        'Purchase order item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    purchaseOrderItem.quantity = quantity;
    return this.purchaseOrderItemRepository.save(purchaseOrderItem);
  }

  async calculateSubtotal(id: number): Promise<number> {
    const purchaseOrderItem = await this.findOne(id);
    if (!purchaseOrderItem) {
      throw new HttpException(
        'Purchase order item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return purchaseOrderItem.quantity * purchaseOrderItem.unitPrice;
  }

  async findPendingItemsByInventoryItem(
    itemId: number,
  ): Promise<PurchaseOrderItem[]> {
    return this.purchaseOrderItemRepository.find({
      where: {
        inventoryItem: { id: itemId },
        purchaseOrder: { status: 'PENDING' },
      },
      relations: ['purchaseOrder', 'inventoryItem'],
    });
  }

  async getTotalPendingQuantity(itemId: number): Promise<number> {
    const pendingItems = await this.findPendingItemsByInventoryItem(itemId);
    return pendingItems.reduce((total, item) => total + item.quantity, 0);
  }
}
