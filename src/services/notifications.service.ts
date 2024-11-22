import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from '../entities/notifications.entity';
import { User } from '../entities/users.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: createNotificationDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${createNotificationDto.userId} not found`);
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(createNotificationDto.type)) {
      throw new Error(`Invalid notification type: ${createNotificationDto.type}`);
    }

    // Validate notification priority
    if (!Object.values(NotificationPriority).includes(createNotificationDto.priority)) {
      throw new Error(`Invalid notification priority: ${createNotificationDto.priority}`);
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      user,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
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
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByUser(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    await this.notificationRepository.update(id, updateNotificationDto);
    return this.findOne(id);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    await this.notificationRepository.update(id, { isRead: true });
    return this.findOne(id);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async createLowStockNotification(
    userId: number,
    itemName: string,
    currentStock: number,
    threshold: number,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      title: 'Low Stock Alert',
      message: `Item ${itemName} is running low on stock. Current stock: ${currentStock}, Threshold: ${threshold}`,
      type: NotificationType.LOW_STOCK,
      priority: NotificationPriority.HIGH,
    });
    return this.notificationRepository.save(notification);
  }

  async createOrderStatusNotification(
    userId: number,
    orderId: number,
    status: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      title: 'Order Status Update',
      message: `Order #${orderId} status has been updated to: ${status}`,
      type: NotificationType.ORDER_STATUS,
      priority: NotificationPriority.MEDIUM,
    });
    return this.notificationRepository.save(notification);
  }

  async remove(id: number): Promise<void> {
    const result = await this.notificationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }

  async deleteOldNotifications(days: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    await this.notificationRepository.delete({
      createdAt: LessThan(date),
    });
  }
}
