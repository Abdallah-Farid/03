import { CreateNotificationDto } from './create-notification.dto';
import { validate } from 'class-validator';
import { NotificationType, NotificationPriority } from '../entities/notifications.entity';

describe('CreateNotificationDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateNotificationDto();
    dto.userId = 1;
    dto.message = 'Test notification message';
    dto.title = 'Test Notification';
    dto.type = NotificationType.SYSTEM;
    dto.priority = NotificationPriority.HIGH;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when userId is not a positive integer', async () => {
    const dto = new CreateNotificationDto();
    dto.userId = -1;
    dto.message = 'Test notification message';
    dto.type = NotificationType.SYSTEM;
    dto.priority = NotificationPriority.HIGH;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail when message is empty', async () => {
    const dto = new CreateNotificationDto();
    dto.userId = 1;
    dto.message = '';
    dto.type = NotificationType.SYSTEM;
    dto.priority = NotificationPriority.HIGH;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('message');
  });

  it('should fail when type is invalid', async () => {
    const dto = new CreateNotificationDto();
    dto.userId = 1;
    dto.message = 'Test notification message';
    dto.type = 'INVALID_TYPE' as NotificationType;
    dto.priority = NotificationPriority.HIGH;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });

  it('should fail when priority is invalid', async () => {
    const dto = new CreateNotificationDto();
    dto.userId = 1;
    dto.message = 'Test notification message';
    dto.type = NotificationType.SYSTEM;
    dto.priority = 'INVALID_PRIORITY' as NotificationPriority;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('priority');
  });
});
