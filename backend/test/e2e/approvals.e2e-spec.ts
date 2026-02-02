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
import { ApprovalStatus, ApprovalType } from '../../src/common/enums';
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
      approvalType: ApprovalType.MANAGER_APPROVAL,
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
      await request(app.getHttpServer()).get('/approvals/pending').expect(401);
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
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should approve request as manager', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/approve`)
        .set(authHeader(tokens.managerToken))
        .send({ notes: 'Approved for business travel' })
        .expect(201);

      expect(response.body.status).toBe(ApprovalStatus.APPROVED);
    });

    it('should return 403 when non-assigned user tries to approve', async () => {
      // Admin is not the assigned approver, so they should get 403
      await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/approve`)
        .set(authHeader(tokens.adminToken))
        .send({})
        .expect(403);
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
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should reject request with reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${pendingApproval.id}/reject`)
        .set(authHeader(tokens.managerToken))
        .send({ notes: 'Budget constraints' })
        .expect(201);

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
        approvalType: ApprovalType.MANAGER_APPROVAL,
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
        .expect(201);

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
        .expect(201);

      expect(response.body.status).toBe(ApprovalStatus.REJECTED);
    });
  });
});
