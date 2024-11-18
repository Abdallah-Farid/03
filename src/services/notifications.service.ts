import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from '../entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Notification> {
    return this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findUnreadByUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: userId },
        read: false,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = this.notificationRepository.create(notification);
    return this.notificationRepository.save(newNotification);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      {
        user: { id: userId },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      },
    );
  }

  async delete(id: number): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async deleteOldNotifications(days: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await this.notificationRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
  }

  async createLowStockNotification(
    userId: number,
    itemName: string,
    currentStock: number,
    threshold: number,
  ): Promise<Notification> {
    return this.create({
      user: { id: userId },
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${itemName} is running low. Current stock: ${currentStock} (Threshold: ${threshold})`,
      priority: 'HIGH',
    });
  }

  async createOrderStatusNotification(
    userId: number,
    orderId: number,
    status: string,
  ): Promise<Notification> {
    return this.create({
      user: { id: userId },
      type: 'ORDER_STATUS',
      title: 'Order Status Update',
      message: `Order #${orderId} status has been updated to: ${status}`,
      priority: 'MEDIUM',
    });
  }
}
