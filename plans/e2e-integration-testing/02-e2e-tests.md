# Phase 2: E2E Test Implementation

**Document ID:** PLAN-20260202-E2E-TESTING-02
**Phase:** E2E Tests
**Status:** Active
**Estimated Effort:** 8-12 hours

## Overview

This phase implements comprehensive E2E tests for all API endpoints, testing complete HTTP request/response cycles with a real database.

## Test Structure

Each E2E test file follows this pattern:

```typescript
describe('ModuleName (e2e)', () => {
  // Test app setup
  beforeAll(async () => { /* Start app, seed data */ });
  afterAll(async () => { /* Cleanup */ });
  beforeEach(async () => { /* Reset state if needed */ });

  // Group tests by endpoint
  describe('GET /endpoint', () => {
    it('should return expected result for authorized user', async () => {});
    it('should return 401 for unauthorized request', async () => {});
    it('should return 403 for insufficient permissions', async () => {});
  });
});
```

---

## Task 2.1: Auth Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/auth.e2e-spec.ts`

```typescript
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';

describe('Auth (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
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
      const decoded = jwtService.decode(response.body.accessToken) as Record<string, unknown>;

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

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      // First deactivate a user
      const userRepo = dataSource.getRepository('User');
      await userRepo.update({ email: 'employee@test.com' }, { isActive: false });

      const response = await request(app.getHttpServer())
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

      expect(response.body.message).toContain('email');
    });

    it('should require password field', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
        })
        .expect(400);

      expect(response.body.message).toContain('password');
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
```

---

## Task 2.2: Users Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/users.e2e-spec.ts`

```typescript
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
import { UserRole, UserSegment, PositionLevel } from '../../src/common/enums';

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
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=2')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.currentPage).toBe(1);
      expect(response.body.meta.itemsPerPage).toBe(2);
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?role=DRIVER')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.data.every((user: Record<string, string>) => user.role === 'DRIVER')).toBe(true);
    });

    it('should filter by department', async () => {
      const deptId = seededData.departments[0].id;
      const response = await request(app.getHttpServer())
        .get(`/users?departmentId=${deptId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.data.every(
        (user: Record<string, string>) => user.departmentId === deptId
      )).toBe(true);
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
        positionLevel: PositionLevel.STAFF,
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
      expect(user.isActive).toBe(false);
    });
  });

  describe('GET /users/drivers', () => {
    it('should return all drivers for ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((u: Record<string, string>) => u.role === 'DRIVER')).toBe(true);
    });

    it('should return all drivers for PIC', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/drivers')
        .set(authHeader(tokens.picToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

---

## Task 2.3: Bookings Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/bookings.e2e-spec.ts`

```typescript
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
import { BookingStatus } from '../../src/common/enums';

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
      await request(app.getHttpServer())
        .get('/bookings')
        .expect(401);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=PENDING')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.every(
        (b: Record<string, string>) => b.status === BookingStatus.PENDING
      )).toBe(true);
    });

    it('should include related entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      const bookingWithRelations = response.body.find(
        (b: Record<string, unknown>) => b.requester !== null
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
      expect(response.body.bookingCode).toBe(seededData.bookings[0].bookingCode);
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
      // Create a new driver with no bookings
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
        expect(b.status).toBe(BookingStatus.CONFIRMED);
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
```

---

## Task 2.4: Approvals Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/approvals.e2e-spec.ts`

```typescript
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
import { ApprovalStatus } from '../../src/common/enums';
import { BookingApproval } from '../../src/modules/approvals/entities/booking-approval.entity';

describe('Approvals (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;
  let testApproval: BookingApproval;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);

    // Create a test approval
    const approvalRepo = dataSource.getRepository(BookingApproval);
    testApproval = await approvalRepo.save({
      bookingId: seededData.bookings[0].id,
      requesterId: seededData.users.employee.id,
      approverId: seededData.users.manager.id,
      status: ApprovalStatus.PENDING,
    });
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /approvals/pending', () => {
    it('should return pending approvals for manager', async () => {
      const response = await request(app.getHttpServer())
        .get('/approvals/pending')
        .set(authHeader(tokens.managerToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/approvals/pending')
        .expect(401);
    });
  });

  describe('GET /approvals/my-requests', () => {
    it('should return approval requests created by current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/approvals/my-requests')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /approvals/:id', () => {
    it('should return approval by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/approvals/${testApproval.id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(testApproval.id);
      expect(response.body.status).toBe(ApprovalStatus.PENDING);
    });

    it('should return 404 for non-existent approval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/approvals/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });
  });

  describe('GET /approvals/booking/:bookingId', () => {
    it('should return approval by booking ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/approvals/booking/${seededData.bookings[0].id}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.bookingId).toBe(seededData.bookings[0].id);
    });
  });

  describe('POST /approvals/:id/approve', () => {
    let pendingApproval: BookingApproval;

    beforeEach(async () => {
      // Create a fresh pending approval for each test
      const approvalRepo = dataSource.getRepository(BookingApproval);
      pendingApproval = await approvalRepo.save({
        bookingId: seededData.bookings[0].id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should approve request as manager', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/approve`)
        .set(authHeader(tokens.managerToken))
        .send({ notes: 'Approved for business travel' })
        .expect(200);

      expect(response.body.status).toBe(ApprovalStatus.APPROVED);
    });

    it('should approve request as admin', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/approve`)
        .set(authHeader(tokens.adminToken))
        .send({})
        .expect(200);

      expect(response.body.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  describe('POST /approvals/:id/reject', () => {
    let pendingApproval: BookingApproval;

    beforeEach(async () => {
      const approvalRepo = dataSource.getRepository(BookingApproval);
      pendingApproval = await approvalRepo.save({
        bookingId: seededData.bookings[0].id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should reject request with reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/reject`)
        .set(authHeader(tokens.managerToken))
        .send({ notes: 'Budget constraints' })
        .expect(200);

      expect(response.body.status).toBe(ApprovalStatus.REJECTED);
    });
  });

  describe('POST /approvals/:id/respond', () => {
    let pendingApproval: BookingApproval;

    beforeEach(async () => {
      const approvalRepo = dataSource.getRepository(BookingApproval);
      pendingApproval = await approvalRepo.save({
        bookingId: seededData.bookings[0].id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should respond with APPROVED decision', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/respond`)
        .set(authHeader(tokens.managerToken))
        .send({
          decision: ApprovalStatus.APPROVED,
          notes: 'Looks good',
        })
        .expect(200);

      expect(response.body.status).toBe(ApprovalStatus.APPROVED);
    });

    it('should respond with REJECTED decision', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/respond`)
        .set(authHeader(tokens.managerToken))
        .send({
          decision: ApprovalStatus.REJECTED,
          notes: 'Not approved due to timing',
        })
        .expect(200);

      expect(response.body.status).toBe(ApprovalStatus.REJECTED);
    });
  });
});
```

---

## Task 2.5: Vehicles Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/vehicles.e2e-spec.ts`

```typescript
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
import { VehicleStatus, VehicleType } from '../../src/common/enums';

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
      await request(app.getHttpServer())
        .get('/vehicles')
        .expect(401);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles?status=AVAILABLE')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      response.body.forEach((v: Record<string, string>) => {
        expect(v.status).toBe(VehicleStatus.AVAILABLE);
      });
    });

    it('should filter by vehicle type', async () => {
      const response = await request(app.getHttpServer())
        .get('/vehicles?vehicleType=SEDAN')
        .set(authHeader(tokens.adminToken))
        .expect(200);

      response.body.forEach((v: Record<string, string>) => {
        expect(v.vehicleType).toBe(VehicleType.SEDAN);
      });
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
  });

  describe('GET /vehicles/:id', () => {
    it('should return vehicle by ID', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body.id).toBe(vehicleId);
      expect(response.body.licensePlate).toBe(seededData.vehicles[0].licensePlate);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/vehicles/${fakeId}`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
    });
  });

  describe('POST /vehicles', () => {
    it('should create vehicle as ADMIN', async () => {
      const createDto = {
        licensePlate: '51A-NEW01',
        brand: 'Honda',
        model: 'Accord',
        year: 2024,
        capacity: 4,
        vehicleType: VehicleType.SEDAN,
        status: VehicleStatus.AVAILABLE,
        currentOdometerKm: 0,
        gpsDeviceId: 'GPS-NEW-001',
      };

      const response = await request(app.getHttpServer())
        .post('/vehicles')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(201);

      expect(response.body.licensePlate).toBe('51A-NEW01');
      expect(response.body.brand).toBe('Honda');
    });

    it('should return 403 for DRIVER', async () => {
      const createDto = {
        licensePlate: '51A-FAIL1',
        brand: 'Test',
        model: 'Model',
        year: 2024,
        capacity: 4,
        vehicleType: VehicleType.SEDAN,
      };

      await request(app.getHttpServer())
        .post('/vehicles')
        .set(authHeader(tokens.driverToken))
        .send(createDto)
        .expect(403);
    });

    it('should return 409 for duplicate license plate', async () => {
      const createDto = {
        licensePlate: seededData.vehicles[0].licensePlate, // Already exists
        brand: 'Test',
        model: 'Model',
        year: 2024,
        capacity: 4,
        vehicleType: VehicleType.SEDAN,
      };

      await request(app.getHttpServer())
        .post('/vehicles')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(409);
    });
  });

  describe('PATCH /vehicles/:id', () => {
    it('should update vehicle as ADMIN', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .patch(`/vehicles/${vehicleId}`)
        .set(authHeader(tokens.adminToken))
        .send({ currentOdometerKm: 12000 })
        .expect(200);

      expect(response.body.currentOdometerKm).toBe(12000);
    });

    it('should update vehicle status', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .patch(`/vehicles/${vehicleId}`)
        .set(authHeader(tokens.adminToken))
        .send({ status: VehicleStatus.MAINTENANCE })
        .expect(200);

      expect(response.body.status).toBe(VehicleStatus.MAINTENANCE);

      // Restore status
      await request(app.getHttpServer())
        .patch(`/vehicles/${vehicleId}`)
        .set(authHeader(tokens.adminToken))
        .send({ status: VehicleStatus.AVAILABLE });
    });
  });
});
```

---

## Task 2.6: Chat Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/chat.e2e-spec.ts`

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { io, Socket } from 'socket.io-client';
import { startTestDatabase, cleanDatabase } from '../setup/test-database';
import { createTestApp, TestAppContext } from '../setup/test-app.factory';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import {
  generateTestTokens,
  authHeader,
  TestTokens,
  wait,
} from '../../src/test/utils/e2e-test-helper';
import { ChatRoom } from '../../src/modules/chat/entities/chat-room.entity';
import { BookingType, ChatRoomStatus } from '../../src/common/enums';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';

describe('Chat (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let context: TestAppContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let seededData: SeededData;
  let tokens: TestTokens;
  let testChatRoom: ChatRoom;
  let clientSocket: Socket;

  beforeAll(async () => {
    container = await startTestDatabase();
    context = await createTestApp(container);
    app = context.app;
    dataSource = context.dataSource;
    seededData = await seedTestData(dataSource);
    tokens = generateTestTokens(context.jwtService, seededData.users);

    // Create a block schedule booking (required for chat)
    const bookingRepo = dataSource.getRepository(Booking);
    const blockBooking = await bookingRepo.save({
      bookingCode: 'MSM-20260202-CHAT',
      requesterId: seededData.users.employee.id,
      departmentId: seededData.departments[0].id,
      bookingType: BookingType.BLOCK_SCHEDULE,
      status: 'CONFIRMED',
      scheduledDate: new Date(),
      scheduledTime: '09:00',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      purpose: 'Test block schedule',
      passengerCount: 1,
      estimatedKm: 100,
      assignedVehicleId: seededData.vehicles[0].id,
      assignedDriverId: seededData.users.driver.id,
    });

    // Create a test chat room
    const chatRoomRepo = dataSource.getRepository(ChatRoom);
    testChatRoom = await chatRoomRepo.save({
      bookingId: blockBooking.id,
      employeeId: seededData.users.employee.id,
      driverId: seededData.users.driver.id,
      status: ChatRoomStatus.ACTIVE,
    });

    // Start app for WebSocket
    await app.listen(0);
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    await cleanDatabase(dataSource);
    await app.close();
  });

  describe('GET /chat/rooms', () => {
    it('should return chat rooms for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/rooms')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /chat/rooms/:id', () => {
    it('should return chat room by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body.id).toBe(testChatRoom.id);
      expect(response.body.status).toBe(ChatRoomStatus.ACTIVE);
    });

    it('should return 404 for non-existent room', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/chat/rooms/${fakeId}`)
        .set(authHeader(tokens.employeeToken))
        .expect(404);
    });
  });

  describe('GET /chat/rooms/:id/messages', () => {
    it('should return messages for chat room', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${testChatRoom.id}/messages?limit=10&offset=0`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /chat/rooms/:id/messages', () => {
    it('should send message to chat room', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .send({ content: 'Test message from E2E test' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Test message from E2E test');
      expect(response.body.senderId).toBe(seededData.users.employee.id);
    });

    it('should validate message content', async () => {
      await request(app.getHttpServer())
        .post(`/chat/rooms/${testChatRoom.id}/messages`)
        .set(authHeader(tokens.employeeToken))
        .send({}) // Missing content
        .expect(400);
    });
  });

  describe('WebSocket /chat', () => {
    it('should connect to chat gateway with JWT token', async () => {
      const address = app.getHttpServer().address();
      const port = typeof address === 'object' ? address?.port : 3000;

      return new Promise<void>((resolve, reject) => {
        clientSocket = io(`http://localhost:${port}/chat`, {
          auth: { token: tokens.employeeToken },
          transports: ['websocket'],
        });

        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        });

        clientSocket.on('connect_error', (error) => {
          reject(error);
        });

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    it('should join room via WebSocket', async () => {
      const address = app.getHttpServer().address();
      const port = typeof address === 'object' ? address?.port : 3000;

      return new Promise<void>((resolve, reject) => {
        const socket = io(`http://localhost:${port}/chat`, {
          auth: { 
            token: tokens.employeeToken,
            userId: seededData.users.employee.id,
          },
          transports: ['websocket'],
        });

        socket.on('connect', async () => {
          socket.emit('joinRoom', { roomId: testChatRoom.id }, (response: { success: boolean }) => {
            expect(response.success).toBe(true);
            socket.disconnect();
            resolve();
          });
        });

        socket.on('connect_error', (error) => {
          socket.disconnect();
          reject(error);
        });

        setTimeout(() => {
          socket.disconnect();
          reject(new Error('Join room timeout'));
        }, 5000);
      });
    });

    it('should receive real-time messages', async () => {
      const address = app.getHttpServer().address();
      const port = typeof address === 'object' ? address?.port : 3000;

      return new Promise<void>((resolve, reject) => {
        const employeeSocket = io(`http://localhost:${port}/chat`, {
          auth: { 
            token: tokens.employeeToken,
            userId: seededData.users.employee.id,
          },
          transports: ['websocket'],
        });

        const driverSocket = io(`http://localhost:${port}/chat`, {
          auth: { 
            token: tokens.driverToken,
            userId: seededData.users.driver.id,
          },
          transports: ['websocket'],
        });

        let connectedCount = 0;

        const checkBothConnected = () => {
          connectedCount++;
          if (connectedCount === 2) {
            // Both connected, join room and send message
            employeeSocket.emit('joinRoom', { roomId: testChatRoom.id });
            driverSocket.emit('joinRoom', { roomId: testChatRoom.id });

            // Listen for new message on driver socket
            driverSocket.on('newMessage', (message: { content: string }) => {
              expect(message.content).toBe('Real-time test message');
              employeeSocket.disconnect();
              driverSocket.disconnect();
              resolve();
            });

            // Send message from employee after joining
            setTimeout(() => {
              employeeSocket.emit('message', {
                roomId: testChatRoom.id,
                content: 'Real-time test message',
              });
            }, 500);
          }
        };

        employeeSocket.on('connect', checkBothConnected);
        driverSocket.on('connect', checkBothConnected);

        employeeSocket.on('connect_error', (err) => {
          employeeSocket.disconnect();
          driverSocket.disconnect();
          reject(err);
        });

        setTimeout(() => {
          employeeSocket.disconnect();
          driverSocket.disconnect();
          reject(new Error('Real-time message timeout'));
        }, 10000);
      });
    });
  });
});
```

---

## Task 2.7: Departments Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/departments.e2e-spec.ts`

```typescript
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
  });

  describe('POST /departments', () => {
    it('should create department as ADMIN', async () => {
      const createDto = {
        name: 'Human Resources',
        code: 'HR',
        costCenter: 'CC-HR-001',
      };

      const response = await request(app.getHttpServer())
        .post('/departments')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('Human Resources');
      expect(response.body.code).toBe('HR');
    });

    it('should return 403 for non-ADMIN', async () => {
      const createDto = {
        name: 'Finance',
        code: 'FIN',
      };

      await request(app.getHttpServer())
        .post('/departments')
        .set(authHeader(tokens.employeeToken))
        .send(createDto)
        .expect(403);
    });
  });

  describe('PATCH /departments/:id', () => {
    it('should update department as ADMIN', async () => {
      const deptId = seededData.departments[0].id;

      const response = await request(app.getHttpServer())
        .patch(`/departments/${deptId}`)
        .set(authHeader(tokens.adminToken))
        .send({ costCenter: 'CC-001-UPDATED' })
        .expect(200);

      expect(response.body.costCenter).toBe('CC-001-UPDATED');
    });
  });

  describe('DELETE /departments/:id', () => {
    it('should deactivate department as ADMIN', async () => {
      // Create a department to delete
      const createResponse = await request(app.getHttpServer())
        .post('/departments')
        .set(authHeader(tokens.adminToken))
        .send({
          name: 'To Delete',
          code: 'DEL',
        })
        .expect(201);

      const deptId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/departments/${deptId}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      // Verify department is deactivated
      const deptRepo = dataSource.getRepository('Department');
      const dept = await deptRepo.findOneBy({ id: deptId });
      expect(dept.isActive).toBe(false);
    });
  });
});
```

---

## Task 2.8: GPS Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/gps.e2e-spec.ts`

```typescript
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

  describe('GET /gps/vehicle/:vehicleId/latest', () => {
    it('should return latest GPS location for vehicle', async () => {
      const vehicleId = seededData.vehicles[0].id;

      const response = await request(app.getHttpServer())
        .get(`/gps/vehicle/${vehicleId}/latest`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('speed');
      expect(response.body.vehicleId).toBe(vehicleId);
    });

    it('should return 404 for vehicle without GPS data', async () => {
      // Use a vehicle without GPS data
      const vehicleWithoutGps = seededData.vehicles[1].id;

      await request(app.getHttpServer())
        .get(`/gps/vehicle/${vehicleWithoutGps}/latest`)
        .set(authHeader(tokens.adminToken))
        .expect(404);
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
        .get(`/gps/vehicle/${vehicleId}/history?startDate=${startDate}&endDate=${endDate}`)
        .set(authHeader(tokens.adminToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /gps/location', () => {
    it('should record GPS location', async () => {
      const createDto = {
        vehicleId: seededData.vehicles[1].id,
        latitude: 10.800000,
        longitude: 106.700000,
        speed: 30,
        heading: 270,
      };

      const response = await request(app.getHttpServer())
        .post('/gps/location')
        .set(authHeader(tokens.adminToken))
        .send(createDto)
        .expect(201);

      expect(response.body.latitude).toBe(10.8);
      expect(response.body.longitude).toBe(106.7);
    });

    it('should validate coordinates', async () => {
      const invalidDto = {
        vehicleId: seededData.vehicles[0].id,
        latitude: 200, // Invalid latitude
        longitude: 106.7,
      };

      await request(app.getHttpServer())
        .post('/gps/location')
        .set(authHeader(tokens.adminToken))
        .send(invalidDto)
        .expect(400);
    });
  });
});
```

---

## Task 2.9: Notifications Module E2E Tests

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/e2e/notifications.e2e-spec.ts`

```typescript
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
import { NotificationType, NotificationChannel, NotificationStatus } from '../../src/common/enums';

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
      type: NotificationType.BOOKING_CONFIRMED,
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

  describe('GET /notifications', () => {
    it('should return notifications for current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications?status=PENDING')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((n: Record<string, string>) => {
        expect(n.status).toBe(NotificationStatus.PENDING);
      });
    });
  });

  describe('GET /notifications/:id', () => {
    it('should return notification by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/notifications/${testNotification.id}`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body.id).toBe(testNotification.id);
      expect(response.body.type).toBe(NotificationType.BOOKING_CONFIRMED);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}/read`)
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.DELIVERED);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const response = await request(app.getHttpServer())
        .patch('/notifications/read-all')
        .set(authHeader(tokens.employeeToken))
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
```

---

## Verification Checklist

After implementing all E2E tests:

- [ ] All test files compile without errors
- [ ] Each module has comprehensive endpoint coverage
- [ ] Authentication and authorization are tested
- [ ] Error cases (400, 401, 403, 404) are covered
- [ ] WebSocket tests pass consistently
- [ ] Tests run in isolation without pollution
- [ ] Test data is cleaned up after each suite

## Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e -- --testPathPattern=auth.e2e-spec

# Run with verbose output
pnpm test:e2e -- --verbose

# Run with coverage
pnpm test:e2e:cov
```

## Next Steps

After completing E2E tests, proceed to:
- **03-integration-tests.md** - Implement integration tests for complex workflows

