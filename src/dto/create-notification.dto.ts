import { IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { NotificationType, NotificationPriority } from '../entities/notifications.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID of the user to receive the notification', example: 1 })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Notification message', example: 'Your order has been shipped.' })
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Notification title', example: 'Order Shipped' })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Type of the notification',
    enum: NotificationType,
    example: NotificationType.ORDER_STATUS,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Priority of the notification',
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;
}
