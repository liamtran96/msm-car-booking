import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
export declare class NotificationsService {
    private readonly notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    findByUser(userId: string): Promise<Notification[]>;
    markAsRead(id: string): Promise<void>;
}
