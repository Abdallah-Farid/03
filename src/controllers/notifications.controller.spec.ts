import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { NotificationType, NotificationPriority } from '../entities/notifications.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotification = {
    id: 1,
    userId: 1,
    title: 'Test Notification',
    message: 'Test Message',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findUnreadByUser: jest.fn(),
    findOne: jest.fn(),
    createLowStockNotification: jest.fn(),
    createOrderStatusNotification: jest.fn(),
    update: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    remove: jest.fn(),
    deleteOldNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateNotificationDto = {
      userId: 1,
      title: 'New Notification',
      message: 'New Message',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.MEDIUM,
    };

    it('should create a notification', async () => {
      const newNotification = { id: 2, ...createDto, isRead: false };
      mockNotificationsService.create.mockResolvedValue(newNotification);

      const result = await controller.create(createDto);

      expect(result).toEqual(newNotification);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle validation errors', async () => {
      mockNotificationsService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create({} as CreateNotificationDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      const notifications = [mockNotification];
      mockNotificationsService.findAll.mockResolvedValue(notifications);

      const result = await controller.findAll();

      expect(result).toEqual(notifications);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return notifications for a specific user', async () => {
      const notifications = [mockNotification];
      mockNotificationsService.findByUser.mockResolvedValue(notifications);

      const result = await controller.findByUser('1');

      expect(result).toEqual(notifications);
      expect(service.findByUser).toHaveBeenCalledWith(1);
    });

    it('should handle invalid user id', async () => {
      mockNotificationsService.findByUser.mockRejectedValue(new Error('Invalid user ID'));

      await expect(controller.findByUser('invalid')).rejects.toThrow();
    });
  });

  describe('findUnreadByUser', () => {
    it('should return unread notifications for a specific user', async () => {
      const notifications = [mockNotification];
      mockNotificationsService.findUnreadByUser.mockResolvedValue(notifications);

      const result = await controller.findUnreadByUser('1');

      expect(result).toEqual(notifications);
      expect(service.findUnreadByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a single notification', async () => {
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockNotification);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('1')).rejects.toThrow(HttpException);
      await expect(controller.findOne('1')).rejects.toThrow('Notification not found');
    });
  });

  describe('createLowStockNotification', () => {
    const lowStockData = {
      userId: 1,
      itemName: 'Test Item',
      currentStock: 5,
      threshold: 10,
    };

    it('should create a low stock notification', async () => {
      const notification = {
        ...mockNotification,
        type: NotificationType.LOW_STOCK,
        message: 'Low stock alert for Test Item',
      };
      mockNotificationsService.createLowStockNotification.mockResolvedValue(notification);

      const result = await controller.createLowStockNotification(lowStockData);

      expect(result).toEqual(notification);
      expect(service.createLowStockNotification).toHaveBeenCalledWith(
        lowStockData.userId,
        lowStockData.itemName,
        lowStockData.currentStock,
        lowStockData.threshold,
      );
    });
  });

  describe('createOrderStatusNotification', () => {
    const orderStatusData = {
      userId: 1,
      orderId: 123,
      status: 'shipped',
    };

    it('should create an order status notification', async () => {
      const notification = {
        ...mockNotification,
        type: NotificationType.ORDER_STATUS,
        message: 'Order #123 status: shipped',
      };
      mockNotificationsService.createOrderStatusNotification.mockResolvedValue(notification);

      const result = await controller.createOrderStatusNotification(orderStatusData);

      expect(result).toEqual(notification);
      expect(service.createOrderStatusNotification).toHaveBeenCalledWith(
        orderStatusData.userId,
        orderStatusData.orderId,
        orderStatusData.status,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateNotificationDto = {
      title: 'Updated Title',
      message: 'Updated Message',
    };

    it('should update a notification', async () => {
      const updatedNotification = { ...mockNotification, ...updateDto };
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);
      mockNotificationsService.update.mockResolvedValue(updatedNotification);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(updatedNotification);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationsService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateDto)).rejects.toThrow(HttpException);
      await expect(controller.update('1', updateDto)).rejects.toThrow('Notification not found');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const readNotification = { ...mockNotification, isRead: true };
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);
      mockNotificationsService.markAsRead.mockResolvedValue(readNotification);

      const result = await controller.markAsRead('1');

      expect(result).toEqual(readNotification);
      expect(service.markAsRead).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationsService.findOne.mockResolvedValue(null);

      await expect(controller.markAsRead('1')).rejects.toThrow(HttpException);
      await expect(controller.markAsRead('1')).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      await controller.markAllAsRead('1');

      expect(service.markAllAsRead).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      mockNotificationsService.findOne.mockResolvedValue(mockNotification);
      mockNotificationsService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockNotificationsService.findOne.mockResolvedValue(null);

      await expect(controller.remove('1')).rejects.toThrow(HttpException);
      await expect(controller.remove('1')).rejects.toThrow('Notification not found');
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete notifications older than specified days', async () => {
      mockNotificationsService.deleteOldNotifications.mockResolvedValue(undefined);

      await controller.deleteOldNotifications('30');

      expect(service.deleteOldNotifications).toHaveBeenCalledWith(30);
    });

    it('should handle invalid days parameter', async () => {
      mockNotificationsService.deleteOldNotifications.mockRejectedValue(
        new Error('Invalid days parameter'),
      );

      await expect(controller.deleteOldNotifications('invalid')).rejects.toThrow();
    });
  });
});
