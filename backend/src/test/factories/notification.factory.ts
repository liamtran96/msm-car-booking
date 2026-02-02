import { Notification } from '../../modules/notifications/entities/notification.entity';
import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
} from '../../common/enums';
import { generateUuid } from '../utils/test-helper';
import { User } from '../../modules/users/entities/user.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';

export interface CreateNotificationOptions {
  id?: string;
  userId?: string;
  bookingId?: string;
  channel?: NotificationChannel;
  notificationType?: NotificationType;
  title?: string;
  message?: string;
  status?: NotificationStatus;
  sentAt?: Date;
  createdAt?: Date;
}

/**
 * Creates a mock Notification entity
 */
export function createMockNotification(
  options: CreateNotificationOptions = {},
): Notification {
  const now = new Date();

  return {
    id: options.id ?? generateUuid(),
    userId: options.userId ?? generateUuid(),
    user: undefined as unknown as User,
    bookingId: options.bookingId ?? generateUuid(),
    booking: undefined as unknown as Booking,
    channel: options.channel ?? NotificationChannel.APP_PUSH,
    notificationType:
      options.notificationType ?? NotificationType.BOOKING_CONFIRMED,
    title: options.title ?? 'Booking Confirmed',
    message: options.message ?? 'Your booking has been confirmed.',
    status: options.status ?? NotificationStatus.PENDING,
    sentAt: options.sentAt ?? null!,
    createdAt: options.createdAt ?? now,
  };
}

/**
 * Creates a pending notification
 */
export function createPendingNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    status: NotificationStatus.PENDING,
  });
}

/**
 * Creates a sent notification
 */
export function createSentNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    status: NotificationStatus.SENT,
    sentAt: options.sentAt ?? new Date(),
  });
}

/**
 * Creates a delivered notification
 */
export function createDeliveredNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    status: NotificationStatus.DELIVERED,
    sentAt: options.sentAt ?? new Date(),
  });
}

/**
 * Creates a failed notification
 */
export function createFailedNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    status: NotificationStatus.FAILED,
  });
}

/**
 * Creates booking confirmed notification
 */
export function createBookingConfirmedNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    notificationType: NotificationType.BOOKING_CONFIRMED,
    title: 'Booking Confirmed',
    message: 'Your booking has been confirmed.',
  });
}

/**
 * Creates trip started notification
 */
export function createTripStartedNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    notificationType: NotificationType.TRIP_STARTED,
    title: 'Trip Started',
    message: 'Your driver has started the trip.',
  });
}

/**
 * Creates trip completed notification
 */
export function createTripCompletedNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    notificationType: NotificationType.TRIP_COMPLETED,
    title: 'Trip Completed',
    message: 'Your trip has been completed.',
  });
}

/**
 * Creates vehicle arriving notification
 */
export function createVehicleArrivingNotification(
  options: CreateNotificationOptions = {},
): Notification {
  return createMockNotification({
    ...options,
    notificationType: NotificationType.VEHICLE_ARRIVING,
    title: 'Vehicle Arriving',
    message: 'Your vehicle will arrive in 5 minutes.',
  });
}

/**
 * Creates multiple notifications for a user
 */
export function createMockNotifications(
  userId: string,
  count: number,
  options: CreateNotificationOptions = {},
): Notification[] {
  return Array.from({ length: count }, () =>
    createMockNotification({
      ...options,
      userId,
    }),
  );
}
