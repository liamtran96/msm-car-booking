import { DataSource } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  startTestDatabase,
  getTestDataSourceOptions,
  cleanDatabase,
} from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';
import { BookingsModule } from '../../src/modules/bookings/bookings.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { VehiclesModule } from '../../src/modules/vehicles/vehicles.module';
import { DepartmentsModule } from '../../src/modules/departments/departments.module';
import { ApprovalsModule } from '../../src/modules/approvals/approvals.module';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module';
import { ChatModule } from '../../src/modules/chat/chat.module';
import { ApprovalsService } from '../../src/modules/approvals/approvals.service';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { BookingApproval } from '../../src/modules/approvals/entities/booking-approval.entity';
import {
  BookingStatus,
  BookingType,
  ApprovalType,
  ApprovalStatus,
} from '../../src/common/enums';

describe('Approval Workflow Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;
  let approvalsService: ApprovalsService;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              database: {
                host: container.getHost(),
                port: container.getMappedPort(5432),
                username: container.getUsername(),
                password: container.getPassword(),
                name: container.getDatabase(),
                synchronize: true,
                logging: false,
              },
              app: {
                jwt: {
                  secret: 'test-jwt-secret-key-for-testing',
                  expiresIn: '1d',
                },
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          ...dsOptions,
          autoLoadEntities: true,
        }),
        JwtModule.register({
          secret: 'test-jwt-secret-key-for-testing',
          signOptions: { expiresIn: '1d' },
        }),
        BookingsModule,
        UsersModule,
        VehiclesModule,
        DepartmentsModule,
        ApprovalsModule,
        NotificationsModule,
        ChatModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    approvalsService = module.get(ApprovalsService);
    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Approval Request Creation', () => {
    it('should create approval request when manager approval is required', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      // Create booking that requires approval
      const booking = await bookingRepo.save({
        bookingCode: `MSM-APR-REQ-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Approval request test',
        passengerCount: 1,
        estimatedKm: 30,
      });

      // Create corresponding approval
      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });

      expect(approval.id).toBeDefined();
      expect(approval.status).toBe(ApprovalStatus.PENDING);
      expect(approval.bookingId).toBe(booking.id);
    });
  });

  describe('Approval Decisions', () => {
    it('should approve booking and update status', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      const booking = await bookingRepo.save({
        bookingCode: `MSM-APR-YES-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        purpose: 'Approve test',
        passengerCount: 1,
        estimatedKm: 25,
      });

      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });

      // Approve the request
      const approvedApproval = await approvalsService.approve(
        approval.id,
        seededData.users.manager.id,
        'Approved for business purposes',
      );

      expect(approvedApproval.status).toBe(ApprovalStatus.APPROVED);
      expect(approvedApproval.notes).toBe('Approved for business purposes');

      // Verify booking status updated
      const updatedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(updatedBooking?.status).toBe(BookingStatus.PENDING);
    });

    it('should reject booking and update status', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      const booking = await bookingRepo.save({
        bookingCode: `MSM-APR-NO-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '12:00',
        purpose: 'Reject test',
        passengerCount: 1,
        estimatedKm: 20,
      });

      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });

      // Reject the request
      const rejectedApproval = await approvalsService.reject(
        approval.id,
        seededData.users.manager.id,
        'Budget constraints',
      );

      expect(rejectedApproval.status).toBe(ApprovalStatus.REJECTED);

      // Verify booking status updated
      const updatedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(updatedBooking?.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('Pending Approvals Query', () => {
    it('should return pending approvals for specific approver', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      // Create multiple bookings with pending approvals
      const bookings = await Promise.all([
        bookingRepo.save({
          bookingCode: `MSM-APR-PND1-${Date.now()}`,
          requesterId: seededData.users.employee.id,
          departmentId: seededData.departments[0].id,
          bookingType: BookingType.SINGLE_TRIP,
          status: BookingStatus.PENDING_APPROVAL,
          approvalType: ApprovalType.MANAGER_APPROVAL,
          isBusinessTrip: true,
          scheduledDate: new Date(),
          scheduledTime: '13:00',
          purpose: 'Pending 1',
          passengerCount: 1,
          estimatedKm: 15,
        }),
        bookingRepo.save({
          bookingCode: `MSM-APR-PND2-${Date.now() + 1}`,
          requesterId: seededData.users.employee.id,
          departmentId: seededData.departments[0].id,
          bookingType: BookingType.SINGLE_TRIP,
          status: BookingStatus.PENDING_APPROVAL,
          approvalType: ApprovalType.MANAGER_APPROVAL,
          isBusinessTrip: true,
          scheduledDate: new Date(),
          scheduledTime: '14:00',
          purpose: 'Pending 2',
          passengerCount: 1,
          estimatedKm: 10,
        }),
      ]);

      // Create approvals for each booking
      await Promise.all(
        bookings.map((booking) =>
          approvalRepo.save({
            bookingId: booking.id,
            requesterId: seededData.users.employee.id,
            approverId: seededData.users.manager.id,
            approvalType: ApprovalType.MANAGER_APPROVAL,
            status: ApprovalStatus.PENDING,
          }),
        ),
      );

      // Query pending approvals using correct method name
      const pendingApprovals = await approvalsService.getPendingForApprover(
        seededData.users.manager.id,
      );

      expect(pendingApprovals.length).toBeGreaterThanOrEqual(2);
      expect(
        pendingApprovals.every(
          (a: BookingApproval) => a.status === ApprovalStatus.PENDING,
        ),
      ).toBe(true);
    });
  });

  describe('My Requests Query', () => {
    it('should return requests created by specific user', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      const booking = await bookingRepo.save({
        bookingCode: `MSM-APR-MY-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '15:00',
        purpose: 'My request test',
        passengerCount: 1,
        estimatedKm: 35,
      });

      await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });

      // Use correct method name
      const myRequests = await approvalsService.getMyRequests(
        seededData.users.employee.id,
      );

      expect(myRequests.length).toBeGreaterThan(0);
      expect(
        myRequests.every(
          (a: BookingApproval) =>
            a.requesterId === seededData.users.employee.id,
        ),
      ).toBe(true);
    });
  });
});
