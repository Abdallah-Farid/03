import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Order } from '../entities/orders.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['customer', 'orderItems', 'orderItems.inventoryItem'],
    });
  }

  async findOne(id: number): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'orderItems', 'orderItems.inventoryItem'],
    });
  }

  async findByCustomer(customerId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customer: { id: customerId } },
      relations: ['customer', 'orderItems', 'orderItems.inventoryItem'],
    });
  }

  async create(order: Partial<Order>): Promise<Order> {
    const newOrder = this.orderRepository.create(order);
    return this.orderRepository.save(newOrder);
  }

  async update(id: number, order: Partial<Order>): Promise<Order> {
    await this.orderRepository.update(id, order);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.orderRepository.delete(id);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        orderDate: Between(startDate, endDate),
      },
      relations: ['customer', 'orderItems'],
    });
  }

  async findByStatus(status: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status },
      relations: ['customer', 'orderItems'],
    });
  }

  async findByTotalAmount(
    minAmount?: number,
    maxAmount?: number,
  ): Promise<Order[]> {
    const where: any = {};
    if (minAmount !== undefined && maxAmount !== undefined) {
      where.total = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.total = MoreThan(minAmount);
    } else if (maxAmount !== undefined) {
      where.total = LessThan(maxAmount);
    }

    return this.orderRepository.find({
      where,
      relations: ['customer', 'orderItems'],
    });
  }

  async updateStatus(id: number, status: string): Promise<Order> {
    const order = await this.findOne(id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    order.status = status;
    return this.orderRepository.save(order);
  }

  async calculateOrderTotal(id: number): Promise<number> {
    const order = await this.findOne(id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return order.orderItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  }
}
