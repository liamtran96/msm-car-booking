import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData } from '../../src/test/utils/database-seeder';

describe('Auth (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return JWT token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@test.com');
      expect(response.body.user.role).toBe('ADMIN');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return JWT token with correct payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      const jwtService = context.jwtService;
      const decoded = jwtService.decode(response.body.accessToken);

      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('email', 'admin@test.com');
      expect(decoded).toHaveProperty('role', 'ADMIN');
      expect(decoded).toHaveProperty('exp');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for inactive user', async () => {
      // First deactivate a user
      const userRepo = dataSource.getRepository('User');
      await userRepo.update(
        { email: 'employee@test.com' },
        { isActive: false },
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      // Restore user
      await userRepo.update({ email: 'employee@test.com' }, { isActive: true });
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should require password field', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should work for all user roles', async () => {
      const roles = ['admin', 'pic', 'ga', 'driver', 'employee'];

      for (const role of roles) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: `${role}@test.com`,
            password: 'Test123!@#',
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
      }
    });
  });
});
