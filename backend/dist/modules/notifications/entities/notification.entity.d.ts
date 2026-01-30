import { NotificationChannel, NotificationType, NotificationStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    bookingId: string;
    booking: Booking;
    channel: NotificationChannel;
    notificationType: NotificationType;
    title: string;
    message: string;
    status: NotificationStatus;
    sentAt: Date;
    createdAt: Date;
}
