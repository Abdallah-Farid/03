import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { Notification } from '../entities/notifications.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUser(+userId);
  }

  @Get('user/:userId/unread')
  async findUnreadByUser(
    @Param('userId') userId: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findUnreadByUser(+userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Notification> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }

  @Post()
  async create(
    @Body() notification: Partial<Notification>,
  ): Promise<Notification> {
    return this.notificationsService.create(notification);
  }

  @Post('low-stock')
  async createLowStockNotification(
    @Body()
    data: {
      userId: number;
      itemName: string;
      currentStock: number;
      threshold: number;
    },
  ): Promise<Notification> {
    return this.notificationsService.createLowStockNotification(
      data.userId,
      data.itemName,
      data.currentStock,
      data.threshold,
    );
  }

  @Post('order-status')
  async createOrderStatusNotification(
    @Body()
    data: {
      userId: number;
      orderId: number;
      status: string;
    },
  ): Promise<Notification> {
    return this.notificationsService.createOrderStatusNotification(
      data.userId,
      data.orderId,
      data.status,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    return this.notificationsService.markAsRead(+id);
  }

  @Patch('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string): Promise<void> {
    await this.notificationsService.markAllAsRead(+userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    await this.notificationsService.delete(+id);
  }

  @Delete('cleanup/:days')
  async deleteOldNotifications(@Param('days') days: string): Promise<void> {
    await this.notificationsService.deleteOldNotifications(+days);
  }
}
