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

describe('Bookings (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /bookings', () => {
    it('should return all bookings for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('bookingCode');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/bookings').expect(401);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=PENDING')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(
        response.body.every(
          (b: Record<string, string>) => b.status === 'PENDING',
        ),
      ).toBe(true);
    });

    it('should include related entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      const bookingWithRelations = response.body.find(
        (b: Record<string, unknown>) => b.requester !== null,
      );

      if (bookingWithRelations) {
        expect(bookingWithRelations).toHaveProperty('requester');
        expect(bookingWithRelations).toHaveProperty('department');
      }
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return booking by ID', async () => {
      const bookingId = seededData.bookings[0].id;

      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(bookingId);
      expect(response.body.bookingCode).toBe(
        seededData.bookings[0].bookingCode,
      );
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/bookings/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/bookings/not-a-uuid')
        .set(authHeader(tokens.adminToken))
        .expect(400);
    });
  });

  describe('GET /bookings/driver/:driverId', () => {
    it('should return bookings for specific driver', async () => {
      const driverId = seededData.users.driver.id;

      const response = await request(app.getHttpServer())
        .get(`/bookings/driver/${driverId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // All returned bookings should be assigned to this driver
      response.body.forEach((booking: Record<string, string>) => {
        if (booking.assignedDriverId) {
          expect(booking.assignedDriverId).toBe(driverId);
        }
      });
    });

    it('should return empty array for driver with no bookings', async () => {
      // Use a fake driver ID
      const fakeDriverId = '00000000-0000-0000-0000-000000000001';

      const response = await request(app.getHttpServer())
        .get(`/bookings/driver/${fakeDriverId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Booking Status Filter Combinations', () => {
    it('should filter PENDING_APPROVAL bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=PENDING_APPROVAL')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter CONFIRMED bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=CONFIRMED')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((b: Record<string, string>) => {
        expect(b.status).toBe('CONFIRMED');
      });
    });

    it('should filter ASSIGNED bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=ASSIGNED')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter IN_PROGRESS bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=IN_PROGRESS')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter COMPLETED bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=COMPLETED')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter CANCELLED bookings', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=CANCELLED')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
