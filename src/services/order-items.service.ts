import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../entities/order-items.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async findAll(): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      relations: ['order', 'inventoryItem'],
    });
  }

  async findOne(id: number): Promise<OrderItem> {
    return this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'inventoryItem'],
    });
  }

  async findByOrder(orderId: number): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['order', 'inventoryItem'],
    });
  }

  async findByInventoryItem(itemId: number): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { inventoryItem: { id: itemId } },
      relations: ['order', 'inventoryItem'],
    });
  }

  async create(orderItem: Partial<OrderItem>): Promise<OrderItem> {
    const newOrderItem = this.orderItemRepository.create(orderItem);
    return this.orderItemRepository.save(newOrderItem);
  }

  async update(id: number, orderItem: Partial<OrderItem>): Promise<OrderItem> {
    await this.orderItemRepository.update(id, orderItem);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.orderItemRepository.delete(id);
  }

  async updateQuantity(id: number, quantity: number): Promise<OrderItem> {
    const orderItem = await this.findOne(id);
    if (!orderItem) {
      throw new HttpException('Order item not found', HttpStatus.NOT_FOUND);
    }

    orderItem.quantity = quantity;
    return this.orderItemRepository.save(orderItem);
  }

  async calculateSubtotal(id: number): Promise<number> {
    const orderItem = await this.findOne(id);
    if (!orderItem) {
      throw new HttpException('Order item not found', HttpStatus.NOT_FOUND);
    }

    return orderItem.quantity * orderItem.unitPrice;
  }
}
