import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Order } from '../entities/orders.entity';
import { Customer } from '../entities/customers.entity';
import { OrderItem } from '../entities/order-items.entity';
import { InventoryItem } from '../entities/inventory-items.entity';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepository: Repository<InventoryItem>,
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

  async create(orderDto: CreateOrderDto): Promise<Order> {
    // Find the customer
    const customer = await this.customerRepository.findOne({
      where: { id: orderDto.customerId },
    });

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    // Create the order with customer
    const newOrder = this.orderRepository.create({
      customer,
      status: orderDto.status || 'Pending',
    });

    // Save the order first
    const savedOrder = await this.orderRepository.save(newOrder);

    // Process order items
    if (orderDto.orderItems && orderDto.orderItems.length > 0) {
      const orderItems = await Promise.all(
        orderDto.orderItems.map(async (itemDto) => {
          // Find the inventory item
          const inventoryItem = await this.inventoryItemRepository.findOne({
            where: { id: itemDto.inventoryItemId },
          });

          if (!inventoryItem) {
            throw new HttpException(
              `Inventory item ${itemDto.inventoryItemId} not found`,
              HttpStatus.NOT_FOUND,
            );
          }

          // Create order item
          const orderItem = this.orderItemRepository.create({
            order: savedOrder,
            inventoryItem,
            quantity: itemDto.quantity,
            unitPrice: inventoryItem.unitPrice,
            price: inventoryItem.price,
            totalPrice: itemDto.quantity * inventoryItem.unitPrice,
          });

          return this.orderItemRepository.save(orderItem);
        }),
      );

      // Update order's total amount
      savedOrder.totalAmount = orderItems.reduce(
        (total, item) => total + item.totalPrice,
        0,
      );
      await this.orderRepository.save(savedOrder);
    }

    // Return the order with relations
    return this.findOne(savedOrder.id);
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

  async findByStatus(status: 'Pending' | 'Completed' | 'Cancelled'): Promise<Order[]> {
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
      where.totalAmount = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.totalAmount = MoreThan(minAmount);
    } else if (maxAmount !== undefined) {
      where.totalAmount = LessThan(maxAmount);
    }

    return this.orderRepository.find({
      where,
      relations: ['customer', 'orderItems'],
    });
  }

  async updateStatus(
    id: number,
    status: 'Pending' | 'Completed' | 'Cancelled',
  ): Promise<Order> {
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
