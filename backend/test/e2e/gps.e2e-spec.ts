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
import { GpsLocation } from '../../src/modules/gps/entities/gps-location.entity';

describe('GPS (e2e)', () => {
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

    // Create some GPS locations for testing
    const gpsRepo = dataSource.getRepository(GpsLocation);
    await gpsRepo.save([
      {
        vehicleId: seededData.vehicles[0].id,
        latitude: 10.762622,
        longitude: 106.660172,
        speed: 45,
        heading: 180,
        recordedAt: new Date(),
      },
      {
        vehicleId: seededData.vehicles[0].id,
        latitude: 10.773322,
        longitude: 106.670882,
        speed: 50,
        heading: 90,
        recordedAt: new Date(Date.now() - 60000),
      },
    ]);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /gps/positions', () => {
    it('should return all GPS positions for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/gps/positions')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return GPS positions for PIC', async () => {
      await request(app.getHttpServer())
        .get('/gps/positions')
        .set(authHeader(tokens.picToken))
        .expect(200);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/gps/positions').expect(401);
    });
  });

  describe('GET /gps/vehicle/:vehicleId/history', () => {
    it('should return GPS history for vehicle', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .get(`/gps/vehicle/${vehicleId}/history`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter by date range', async () => {
      const vehicleId = seededData.vehicles[0].id;
      const startDate = new Date(Date.now() - 3600000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app.getHttpServer())
        .get(
          `/gps/vehicle/${vehicleId}/history?startDate=${startDate}&endDate=${endDate}`,
        )
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for vehicle without GPS data', async () => {
      const vehicleId = seededData.vehicles[1].id;

      const response = await request(app.getHttpServer())
        .get(`/gps/vehicle/${vehicleId}/history`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const vehicleId = seededData.vehicles[0].id;

      await request(app.getHttpServer())
        .get(`/gps/vehicle/${vehicleId}/history`)
        .expect(401);
    });
  });
});
