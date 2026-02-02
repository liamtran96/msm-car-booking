import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationStatus } from '../../common/enums';
import {
  createMockNotifications,
  createBookingConfirmedNotification,
} from '../../test/factories/notification.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let findSpy: jest.Mock;
  let updateSpy: jest.Mock;

  beforeEach(async () => {
    findSpy = jest.fn();
    updateSpy = jest.fn();

    const mockRepository = {
      ...createMockRepository<Notification>(),
      find: findSpy,
      update: updateSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      const userId = generateUuid();
      const mockNotifications = createMockNotifications(userId, 10);
      findSpy.mockResolvedValue(mockNotifications);

      const result = await service.findByUser(userId);

      expect(result).toHaveLength(10);
      expect(findSpy).toHaveBeenCalledWith({
        where: { userId },
        relations: ['booking'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should return empty array for user with no notifications', async () => {
      const userId = generateUuid();
      findSpy.mockResolvedValue([]);

      const result = await service.findByUser(userId);

      expect(result).toHaveLength(0);
    });

    it('should limit notifications to 50', async () => {
      const userId = generateUuid();
      const mockNotifications = createMockNotifications(userId, 50);
      findSpy.mockResolvedValue(mockNotifications);

      const result = await service.findByUser(userId);

      expect(result).toHaveLength(50);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });

    it('should include booking relation', async () => {
      const userId = generateUuid();
      const mockNotifications = [
        createBookingConfirmedNotification({ userId }),
      ];
      findSpy.mockResolvedValue(mockNotifications);

      await service.findByUser(userId);

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['booking'],
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = generateUuid();
      updateSpy.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.markAsRead(notificationId);

      expect(updateSpy).toHaveBeenCalledWith(notificationId, {
        status: NotificationStatus.DELIVERED,
      });
    });

    it('should handle non-existent notification', async () => {
      const notificationId = generateUuid();
      updateSpy.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });

      // Should not throw even if notification doesn't exist
      await expect(service.markAsRead(notificationId)).resolves.not.toThrow();
    });

    it('should mark already read notification as read again', async () => {
      const notificationId = generateUuid();
      updateSpy.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await service.markAsRead(notificationId);

      expect(updateSpy).toHaveBeenCalledWith(notificationId, {
        status: NotificationStatus.DELIVERED,
      });
    });
  });
});
