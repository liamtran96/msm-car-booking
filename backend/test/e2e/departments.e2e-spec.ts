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

describe('Departments (e2e)', () => {
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

  describe('GET /departments', () => {
    it('should return all departments', async () => {
      const response = await request(app.getHttpServer())
        .get('/departments')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('code');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/departments').expect(401);
    });
  });

  describe('GET /departments/:id', () => {
    it('should return department by ID', async () => {
      const deptId = seededData.departments[0].id;

      const response = await request(app.getHttpServer())
        .get(`/departments/${deptId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(deptId);
      expect(response.body.name).toBe(seededData.departments[0].name);
    });

    it('should return 404 for non-existent department', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/departments/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/departments/invalid-uuid')
        .set(authHeader(tokens.adminToken))
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const deptId = seededData.departments[0].id;

      await request(app.getHttpServer())
        .get(`/departments/${deptId}`)
        .expect(401);
    });
  });
});
