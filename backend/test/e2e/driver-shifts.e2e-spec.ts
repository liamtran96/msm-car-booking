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
import { DriverShift } from '../../src/modules/users/entities/driver-shift.entity';
import { ShiftStatus } from '../../src/common/enums';

// Helper to get a date offset by days
function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

describe('Driver Shifts (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;
  let testShift: DriverShift;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);

    // Create a test shift on day +10
    const shiftRepo = dataSource.getRepository(DriverShift);
    testShift = await shiftRepo.save({
      driverId: seededData.users.driver.id,
      shiftDate: getDateOffset(10),
      startTime: '08:00',
      endTime: '17:00',
      status: ShiftStatus.SCHEDULED,
    });
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('POST /driver-shifts', () => {
    it('should create shift as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/driver-shifts')
        .set(authHeader(tokens.adminToken))
        .send({
          driverId: seededData.users.driver.id,
          shiftDate: getDateOffset(20),
          startTime: '09:00',
          endTime: '18:00',
        })
        .expect(201);

      expect(response.body.driverId).toBe(seededData.users.driver.id);
      expect(response.body.startTime).toContain('09:00');
    });

    it('should create shift as PIC', async () => {
      const response = await request(app.getHttpServer())
        .post('/driver-shifts')
        .set(authHeader(tokens.picToken))
        .send({
          driverId: seededData.users.driver.id,
          shiftDate: getDateOffset(21),
          startTime: '07:00',
          endTime: '16:00',
        })
        .expect(201);

      expect(response.body.status).toBe(ShiftStatus.SCHEDULED);
    });

    it('should return 403 for DRIVER creating shift', async () => {
      await request(app.getHttpServer())
        .post('/driver-shifts')
        .set(authHeader(tokens.driverToken))
        .send({
          driverId: seededData.users.driver.id,
          shiftDate: getDateOffset(22),
          startTime: '08:00',
          endTime: '17:00',
        })
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/driver-shifts')
        .send({
          driverId: seededData.users.driver.id,
          shiftDate: getDateOffset(23),
          startTime: '08:00',
          endTime: '17:00',
        })
        .expect(401);
    });
  });

  describe('GET /driver-shifts', () => {
    it('should return all shifts for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/driver-shifts')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return all shifts for PIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/driver-shifts')
        .set(authHeader(tokens.picToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for EMPLOYEE', async () => {
      await request(app.getHttpServer())
        .get('/driver-shifts')
        .set(authHeader(tokens.employeeToken))
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/driver-shifts').expect(401);
    });
  });

  describe('GET /driver-shifts/today', () => {
    it('should return today shifts for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/driver-shifts/today')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for DRIVER', async () => {
      await request(app.getHttpServer())
        .get('/driver-shifts/today')
        .set(authHeader(tokens.driverToken))
        .expect(403);
    });
  });

  describe('GET /driver-shifts/available', () => {
    it('should return available drivers for date/time', async () => {
      const response = await request(app.getHttpServer())
        .get(`/driver-shifts/available?date=${getDateOffset(10)}&time=10:00`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for EMPLOYEE', async () => {
      await request(app.getHttpServer())
        .get(`/driver-shifts/available?date=${getDateOffset(10)}&time=10:00`)
        .set(authHeader(tokens.employeeToken))
        .expect(403);
    });
  });

  describe('GET /driver-shifts/my-shifts', () => {
    it('should return shifts for current DRIVER', async () => {
      const response = await request(app.getHttpServer())
        .get('/driver-shifts/my-shifts')
        .set(authHeader(tokens.driverToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for non-DRIVER roles', async () => {
      await request(app.getHttpServer())
        .get('/driver-shifts/my-shifts')
        .set(authHeader(tokens.adminToken))
        .expect(403);
    });
  });

  describe('GET /driver-shifts/driver/:driverId', () => {
    it('should return shifts for specific driver', async () => {
      const response = await request(app.getHttpServer())
        .get(`/driver-shifts/driver/${seededData.users.driver.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/driver-shifts/driver/invalid-uuid')
        .set(authHeader(tokens.adminToken))
        .expect(400);
    });
  });

  describe('GET /driver-shifts/:id', () => {
    it('should return shift by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/driver-shifts/${testShift.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(testShift.id);
    });

    it('should return 404 for non-existent shift', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/driver-shifts/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });
  });

  describe('PATCH /driver-shifts/:id', () => {
    it('should update shift as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/driver-shifts/${testShift.id}`)
        .set(authHeader(tokens.adminToken))
        .send({ endTime: '18:00' })
        .expect(200);

      expect(response.body.endTime).toContain('18:00');
    });

    it('should return 403 for DRIVER', async () => {
      await request(app.getHttpServer())
        .patch(`/driver-shifts/${testShift.id}`)
        .set(authHeader(tokens.driverToken))
        .send({ endTime: '19:00' })
        .expect(403);
    });
  });

  describe('PATCH /driver-shifts/:id/start', () => {
    let startableShift: DriverShift;

    beforeAll(async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      startableShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(30),
        startTime: '06:00',
        endTime: '15:00',
        status: ShiftStatus.SCHEDULED,
      });
    });

    it('should start shift as DRIVER', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/driver-shifts/${startableShift.id}/start`)
        .set(authHeader(tokens.driverToken))
        .expect(200);

      expect(response.body.status).toBe(ShiftStatus.ACTIVE);
    });

    it('should return 403 for ADMIN starting shift', async () => {
      await request(app.getHttpServer())
        .patch(`/driver-shifts/${startableShift.id}/start`)
        .set(authHeader(tokens.adminToken))
        .expect(403);
    });
  });

  describe('PATCH /driver-shifts/:id/end', () => {
    let endableShift: DriverShift;

    beforeAll(async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      endableShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(31),
        startTime: '05:00',
        endTime: '14:00',
        status: ShiftStatus.ACTIVE,
        actualStartTime: '05:00',
      });
    });

    it('should end shift as DRIVER', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/driver-shifts/${endableShift.id}/end`)
        .set(authHeader(tokens.driverToken))
        .expect(200);

      expect(response.body.status).toBe(ShiftStatus.COMPLETED);
    });

    it('should return 403 for ADMIN ending shift', async () => {
      await request(app.getHttpServer())
        .patch(`/driver-shifts/${endableShift.id}/end`)
        .set(authHeader(tokens.adminToken))
        .expect(403);
    });
  });

  describe('PATCH /driver-shifts/:id/cancel', () => {
    let cancellableShift: DriverShift;

    beforeAll(async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      cancellableShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(32),
        startTime: '04:00',
        endTime: '13:00',
        status: ShiftStatus.SCHEDULED,
      });
    });

    it('should cancel shift as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/driver-shifts/${cancellableShift.id}/cancel`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.status).toBe(ShiftStatus.CANCELLED);
    });

    it('should return 403 for DRIVER cancelling', async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      const anotherShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(33),
        startTime: '03:00',
        endTime: '12:00',
        status: ShiftStatus.SCHEDULED,
      });

      await request(app.getHttpServer())
        .patch(`/driver-shifts/${anotherShift.id}/cancel`)
        .set(authHeader(tokens.driverToken))
        .expect(403);
    });
  });

  describe('PATCH /driver-shifts/:id/absent', () => {
    let absentShift: DriverShift;

    beforeAll(async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      absentShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(34),
        startTime: '02:00',
        endTime: '11:00',
        status: ShiftStatus.SCHEDULED,
      });
    });

    it('should mark shift as absent as ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/driver-shifts/${absentShift.id}/absent`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.status).toBe(ShiftStatus.ABSENT);
    });

    it('should return 403 for DRIVER', async () => {
      await request(app.getHttpServer())
        .patch(`/driver-shifts/${absentShift.id}/absent`)
        .set(authHeader(tokens.driverToken))
        .expect(403);
    });
  });

  describe('DELETE /driver-shifts/:id', () => {
    it('should delete shift as ADMIN', async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      const shiftToDelete = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(40),
        startTime: '01:00',
        endTime: '10:00',
        status: ShiftStatus.SCHEDULED,
      });

      const response = await request(app.getHttpServer())
        .delete(`/driver-shifts/${shiftToDelete.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should return 403 for PIC', async () => {
      const shiftRepo = dataSource.getRepository(DriverShift);
      const anotherShift = await shiftRepo.save({
        driverId: seededData.users.driver.id,
        shiftDate: getDateOffset(41),
        startTime: '01:00',
        endTime: '10:00',
        status: ShiftStatus.SCHEDULED,
      });

      await request(app.getHttpServer())
        .delete(`/driver-shifts/${anotherShift.id}`)
        .set(authHeader(tokens.picToken))
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/driver-shifts/${testShift.id}`)
        .expect(401);
    });
  });
});
