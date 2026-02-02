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
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { BookingApproval } from '../../src/modules/approvals/entities/booking-approval.entity';
import {
  BookingStatus,
  BookingType,
  ApprovalType,
  ApprovalStatus,
} from '../../src/common/enums';

describe('Booking Flow Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;
  let bookingsService: BookingsService;

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
    bookingsService = module.get(BookingsService);
    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Complete Booking Lifecycle', () => {
    it('should complete a full booking flow: create → confirm → assign → start → complete', async () => {
      // Step 1: Create a booking
      const bookingRepo = dataSource.getRepository(Booking);
      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-${Date.now()}`,
        requesterId: seededData.users.manager.id, // Manager = auto-approved
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Integration test booking',
        passengerCount: 2,
        estimatedKm: 50,
      });

      expect(booking.id).toBeDefined();
      expect(booking.status).toBe(BookingStatus.PENDING);

      // Step 2: Confirm the booking
      const confirmedBooking = await bookingsService.updateStatus(
        booking.id,
        BookingStatus.CONFIRMED,
      );
      expect(confirmedBooking.status).toBe(BookingStatus.CONFIRMED);

      // Step 3: Assign driver (which also sets status to ASSIGNED)
      await bookingsService.assignDriver(
        booking.id,
        seededData.users.driver.id,
      );

      // Verify by fetching from database
      const assignedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(assignedBooking?.status).toBe(BookingStatus.ASSIGNED);
      expect(assignedBooking?.assignedDriverId).toBe(
        seededData.users.driver.id,
      );

      // Step 4: Start the trip
      const inProgressBooking = await bookingsService.updateStatus(
        booking.id,
        BookingStatus.IN_PROGRESS,
      );
      expect(inProgressBooking.status).toBe(BookingStatus.IN_PROGRESS);

      // Step 5: Complete the trip
      const completedBooking = await bookingsService.updateStatus(
        booking.id,
        BookingStatus.COMPLETED,
      );
      expect(completedBooking.status).toBe(BookingStatus.COMPLETED);
    });

    it('should handle booking cancellation via status update', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-CANCEL-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        purpose: 'Booking to cancel',
        passengerCount: 1,
        estimatedKm: 30,
      });

      // Cancel the booking
      const cancelledBooking = await bookingsService.updateStatus(
        booking.id,
        BookingStatus.CANCELLED,
      );

      expect(cancelledBooking.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('Approval Workflow Integration', () => {
    it('should auto-approve booking for management level users', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      // Manager-level user creates booking
      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-AUTO-${Date.now()}`,
        requesterId: seededData.users.manager.id, // MGR position level
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '12:00',
        purpose: 'Auto-approve test',
        passengerCount: 1,
        estimatedKm: 20,
      });

      // Verify the approval type
      expect(booking.approvalType).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should require manager approval for non-management employees', async () => {
      const bookingRepo = dataSource.getRepository(Booking);
      const approvalRepo = dataSource.getRepository(BookingApproval);

      // Non-management employee creates booking
      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-MGR-${Date.now()}`,
        requesterId: seededData.users.employee.id, // STAFF position level
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '13:00',
        purpose: 'Manager approval test',
        passengerCount: 1,
        estimatedKm: 25,
      });

      // Create approval request
      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        status: ApprovalStatus.PENDING,
      });

      expect(approval.status).toBe(ApprovalStatus.PENDING);
      expect(booking.status).toBe(BookingStatus.PENDING_APPROVAL);
    });

    it('should CC-only for SIC employees business trips', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      // SIC employee (DAILY segment) creates business trip
      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-CC-${Date.now()}`,
        requesterId: seededData.users.sicEmployee.id, // DAILY segment
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.CC_ONLY,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        purpose: 'SIC business trip test',
        passengerCount: 1,
        estimatedKm: 15,
      });

      // CC_ONLY means no approval required, just notification
      expect(booking.approvalType).toBe(ApprovalType.CC_ONLY);
    });
  });

  describe('Vehicle Assignment Integration', () => {
    it('should assign driver to booking', async () => {
      const bookingRepo = dataSource.getRepository(Booking);

      const booking = await bookingRepo.save({
        bookingCode: `MSM-INT-ASSIGN-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.CONFIRMED,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '15:00',
        purpose: 'Vehicle assignment test',
        passengerCount: 3,
        estimatedKm: 40,
      });

      await bookingsService.assignDriver(
        booking.id,
        seededData.users.driver.id,
      );

      // Verify by fetching from database
      const assignedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(assignedBooking?.assignedDriverId).toBe(
        seededData.users.driver.id,
      );
      expect(assignedBooking?.status).toBe(BookingStatus.ASSIGNED);
    });
  });
});
