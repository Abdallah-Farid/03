import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { Notification } from '../entities/notifications.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('admin', 'notification-manager')
  async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @Roles('admin', 'user')
  async findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get('user/:userId')
  @Roles('admin', 'user')
  async findByUser(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findByUser(+userId);
  }

  @Get('user/:userId/unread')
  @Roles('admin', 'user')
  async findUnreadByUser(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationsService.findUnreadByUser(+userId);
  }

  @Get(':id')
  @Roles('admin', 'user')
  async findOne(@Param('id') id: string): Promise<Notification> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return notification;
  }

  @Post('low-stock')
  @Roles('admin', 'notification-manager')
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
  @Roles('admin', 'notification-manager')
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

  @Patch(':id')
  @Roles('admin', 'notification-manager')
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Patch(':id/read')
  @Roles('admin', 'user')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return this.notificationsService.markAsRead(+id);
  }

  @Patch('user/:userId/read-all')
  @Roles('admin', 'user')
  async markAllAsRead(@Param('userId') userId: string): Promise<void> {
    await this.notificationsService.markAllAsRead(+userId);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<void> {
    const notification = await this.notificationsService.findOne(+id);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    await this.notificationsService.remove(+id);
  }

  @Delete('cleanup/:days')
  @Roles('admin')
  async deleteOldNotifications(@Param('days') days: string): Promise<void> {
    await this.notificationsService.deleteOldNotifications(+days);
  }
}
