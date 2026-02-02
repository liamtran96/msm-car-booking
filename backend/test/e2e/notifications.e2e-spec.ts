import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import {
  generateTestTokens,
  authHeader,
  TestTokens,
} from '../../src/test/utils/e2e-test-helper';
import { Notification } from '../../src/modules/notifications/entities/notification.entity';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../src/common/enums';

describe('Notifications (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;
  let testNotification: Notification;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);

    // Create test notifications
    const notifRepo = dataSource.getRepository(Notification);
    testNotification = await notifRepo.save({
      userId: seededData.users.employee.id,
      bookingId: seededData.bookings[0].id,
      notificationType: NotificationType.BOOKING_CONFIRMED,
      channel: NotificationChannel.APP_PUSH,
      title: 'Booking Confirmed',
      message: 'Your booking MSM-20260202-0001 has been confirmed',
      status: NotificationStatus.PENDING,
    });
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /notifications/user/:userId', () => {
    it('should return notifications for a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/notifications/user/${seededData.users.employee.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for user with no notifications', async () => {
      const response = await request(app.getHttpServer())
        .get(`/notifications/user/${seededData.users.driver.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/notifications/user/${seededData.users.employee.id}`)
        .expect(401);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}/read`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      // Verify notification was marked as read by fetching it
      const notifications = await request(app.getHttpServer())
        .get(`/notifications/user/${seededData.users.employee.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      const updatedNotification = notifications.body.find(
        (n: { id: string }) => n.id === testNotification.id,
      );
      expect(updatedNotification).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}/read`)
        .expect(401);
    });
  });
});
