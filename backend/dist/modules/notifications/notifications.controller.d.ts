import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findByUser(userId: string): Promise<import("./entities/notification.entity").Notification[]>;
    markAsRead(id: string): Promise<void>;
}
