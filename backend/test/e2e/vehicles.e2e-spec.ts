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
import { VehicleStatus } from '../../src/common/enums';

describe('Vehicles (e2e)', () => {
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

  describe('GET /vehicles', () => {
    it('should return all vehicles for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('licensePlate');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should return all vehicles for PIC', async () => {
      await request(app.getHttpServer())
        .get('/vehicles')
        .set(authHeader(tokens.picToken))
        .expect(200);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/vehicles').expect(401);
    });
  });

  describe('GET /vehicles/available', () => {
    it('should return only available vehicles', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles/available')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((v: Record<string, string>) => {
        expect(v.status).toBe(VehicleStatus.AVAILABLE);
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/vehicles/available').expect(401);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return vehicle by ID', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(vehicleId);
      expect(response.body.licensePlate).toBe(
        seededData.vehicles[0].licensePlate,
      );
    });

    it('should return 404 for non-existent vehicle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/vehicles/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/vehicles/invalid-uuid')
        .set(authHeader(tokens.adminToken))
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const vehicleId = seededData.vehicles[0].id;

      await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .expect(401);
    });
  });
});
