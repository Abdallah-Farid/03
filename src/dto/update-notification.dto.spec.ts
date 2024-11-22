import { UpdateNotificationDto } from './update-notification.dto';
import { validate } from 'class-validator';
import { NotificationType, NotificationPriority } from '../entities/notifications.entity';

describe('UpdateNotificationDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new UpdateNotificationDto();
    dto.userId = 2;
    dto.message = 'Updated notification message';
    dto.type = NotificationType.LOW_STOCK;
    dto.priority = NotificationPriority.MEDIUM;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation when all fields are omitted', async () => {
    const dto = new UpdateNotificationDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when userId is invalid', async () => {
    const dto = new UpdateNotificationDto();
    dto.userId = 0;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail when type is invalid', async () => {
    const dto = new UpdateNotificationDto();
    dto.type = 'INVALID_TYPE' as NotificationType;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('type');
  });
});
