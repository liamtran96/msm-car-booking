import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { createMockNotifications } from '../../test/factories/notification.factory';
import { generateUuid } from '../../test/utils/test-helper';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let findByUserSpy: jest.Mock;
  let markAsReadSpy: jest.Mock;

  beforeEach(async () => {
    findByUserSpy = jest.fn();
    markAsReadSpy = jest.fn();

    const mockService = {
      findByUser: findByUserSpy,
      markAsRead: markAsReadSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications/user/:userId', () => {
    it('should return notifications for user', async () => {
      const userId = generateUuid();
      const mockNotifications = createMockNotifications(userId, 10);
      findByUserSpy.mockResolvedValue(mockNotifications);

      const result = await controller.findByUser(userId);

      expect(result).toHaveLength(10);
      expect(findByUserSpy).toHaveBeenCalledWith(userId);
    });

    it('should return empty array for user with no notifications', async () => {
      const userId = generateUuid();
      findByUserSpy.mockResolvedValue([]);

      const result = await controller.findByUser(userId);

      expect(result).toHaveLength(0);
    });

    it('should return notifications in descending order by creation date', async () => {
      const userId = generateUuid();
      const notifications = createMockNotifications(userId, 5);
      findByUserSpy.mockResolvedValue(notifications);

      const result = await controller.findByUser(userId);

      expect(result).toHaveLength(5);
      expect(findByUserSpy).toHaveBeenCalledWith(userId);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notificationId = generateUuid();
      markAsReadSpy.mockResolvedValue(undefined);

      await controller.markAsRead(notificationId);

      expect(markAsReadSpy).toHaveBeenCalledWith(notificationId);
    });

    it('should handle marking already read notification', async () => {
      const notificationId = generateUuid();
      markAsReadSpy.mockResolvedValue(undefined);

      await controller.markAsRead(notificationId);

      expect(markAsReadSpy).toHaveBeenCalledWith(notificationId);
    });
  });
});
