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
  uniqueEmail,
  TestTokens,
} from '../../src/test/utils/e2e-test-helper';
import { UserRole, UserSegment } from '../../src/common/enums';

describe('Users (e2e)', () => {
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

  describe('GET /users', () => {
    it('should return paginated users for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    });

    it('should return paginated users for PIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(tokens.picToken))
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should return 403 for DRIVER', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(tokens.driverToken))
        .expect(403);
    });

    it('should return 403 for EMPLOYEE', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(tokens.employeeToken))
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=2')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?role=DRIVER')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(
        response.body.data.every(
          (user: Record<string, string>) => user.role === 'DRIVER',
        ),
      ).toBe(true);
    });

    it('should filter by department', async () => {
      const deptId = seededData.departments[0].id;
      const response = await request(app.getHttpServer())
        .get(`/users?departmentId=${deptId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(
        response.body.data.every(
          (user: Record<string, string>) => user.departmentId === deptId,
        ),
      ).toBe(true);
    });
  });

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.email).toBe('admin@test.com');
      expect(response.body.role).toBe('ADMIN');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should work for all user roles', async () => {
      const tokenMap = {
        admin: tokens.adminToken,
        pic: tokens.picToken,
        driver: tokens.driverToken,
        employee: tokens.employeeToken,
      };

      for (const [role, token] of Object.entries(tokenMap)) {
        const response = await request(app.getHttpServer())
          .get('/users/me')
          .set(authHeader(token))
          .expect(200);

        expect(response.body.email).toBe(`${role}@test.com`);
      }
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID for ADMIN', async () => {
      const userId = seededData.users.employee.id;

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('employee@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-uuid')
        .set(authHeader(tokens.adminToken))
        .expect(400);
    });
  });

  describe('POST /users', () => {
    it('should create user as ADMIN', async () => {
      const email = uniqueEmail('newuser');
      const createDto = {
        email,
        password: 'NewUser123!@#',
        fullName: 'New Test User',
        phone: '+84999888777',
        role: UserRole.EMPLOYEE,
        userSegment: UserSegment.SOMETIMES,
        departmentId: seededData.departments[0].id,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(201);

      expect(response.body.email).toBe(email);
      expect(response.body.fullName).toBe('New Test User');
      expect(response.body.role).toBe('EMPLOYEE');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 403 for PIC', async () => {
      const createDto = {
        email: uniqueEmail('forbidden'),
        password: 'Test123!@#',
        fullName: 'Forbidden User',
        phone: '+84999888666',
        role: UserRole.EMPLOYEE,
        departmentId: seededData.departments[0].id,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.picToken))
        .send(createDto)
        .expect(403);
    });

    it('should return 409 for duplicate email', async () => {
      const createDto = {
        email: 'admin@test.com', // Already exists
        password: 'Test123!@#',
        fullName: 'Duplicate User',
        phone: '+84999888555',
        role: UserRole.EMPLOYEE,
        departmentId: seededData.departments[0].id,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user as ADMIN', async () => {
      const userId = seededData.users.employee.id;

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set(authHeader(tokens.adminToken))
        .send({ fullName: 'Updated Employee Name' })
        .expect(200);

      expect(response.body.fullName).toBe('Updated Employee Name');
    });

    it('should return 403 for non-ADMIN', async () => {
      const userId = seededData.users.employee.id;

      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set(authHeader(tokens.picToken))
        .send({ fullName: 'Should Fail' })
        .expect(403);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update own profile', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(tokens.employeeToken))
        .send({ phone: '+84111222333' })
        .expect(200);

      expect(response.body.phone).toBe('+84111222333');
    });

    it('should not allow role change via /me', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set(authHeader(tokens.employeeToken))
        .send({ role: UserRole.ADMIN })
        .expect(200);

      // Role should remain unchanged
      expect(response.body.role).toBe('EMPLOYEE');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should deactivate user as ADMIN', async () => {
      // Create a user to delete
      const email = uniqueEmail('todelete');
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send({
          email,
          password: 'Test123!@#',
          fullName: 'User To Delete',
          phone: '+84999777666',
          role: UserRole.EMPLOYEE,
          departmentId: seededData.departments[0].id,
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Delete the user
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      // Verify user is deactivated
      const userRepo = dataSource.getRepository('User');
      const user = await userRepo.findOneBy({ id: userId });
      expect(user?.isActive).toBe(false);
    });
  });

  describe('GET /users/drivers', () => {
    it('should return all drivers for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.every((u: Record<string, string>) => u.role === 'DRIVER'),
      ).toBe(true);
    });

    it('should return all drivers for PIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers')
        .set(authHeader(tokens.picToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for EMPLOYEE', async () => {
      await request(app.getHttpServer())
        .get('/users/drivers')
        .set(authHeader(tokens.employeeToken))
        .expect(403);
    });
  });

  describe('GET /users/drivers/available', () => {
    it('should return available drivers for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers/available')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return available drivers for PIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers/available')
        .set(authHeader(tokens.picToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for DRIVER', async () => {
      await request(app.getHttpServer())
        .get('/users/drivers/available')
        .set(authHeader(tokens.driverToken))
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/drivers/available')
        .expect(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('should change password with correct current password', async () => {
      // Create a user specifically for password change test
      const email = uniqueEmail('pwdchange');
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send({
          email,
          password: 'OldPass123!@#',
          fullName: 'Password Change Test',
          phone: '+84999666555',
          role: UserRole.EMPLOYEE,
          departmentId: seededData.departments[0].id,
        })
        .expect(201);

      // Generate token for this new user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'OldPass123!@#' })
        .expect(200);

      const userToken = loginResponse.body.accessToken;

      // Change password
      const response = await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(userToken))
        .send({
          currentPassword: 'OldPass123!@#',
          newPassword: 'NewPass456!@#',
          confirmPassword: 'NewPass456!@#',
        })
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Verify new password works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'NewPass456!@#' })
        .expect(200);
    });

    it('should return 400 with wrong current password', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(tokens.employeeToken))
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPass456!@#',
          confirmPassword: 'NewPass456!@#',
        })
        .expect(400);
    });

    it('should validate password fields', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set(authHeader(tokens.employeeToken))
        .send({})
        .expect(400);
    });
  });

  describe('PATCH /users/:id/password/reset (Admin only)', () => {
    it('should reset user password as ADMIN', async () => {
      // Create a user to reset password
      const email = uniqueEmail('pwdreset');
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send({
          email,
          password: 'OriginalPass123!@#',
          fullName: 'Password Reset Test',
          phone: '+84999555444',
          role: UserRole.EMPLOYEE,
          departmentId: seededData.departments[0].id,
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Admin resets password
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}/password/reset`)
        .set(authHeader(tokens.adminToken))
        .send({ newPassword: 'ResetPass789!@#' })
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Verify new password works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'ResetPass789!@#' })
        .expect(200);
    });

    it('should return 403 for non-ADMIN', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seededData.users.employee.id}/password/reset`)
        .set(authHeader(tokens.picToken))
        .send({ newPassword: 'NewPass123!@#' })
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .patch(`/users/${fakeId}/password/reset`)
        .set(authHeader(tokens.adminToken))
        .send({ newPassword: 'NewPass123!@#' })
        .expect(404);
    });
  });

  describe('PATCH /users/:id/restore (Admin only)', () => {
    it('should restore deactivated user as ADMIN', async () => {
      // Create and deactivate a user
      const email = uniqueEmail('torestore');
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(tokens.adminToken))
        .send({
          email,
          password: 'Test123!@#',
          fullName: 'User To Restore',
          phone: '+84999444333',
          role: UserRole.EMPLOYEE,
          departmentId: seededData.departments[0].id,
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Deactivate the user
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      // Verify user is deactivated
      const userRepo = dataSource.getRepository('User');
      let user = await userRepo.findOneBy({ id: userId });
      expect(user?.isActive).toBe(false);

      // Restore the user
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}/restore`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.isActive).toBe(true);

      // Verify user is restored
      user = await userRepo.findOneBy({ id: userId });
      expect(user?.isActive).toBe(true);
    });

    it('should return 403 for non-ADMIN', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seededData.users.employee.id}/restore`)
        .set(authHeader(tokens.picToken))
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .patch(`/users/${fakeId}/restore`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });
  });
});
