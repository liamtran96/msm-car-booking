import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import {
  NotificationStatus,
  NotificationChannel,
  NotificationType,
} from '../../common/enums';

export interface CreateNotificationData {
  userId: string;
  bookingId?: string;
  channel?: NotificationChannel;
  notificationType: NotificationType;
  title: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      bookingId: data.bookingId,
      channel: data.channel || NotificationChannel.APP_PUSH,
      notificationType: data.notificationType,
      title: data.title,
      message: data.message,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      relations: ['booking'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.DELIVERED,
    });
  }
}
