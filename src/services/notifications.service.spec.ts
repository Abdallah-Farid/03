import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationType, NotificationPriority } from '../entities/notifications.entity';
import { User } from '../entities/users.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto: CreateNotificationDto = {
        userId: 1,
        title: 'Test Notification',
        message: 'Test Message',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
      };

      const user = { id: 1, email: 'test@example.com' };
      const notification = { id: 1, ...createDto, user };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(notificationRepository, 'create').mockReturnValue(notification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(notification as Notification);

      const result = await service.create(createDto);

      expect(result).toEqual(notification);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: createDto.userId } });
      expect(notificationRepository.create).toHaveBeenCalledWith({ ...createDto, user });
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const createDto: CreateNotificationDto = {
        userId: 999,
        message: 'Test Message',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      const notifications = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' },
      ];

      jest.spyOn(notificationRepository, 'find').mockResolvedValue(notifications as Notification[]);

      const result = await service.findAll();

      expect(result).toEqual(notifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      const notification = { id: 1, title: 'Test' };

      jest.spyOn(notificationRepository, 'findOne').mockResolvedValue(notification as Notification);

      const result = await service.findOne(1);

      expect(result).toEqual(notification);
      expect(notificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
    });
  });

  describe('findByUser', () => {
    it('should return notifications for a specific user', async () => {
      const userId = 1;
      const notifications = [
        { id: 1, title: 'Test 1', userId },
        { id: 2, title: 'Test 2', userId },
      ];

      jest.spyOn(notificationRepository, 'find').mockResolvedValue(notifications as Notification[]);

      const result = await service.findByUser(userId);

      expect(result).toEqual(notifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findUnreadByUser', () => {
    it('should return unread notifications for a specific user', async () => {
      const userId = 1;
      const notifications = [
        { id: 1, title: 'Test 1', userId, isRead: false },
        { id: 2, title: 'Test 2', userId, isRead: false },
      ];

      jest.spyOn(notificationRepository, 'find').mockResolvedValue(notifications as Notification[]);

      const result = await service.findUnreadByUser(userId);

      expect(result).toEqual(notifications);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const id = 1;
      const updateDto: UpdateNotificationDto = {
        title: 'Updated Title',
        message: 'Updated Message',
      };
      const existingNotification = { id, title: 'Old Title' };
      const updatedNotification = { ...existingNotification, ...updateDto };

      jest.spyOn(notificationRepository, 'findOne')
        .mockResolvedValueOnce(existingNotification as Notification)
        .mockResolvedValueOnce(updatedNotification as Notification);
      jest.spyOn(notificationRepository, 'update').mockResolvedValue({ 
        affected: 1, 
        raw: [],
        generatedMaps: [] 
      });

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedNotification);
      expect(notificationRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(notificationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const id = 1;
      const notification = { id, isRead: false };
      const updatedNotification = { ...notification, isRead: true };

      jest.spyOn(notificationRepository, 'findOne')
        .mockResolvedValueOnce(notification as Notification)
        .mockResolvedValueOnce(updatedNotification as Notification);
      jest.spyOn(notificationRepository, 'update').mockResolvedValue({ 
        affected: 1, 
        raw: [],
        generatedMaps: [] 
      });

      const result = await service.markAsRead(id);

      expect(result).toEqual(updatedNotification);
      expect(notificationRepository.update).toHaveBeenCalledWith(id, { isRead: true });
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(notificationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.markAsRead(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = 1;

      jest.spyOn(notificationRepository, 'update').mockResolvedValue({ 
        affected: 2, 
        raw: [],
        generatedMaps: [] 
      });

      await service.markAllAsRead(userId);

      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId, isRead: false },
        { isRead: true },
      );
    });
  });

  describe('createLowStockNotification', () => {
    it('should create a low stock notification', async () => {
      const userId = 1;
      const itemName = 'Test Item';
      const currentStock = 5;
      const threshold = 10;

      const expectedNotification = {
        userId,
        title: 'Low Stock Alert',
        message: `Item ${itemName} is running low on stock. Current stock: ${currentStock}, Threshold: ${threshold}`,
        type: NotificationType.LOW_STOCK,
        priority: NotificationPriority.HIGH,
      };

      jest.spyOn(notificationRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1, ...expectedNotification } as Notification);

      const result = await service.createLowStockNotification(userId, itemName, currentStock, threshold);

      expect(result).toEqual({ id: 1, ...expectedNotification });
      expect(notificationRepository.create).toHaveBeenCalledWith(expectedNotification);
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should handle save error in low stock notification', async () => {
      const userId = 1;
      const itemName = 'Test Item';
      const currentStock = 5;
      const threshold = 10;

      jest.spyOn(notificationRepository, 'create').mockReturnValue({} as Notification);
      jest.spyOn(notificationRepository, 'save').mockRejectedValue(new Error('Database error'));

      await expect(
        service.createLowStockNotification(userId, itemName, currentStock, threshold)
      ).rejects.toThrow('Database error');
    });

    it('should handle negative stock values', async () => {
      const userId = 1;
      const itemName = 'Test Item';
      const currentStock = -1;
      const threshold = 10;

      const expectedNotification = {
        userId,
        title: 'Low Stock Alert',
        message: `Item ${itemName} is running low on stock. Current stock: ${currentStock}, Threshold: ${threshold}`,
        type: NotificationType.LOW_STOCK,
        priority: NotificationPriority.HIGH,
      };

      jest.spyOn(notificationRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1, ...expectedNotification } as Notification);

      const result = await service.createLowStockNotification(userId, itemName, currentStock, threshold);
      expect(result.priority).toBe(NotificationPriority.HIGH);
    });
  });

  describe('createOrderStatusNotification', () => {
    it('should create an order status notification', async () => {
      const userId = 1;
      const orderId = 100;
      const status = 'Shipped';

      const expectedNotification = {
        userId,
        title: 'Order Status Update',
        message: `Order #${orderId} status has been updated to: ${status}`,
        type: NotificationType.ORDER_STATUS,
        priority: NotificationPriority.MEDIUM,
      };

      jest.spyOn(notificationRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1, ...expectedNotification } as Notification);

      const result = await service.createOrderStatusNotification(userId, orderId, status);

      expect(result).toEqual({ id: 1, ...expectedNotification });
      expect(notificationRepository.create).toHaveBeenCalledWith(expectedNotification);
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should handle save error in order status notification', async () => {
      const userId = 1;
      const orderId = 100;
      const status = 'Shipped';

      jest.spyOn(notificationRepository, 'create').mockReturnValue({} as Notification);
      jest.spyOn(notificationRepository, 'save').mockRejectedValue(new Error('Database error'));

      await expect(
        service.createOrderStatusNotification(userId, orderId, status)
      ).rejects.toThrow('Database error');
    });

    it('should handle very long status messages', async () => {
      const userId = 1;
      const orderId = 100;
      const status = 'A'.repeat(1000); // Very long status

      const expectedNotification = {
        userId,
        title: 'Order Status Update',
        message: `Order #${orderId} status has been updated to: ${status}`,
        type: NotificationType.ORDER_STATUS,
        priority: NotificationPriority.MEDIUM,
      };

      jest.spyOn(notificationRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({ id: 1, ...expectedNotification } as Notification);

      const notification = await service.createOrderStatusNotification(userId, orderId, status);
      expect(notification.type).toBe(NotificationType.ORDER_STATUS);
      expect(notification.priority).toBe(NotificationPriority.MEDIUM);
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete notifications older than specified days', async () => {
      const days = 30;
      const date = new Date();
      date.setDate(date.getDate() - days);

      jest.spyOn(notificationRepository, 'delete').mockResolvedValue({ affected: 5, raw: [] });

      await service.deleteOldNotifications(days);

      expect(notificationRepository.delete).toHaveBeenCalledWith({
        createdAt: expect.any(Object),
      });
    });

    it('should handle zero days parameter', async () => {
      const days = 0;
      jest.spyOn(notificationRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      await service.deleteOldNotifications(days);

      expect(notificationRepository.delete).toHaveBeenCalled();
    });

    it('should handle negative days parameter', async () => {
      const days = -1;
      jest.spyOn(notificationRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      await service.deleteOldNotifications(days);

      expect(notificationRepository.delete).toHaveBeenCalled();
    });

    it('should handle delete operation failure', async () => {
      const days = 30;
      jest.spyOn(notificationRepository, 'delete').mockRejectedValue(new Error('Database error'));

      await expect(service.deleteOldNotifications(days)).rejects.toThrow('Database error');
    });
  });

  describe('notification type and priority validation', () => {
    it('should create notification with valid type and priority', async () => {
      const createDto: CreateNotificationDto = {
        userId: 1,
        title: 'Test',
        message: 'Test Message',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.LOW,
      };

      const user = { id: 1, email: 'test@example.com' };
      const notification = { id: 1, ...createDto, user };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(notificationRepository, 'create').mockReturnValue(notification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(notification as Notification);

      const result = await service.create(createDto);
      expect(result.type).toBe(NotificationType.SYSTEM);
      expect(result.priority).toBe(NotificationPriority.LOW);
    });

    it('should create notification with default title', async () => {
      const createDto: CreateNotificationDto = {
        userId: 1,
        message: 'Test Message',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
      };

      const user = { id: 1, email: 'test@example.com' };
      const notification = {
        id: 1,
        ...createDto,
        user,
        title: undefined,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest.spyOn(notificationRepository, 'create').mockReturnValue(notification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(notification as Notification);

      const result = await service.create(createDto);
      expect(result.type).toBe(NotificationType.SYSTEM);
      expect(result.priority).toBe(NotificationPriority.MEDIUM);
      expect(result.title).toBeUndefined();
    });

    it('should validate notification type', async () => {
      const createDto = {
        userId: 1,
        message: 'Test Message',
        type: 'INVALID_TYPE',
        priority: NotificationPriority.MEDIUM,
      };

      const user = { id: 1, email: 'test@example.com' };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);

      await expect(service.create(createDto as CreateNotificationDto)).rejects.toThrow();
    });

    it('should validate notification priority', async () => {
      const createDto = {
        userId: 1,
        message: 'Test Message',
        type: NotificationType.SYSTEM,
        priority: 'INVALID_PRIORITY',
      };

      const user = { id: 1, email: 'test@example.com' };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);

      await expect(service.create(createDto as CreateNotificationDto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a notification', async () => {
      const id = 1;

      jest.spyOn(notificationRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(id);

      expect(notificationRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if notification not found', async () => {
      jest.spyOn(notificationRepository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
