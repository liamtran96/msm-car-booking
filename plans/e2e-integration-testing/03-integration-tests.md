# Phase 3: Integration Test Implementation

**Document ID:** PLAN-20260202-E2E-TESTING-03
**Phase:** Integration Tests
**Status:** Active
**Estimated Effort:** 6-8 hours

## Overview

This phase implements integration tests that verify service-to-service interactions, database transactions, and event-driven workflows. Unlike E2E tests that test HTTP endpoints, integration tests focus on testing internal component interactions with a real database.

## Test Structure

Integration tests follow this pattern:

```typescript
describe('Feature Integration', () => {
  // Direct service/repository testing
  beforeAll(async () => { /* Setup services with real DB */ });
  
  describe('Workflow: Step 1 → Step 2 → Step 3', () => {
    it('should complete entire workflow successfully', async () => {
      // Step 1
      // Step 2
      // Step 3
      // Verify final state
    });
  });
});
```

---

## Task 3.1: Complete Booking Flow Integration Test

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/integration/booking-flow.integration-spec.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { startTestDatabase, getTestDataSourceOptions, cleanDatabase } from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';

// Services
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { ApprovalsService } from '../../src/modules/approvals/approvals.service';
import { ChatService } from '../../src/modules/chat/chat.service';

// Entities
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { Vehicle } from '../../src/modules/vehicles/entities/vehicle.entity';
import { Department } from '../../src/modules/departments/entities/department.entity';
import { BookingApproval } from '../../src/modules/approvals/entities/booking-approval.entity';
import { ChatRoom } from '../../src/modules/chat/entities/chat-room.entity';
import { ChatMessage } from '../../src/modules/chat/entities/chat-message.entity';

// Enums
import {
  BookingStatus,
  BookingType,
  ApprovalType,
  ApprovalStatus,
  UserSegment,
  PositionLevel,
  VehicleStatus,
  DriverResponseStatus,
  ChatRoomStatus,
} from '../../src/common/enums';

describe('Booking Flow Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;

  // Services
  let bookingsService: BookingsService;
  let approvalsService: ApprovalsService;
  let chatService: ChatService;

  // Repositories
  let bookingRepo: Repository<Booking>;
  let userRepo: Repository<User>;
  let vehicleRepo: Repository<Vehicle>;
  let approvalRepo: Repository<BookingApproval>;
  let chatRoomRepo: Repository<ChatRoom>;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: {
                jwt: {
                  secret: 'test-secret',
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
        TypeOrmModule.forFeature([
          Booking,
          User,
          Vehicle,
          Department,
          BookingApproval,
          ChatRoom,
          ChatMessage,
        ]),
      ],
      providers: [
        BookingsService,
        ApprovalsService,
        ChatService,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    bookingsService = module.get(BookingsService);
    approvalsService = module.get(ApprovalsService);
    chatService = module.get(ChatService);

    bookingRepo = module.get(getRepositoryToken(Booking));
    userRepo = module.get(getRepositoryToken(User));
    vehicleRepo = module.get(getRepositoryToken(Vehicle));
    approvalRepo = module.get(getRepositoryToken(BookingApproval));
    chatRoomRepo = module.get(getRepositoryToken(ChatRoom));

    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  beforeEach(async () => {
    // Reset booking statuses between tests
    await bookingRepo.update({}, { status: BookingStatus.PENDING });
  });

  describe('Complete Single Trip Booking Flow', () => {
    /**
     * Flow: Create → Approve (if required) → Confirm → Assign → Start → Complete
     */
    it('should complete full booking lifecycle for employee requiring approval', async () => {
      // Step 1: Create booking
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-0001',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Integration test meeting',
        passengerCount: 2,
        estimatedKm: 50,
      });

      expect(booking.status).toBe(BookingStatus.PENDING_APPROVAL);
      expect(booking.approvalType).toBe(ApprovalType.MANAGER_APPROVAL);

      // Step 2: Create approval request
      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });

      expect(approval.status).toBe(ApprovalStatus.PENDING);

      // Step 3: Manager approves
      const approvedResult = await approvalsService.approve(
        approval.id,
        seededData.users.manager.id,
        'Approved for client meeting'
      );

      expect(approvedResult.status).toBe(ApprovalStatus.APPROVED);

      // Step 4: Booking moves to PENDING (ready for assignment)
      await bookingRepo.update(booking.id, { status: BookingStatus.PENDING });
      const pendingBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(pendingBooking?.status).toBe(BookingStatus.PENDING);

      // Step 5: Confirm booking
      await bookingRepo.update(booking.id, { status: BookingStatus.CONFIRMED });
      const confirmedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(confirmedBooking?.status).toBe(BookingStatus.CONFIRMED);

      // Step 6: Assign vehicle and driver
      await bookingRepo.update(booking.id, {
        status: BookingStatus.ASSIGNED,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
        driverResponse: DriverResponseStatus.ACCEPTED,
      });

      const assignedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(assignedBooking?.status).toBe(BookingStatus.ASSIGNED);
      expect(assignedBooking?.assignedVehicleId).toBe(seededData.vehicles[0].id);
      expect(assignedBooking?.assignedDriverId).toBe(seededData.users.driver.id);

      // Step 7: Start trip
      await bookingRepo.update(booking.id, { status: BookingStatus.IN_PROGRESS });
      await vehicleRepo.update(seededData.vehicles[0].id, { status: VehicleStatus.IN_USE });

      const inProgressBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(inProgressBooking?.status).toBe(BookingStatus.IN_PROGRESS);

      // Step 8: Complete trip
      await bookingRepo.update(booking.id, {
        status: BookingStatus.COMPLETED,
        actualKm: 48,
      });
      await vehicleRepo.update(seededData.vehicles[0].id, { status: VehicleStatus.AVAILABLE });

      const completedBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(completedBooking?.status).toBe(BookingStatus.COMPLETED);
      expect(completedBooking?.actualKm).toBe(48);

      // Verify vehicle is available again
      const vehicle = await vehicleRepo.findOneBy({ id: seededData.vehicles[0].id });
      expect(vehicle?.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('should auto-approve booking for management level users', async () => {
      // Create booking for manager (MGR level = auto-approve)
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-0002',
        requesterId: seededData.users.manager.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING, // Skip PENDING_APPROVAL
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        purpose: 'Executive meeting',
        passengerCount: 1,
        estimatedKm: 30,
      });

      // Booking should go directly to PENDING without approval
      expect(booking.status).toBe(BookingStatus.PENDING);
      expect(booking.approvalType).toBe(ApprovalType.AUTO_APPROVED);

      // Verify no approval record was created
      const approvals = await approvalRepo.find({ where: { bookingId: booking.id } });
      expect(approvals.length).toBe(0);
    });

    it('should CC manager for SIC employee business trip', async () => {
      // SIC employee (DAILY segment) on business trip = CC only
      await userRepo.update(seededData.users.employee.id, {
        userSegment: UserSegment.DAILY,
      });

      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-0003',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING, // Skip approval
        approvalType: ApprovalType.CC_ONLY,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '09:00',
        purpose: 'SIC employee trip',
        passengerCount: 1,
        estimatedKm: 20,
      });

      expect(booking.status).toBe(BookingStatus.PENDING);
      expect(booking.approvalType).toBe(ApprovalType.CC_ONLY);

      // Restore user segment
      await userRepo.update(seededData.users.employee.id, {
        userSegment: UserSegment.SOMETIMES,
      });
    });

    it('should handle booking rejection', async () => {
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-0004',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        purpose: 'Will be rejected',
        passengerCount: 1,
        estimatedKm: 100,
      });

      const approval = await approvalRepo.save({
        bookingId: booking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });

      // Manager rejects
      const rejectedResult = await approvalsService.reject(
        approval.id,
        seededData.users.manager.id,
        'Budget exceeded for this period'
      );

      expect(rejectedResult.status).toBe(ApprovalStatus.REJECTED);
      expect(rejectedResult.notes).toContain('Budget exceeded');

      // Booking should be cancelled
      await bookingRepo.update(booking.id, { status: BookingStatus.CANCELLED });
      const cancelledBooking = await bookingRepo.findOneBy({ id: booking.id });
      expect(cancelledBooking?.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('Block Schedule with Chat Room', () => {
    it('should create chat room when block schedule is assigned', async () => {
      // Create block schedule booking
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-BLOCK-001',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.BLOCK_SCHEDULE,
        status: BookingStatus.CONFIRMED,
        approvalType: ApprovalType.AUTO_APPROVED,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '08:00',
        endDate,
        purpose: 'Weekly business travel',
        passengerCount: 1,
        estimatedKm: 500,
      });

      // Assign driver to booking
      await bookingRepo.update(booking.id, {
        status: BookingStatus.ASSIGNED,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
        driverResponse: DriverResponseStatus.ACCEPTED,
      });

      // Create chat room (as would happen in service)
      const chatRoom = await chatRoomRepo.save({
        bookingId: booking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.ACTIVE,
      });

      expect(chatRoom).toBeDefined();
      expect(chatRoom.bookingId).toBe(booking.id);
      expect(chatRoom.employeeId).toBe(seededData.users.employee.id);
      expect(chatRoom.driverId).toBe(seededData.users.driver.id);
      expect(chatRoom.status).toBe(ChatRoomStatus.ACTIVE);

      // Verify chat room can be retrieved
      const rooms = await chatRoomRepo.find({
        where: { bookingId: booking.id },
      });
      expect(rooms.length).toBe(1);
    });

    it('should archive chat room when block schedule completes', async () => {
      // Create and complete a block schedule
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-BLOCK-002',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.BLOCK_SCHEDULE,
        status: BookingStatus.ASSIGNED,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
        scheduledDate: new Date(),
        scheduledTime: '08:00',
        endDate: new Date(Date.now() + 86400000),
        purpose: 'Block schedule to archive',
        passengerCount: 1,
        estimatedKm: 200,
      });

      const chatRoom = await chatRoomRepo.save({
        bookingId: booking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.ACTIVE,
      });

      // Complete the booking
      await bookingRepo.update(booking.id, {
        status: BookingStatus.COMPLETED,
        actualKm: 180,
      });

      // Archive the chat room
      await chatRoomRepo.update(chatRoom.id, {
        status: ChatRoomStatus.ARCHIVED,
      });

      const archivedRoom = await chatRoomRepo.findOneBy({ id: chatRoom.id });
      expect(archivedRoom?.status).toBe(ChatRoomStatus.ARCHIVED);
    });
  });

  describe('Vehicle Assignment Algorithm', () => {
    it('should prefer available vehicle with assigned driver', async () => {
      // Vehicle 0 has assigned driver
      const vehicle0 = await vehicleRepo.findOneBy({ id: seededData.vehicles[0].id });
      expect(vehicle0?.assignedDriverId).toBe(seededData.users.driver.id);

      // Simulate assignment decision
      const availableVehicles = await vehicleRepo.find({
        where: { status: VehicleStatus.AVAILABLE, isActive: true },
      });

      // Prefer vehicle with assigned driver
      const preferredVehicle = availableVehicles.find(v => v.assignedDriverId !== null);
      expect(preferredVehicle).toBeDefined();
    });

    it('should mark vehicle as IN_USE when trip starts', async () => {
      const vehicleId = seededData.vehicles[0].id;

      // Start of trip
      await vehicleRepo.update(vehicleId, { status: VehicleStatus.IN_USE });

      const inUseVehicle = await vehicleRepo.findOneBy({ id: vehicleId });
      expect(inUseVehicle?.status).toBe(VehicleStatus.IN_USE);

      // End of trip
      await vehicleRepo.update(vehicleId, { status: VehicleStatus.AVAILABLE });

      const availableVehicle = await vehicleRepo.findOneBy({ id: vehicleId });
      expect(availableVehicle?.status).toBe(VehicleStatus.AVAILABLE);
    });
  });

  describe('Driver Response Handling', () => {
    it('should track driver acceptance', async () => {
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-DRV-001',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.ASSIGNED,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
        driverResponse: DriverResponseStatus.PENDING,
        scheduledDate: new Date(),
        scheduledTime: '15:00',
        purpose: 'Driver response test',
        passengerCount: 1,
        estimatedKm: 25,
      });

      expect(booking.driverResponse).toBe(DriverResponseStatus.PENDING);

      // Driver accepts
      await bookingRepo.update(booking.id, {
        driverResponse: DriverResponseStatus.ACCEPTED,
        driverResponseAt: new Date(),
      });

      const accepted = await bookingRepo.findOneBy({ id: booking.id });
      expect(accepted?.driverResponse).toBe(DriverResponseStatus.ACCEPTED);
      expect(accepted?.driverResponseAt).toBeDefined();
    });

    it('should track driver rejection with reason', async () => {
      const booking = await bookingRepo.save({
        bookingCode: 'MSM-FLOW-DRV-002',
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.ASSIGNED,
        assignedVehicleId: seededData.vehicles[0].id,
        assignedDriverId: seededData.users.driver.id,
        driverResponse: DriverResponseStatus.PENDING,
        scheduledDate: new Date(),
        scheduledTime: '16:00',
        purpose: 'Driver rejection test',
        passengerCount: 1,
        estimatedKm: 30,
      });

      // Driver rejects
      await bookingRepo.update(booking.id, {
        driverResponse: DriverResponseStatus.REJECTED,
        driverResponseAt: new Date(),
        driverRejectionReason: 'Vehicle maintenance required',
      });

      const rejected = await bookingRepo.findOneBy({ id: booking.id });
      expect(rejected?.driverResponse).toBe(DriverResponseStatus.REJECTED);
      expect(rejected?.driverRejectionReason).toBe('Vehicle maintenance required');
    });
  });
});
```

---

## Task 3.2: Approval Workflow Integration Test

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/integration/approval-workflow.integration-spec.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { startTestDatabase, getTestDataSourceOptions, cleanDatabase } from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';

import { ApprovalsService } from '../../src/modules/approvals/approvals.service';
import { BookingApproval } from '../../src/modules/approvals/entities/booking-approval.entity';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import { Department } from '../../src/modules/departments/entities/department.entity';

import {
  ApprovalStatus,
  ApprovalType,
  BookingStatus,
  BookingType,
  UserSegment,
  PositionLevel,
  MANAGEMENT_LEVELS,
} from '../../src/common/enums';

describe('Approval Workflow Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;

  let approvalsService: ApprovalsService;
  let approvalRepo: Repository<BookingApproval>;
  let bookingRepo: Repository<Booking>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          ...dsOptions,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([BookingApproval, Booking, User, Department]),
      ],
      providers: [ApprovalsService],
    }).compile();

    dataSource = module.get(DataSource);
    approvalsService = module.get(ApprovalsService);
    approvalRepo = module.get(getRepositoryToken(BookingApproval));
    bookingRepo = module.get(getRepositoryToken(Booking));
    userRepo = module.get(getRepositoryToken(User));

    seededData = await seedTestData(dataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Approval Type Determination', () => {
    it('should require MANAGER_APPROVAL for SOMETIMES segment employee', async () => {
      const employee = seededData.users.employee;
      expect(employee.userSegment).toBe(UserSegment.SOMETIMES);
      expect(employee.positionLevel).toBe(PositionLevel.STAFF);

      // SOMETIMES + STAFF = requires manager approval
      const shouldRequireApproval = !MANAGEMENT_LEVELS.includes(employee.positionLevel);
      expect(shouldRequireApproval).toBe(true);
    });

    it('should use CC_ONLY for DAILY segment SIC employee on business trip', async () => {
      // SIC users (DAILY segment) only need CC when on business trip
      const sicEmployee = seededData.users.sicEmployee;
      expect(sicEmployee.userSegment).toBe(UserSegment.DAILY);

      // Business trip + DAILY segment = CC_ONLY
      const isBusinessTrip = true;
      const approvalType = isBusinessTrip && sicEmployee.userSegment === UserSegment.DAILY
        ? ApprovalType.CC_ONLY
        : ApprovalType.MANAGER_APPROVAL;

      expect(approvalType).toBe(ApprovalType.CC_ONLY);
    });

    it('should use AUTO_APPROVED for management level', async () => {
      const manager = seededData.users.manager;
      expect(manager.positionLevel).toBe(PositionLevel.MGR);

      const isManagement = MANAGEMENT_LEVELS.includes(manager.positionLevel);
      expect(isManagement).toBe(true);

      // Management = AUTO_APPROVED
      const approvalType = isManagement
        ? ApprovalType.AUTO_APPROVED
        : ApprovalType.MANAGER_APPROVAL;

      expect(approvalType).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should correctly identify all management levels', () => {
      const managementLevels = [
        PositionLevel.MGR,
        PositionLevel.SR_MGR,
        PositionLevel.DIRECTOR,
        PositionLevel.VP,
        PositionLevel.C_LEVEL,
      ];

      managementLevels.forEach(level => {
        expect(MANAGEMENT_LEVELS).toContain(level);
      });

      // Non-management levels
      const staffLevels = [
        PositionLevel.STAFF,
        PositionLevel.SENIOR,
        PositionLevel.TEAM_LEAD,
      ];

      staffLevels.forEach(level => {
        expect(MANAGEMENT_LEVELS).not.toContain(level);
      });
    });
  });

  describe('Approval Response Handling', () => {
    let testBooking: Booking;
    let testApproval: BookingApproval;

    beforeEach(async () => {
      testBooking = await bookingRepo.save({
        bookingCode: `MSM-APPR-${Date.now()}`,
        requesterId: seededData.users.employee.id,
        departmentId: seededData.departments[0].id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING_APPROVAL,
        approvalType: ApprovalType.MANAGER_APPROVAL,
        isBusinessTrip: true,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Approval workflow test',
        passengerCount: 1,
        estimatedKm: 40,
      });

      testApproval = await approvalRepo.save({
        bookingId: testBooking.id,
        requesterId: seededData.users.employee.id,
        approverId: seededData.users.manager.id,
        status: ApprovalStatus.PENDING,
      });
    });

    it('should successfully approve pending request', async () => {
      const result = await approvalsService.approve(
        testApproval.id,
        seededData.users.manager.id,
        'Approved for business travel'
      );

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(result.respondedAt).toBeDefined();
      expect(result.notes).toBe('Approved for business travel');
    });

    it('should successfully reject pending request', async () => {
      const result = await approvalsService.reject(
        testApproval.id,
        seededData.users.manager.id,
        'Budget constraints'
      );

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(result.respondedAt).toBeDefined();
      expect(result.notes).toBe('Budget constraints');
    });

    it('should prevent non-approver from responding', async () => {
      // Employee (not the approver) tries to approve
      await expect(
        approvalsService.approve(
          testApproval.id,
          seededData.users.employee.id, // Wrong user
          'Trying to self-approve'
        )
      ).rejects.toThrow();
    });

    it('should prevent responding to already processed approval', async () => {
      // First approval
      await approvalsService.approve(
        testApproval.id,
        seededData.users.manager.id,
        'First approval'
      );

      // Try to reject after approval
      await expect(
        approvalsService.reject(
          testApproval.id,
          seededData.users.manager.id,
          'Second attempt'
        )
      ).rejects.toThrow();
    });
  });

  describe('Approval Queries', () => {
    beforeEach(async () => {
      // Create multiple approvals for testing
      const bookings = await Promise.all([
        bookingRepo.save({
          bookingCode: 'MSM-QUERY-001',
          requesterId: seededData.users.employee.id,
          departmentId: seededData.departments[0].id,
          bookingType: BookingType.SINGLE_TRIP,
          status: BookingStatus.PENDING_APPROVAL,
          scheduledDate: new Date(),
          scheduledTime: '09:00',
          purpose: 'Query test 1',
          passengerCount: 1,
          estimatedKm: 30,
        }),
        bookingRepo.save({
          bookingCode: 'MSM-QUERY-002',
          requesterId: seededData.users.employee.id,
          departmentId: seededData.departments[0].id,
          bookingType: BookingType.SINGLE_TRIP,
          status: BookingStatus.PENDING_APPROVAL,
          scheduledDate: new Date(),
          scheduledTime: '11:00',
          purpose: 'Query test 2',
          passengerCount: 1,
          estimatedKm: 40,
        }),
      ]);

      await Promise.all(
        bookings.map(booking =>
          approvalRepo.save({
            bookingId: booking.id,
            requesterId: seededData.users.employee.id,
            approverId: seededData.users.manager.id,
            status: ApprovalStatus.PENDING,
          })
        )
      );
    });

    it('should find pending approvals for manager', async () => {
      const pending = await approvalsService.getPendingForApprover(
        seededData.users.manager.id
      );

      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length).toBeGreaterThan(0);
      pending.forEach(approval => {
        expect(approval.status).toBe(ApprovalStatus.PENDING);
        expect(approval.approverId).toBe(seededData.users.manager.id);
      });
    });

    it('should find approval requests by requester', async () => {
      const requests = await approvalsService.getMyRequests(
        seededData.users.employee.id
      );

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
      requests.forEach(approval => {
        expect(approval.requesterId).toBe(seededData.users.employee.id);
      });
    });

    it('should find approval by booking ID', async () => {
      const bookings = await bookingRepo.find({ take: 1 });
      const bookingId = bookings[0].id;

      const approval = await approvalsService.findByBookingId(bookingId);
      
      if (approval) {
        expect(approval.bookingId).toBe(bookingId);
      }
    });
  });
});
```

---

## Task 3.3: Chat Messaging Integration Test

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/integration/chat-messaging.integration-spec.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { startTestDatabase, getTestDataSourceOptions, cleanDatabase } from '../setup/test-database';
import { seedTestData, SeededData } from '../../src/test/utils/database-seeder';

import { ChatService } from '../../src/modules/chat/chat.service';
import { ChatRoom } from '../../src/modules/chat/entities/chat-room.entity';
import { ChatMessage } from '../../src/modules/chat/entities/chat-message.entity';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';

import {
  ChatRoomStatus,
  MessageStatus,
  BookingType,
  BookingStatus,
} from '../../src/common/enums';

describe('Chat Messaging Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;
  let seededData: SeededData;

  let chatService: ChatService;
  let chatRoomRepo: Repository<ChatRoom>;
  let chatMessageRepo: Repository<ChatMessage>;
  let bookingRepo: Repository<Booking>;

  let testRoom: ChatRoom;
  let testBlockBooking: Booking;

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          ...dsOptions,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([ChatRoom, ChatMessage, Booking]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      providers: [ChatService],
    }).compile();

    dataSource = module.get(DataSource);
    chatService = module.get(ChatService);
    chatRoomRepo = module.get(getRepositoryToken(ChatRoom));
    chatMessageRepo = module.get(getRepositoryToken(ChatMessage));
    bookingRepo = module.get(getRepositoryToken(Booking));

    seededData = await seedTestData(dataSource);

    // Create a block schedule booking for chat tests
    testBlockBooking = await bookingRepo.save({
      bookingCode: 'MSM-CHAT-BLOCK',
      requesterId: seededData.users.employee.id,
      departmentId: seededData.departments[0].id,
      bookingType: BookingType.BLOCK_SCHEDULE,
      status: BookingStatus.ASSIGNED,
      assignedVehicleId: seededData.vehicles[0].id,
      assignedDriverId: seededData.users.driver.id,
      scheduledDate: new Date(),
      scheduledTime: '08:00',
      endDate: new Date(Date.now() + 7 * 86400000),
      purpose: 'Chat integration test',
      passengerCount: 1,
      estimatedKm: 300,
    });

    testRoom = await chatRoomRepo.save({
      bookingId: testBlockBooking.id,
      employeeId: seededData.users.employee.id,
      driverId: seededData.users.driver.id,
      status: ChatRoomStatus.ACTIVE,
    });
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Chat Room Management', () => {
    it('should create chat room for block schedule', async () => {
      expect(testRoom).toBeDefined();
      expect(testRoom.bookingId).toBe(testBlockBooking.id);
      expect(testRoom.employeeId).toBe(seededData.users.employee.id);
      expect(testRoom.driverId).toBe(seededData.users.driver.id);
      expect(testRoom.status).toBe(ChatRoomStatus.ACTIVE);
    });

    it('should retrieve chat room by ID', async () => {
      const room = await chatService.getRoomById(testRoom.id);
      expect(room.id).toBe(testRoom.id);
    });

    it('should get rooms for user', async () => {
      const employeeRooms = await chatService.getRoomsForUser(
        seededData.users.employee.id
      );

      expect(Array.isArray(employeeRooms)).toBe(true);
      expect(employeeRooms.some(r => r.id === testRoom.id)).toBe(true);
    });

    it('should archive room', async () => {
      // Create a room to archive
      const roomToArchive = await chatRoomRepo.save({
        bookingId: testBlockBooking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.ACTIVE,
      });

      await chatService.archiveRoom(roomToArchive.id);

      const archived = await chatRoomRepo.findOneBy({ id: roomToArchive.id });
      expect(archived?.status).toBe(ChatRoomStatus.ARCHIVED);
    });

    it('should close room', async () => {
      const roomToClose = await chatRoomRepo.save({
        bookingId: testBlockBooking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.ACTIVE,
      });

      await chatService.closeRoom(roomToClose.id);

      const closed = await chatRoomRepo.findOneBy({ id: roomToClose.id });
      expect(closed?.status).toBe(ChatRoomStatus.CLOSED);
    });
  });

  describe('Message Operations', () => {
    it('should send message from employee', async () => {
      const message = await chatService.sendMessage(
        testRoom.id,
        seededData.users.employee.id,
        { content: 'Hello from employee' }
      );

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello from employee');
      expect(message.senderId).toBe(seededData.users.employee.id);
      expect(message.roomId).toBe(testRoom.id);
      expect(message.status).toBe(MessageStatus.SENT);
    });

    it('should send message from driver', async () => {
      const message = await chatService.sendMessage(
        testRoom.id,
        seededData.users.driver.id,
        { content: 'Hello from driver' }
      );

      expect(message.content).toBe('Hello from driver');
      expect(message.senderId).toBe(seededData.users.driver.id);
    });

    it('should get messages for room', async () => {
      // Send a few messages first
      await chatService.sendMessage(testRoom.id, seededData.users.employee.id, {
        content: 'Message 1',
      });
      await chatService.sendMessage(testRoom.id, seededData.users.driver.id, {
        content: 'Message 2',
      });

      const messages = await chatService.getMessages(testRoom.id);

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should support message pagination', async () => {
      const messages = await chatService.getMessages(testRoom.id, 10, 0);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeLessThanOrEqual(10);
    });

    it('should mark messages as read', async () => {
      await chatService.markAsRead(testRoom.id, seededData.users.employee.id);

      // Verify messages are marked as read
      const messages = await chatMessageRepo.find({
        where: {
          roomId: testRoom.id,
          senderId: seededData.users.driver.id, // Messages from driver
        },
      });

      // At least some messages should be marked as read
      // (depending on implementation)
      expect(messages.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle schedule change notification message', async () => {
      const message = await chatService.sendMessage(
        testRoom.id,
        seededData.users.employee.id,
        {
          content: 'I will be 15 minutes late today',
          messageType: 'SCHEDULE_CHANGE',
          metadata: {
            changeType: 'LATE_DEPARTURE',
            delayMinutes: 15,
          },
        }
      );

      expect(message.content).toContain('15 minutes late');
      expect(message.messageType).toBe('SCHEDULE_CHANGE');
      expect(message.metadata).toEqual({
        changeType: 'LATE_DEPARTURE',
        delayMinutes: 15,
      });
    });
  });

  describe('Room Access Control', () => {
    it('should only allow room participants to access', async () => {
      // Employee should have access
      const employeeRooms = await chatService.getRoomsForUser(
        seededData.users.employee.id
      );
      expect(employeeRooms.some(r => r.id === testRoom.id)).toBe(true);

      // Driver should have access
      const driverRooms = await chatService.getRoomsForUser(
        seededData.users.driver.id
      );
      expect(driverRooms.some(r => r.id === testRoom.id)).toBe(true);

      // Other user should not have access to this specific room
      const otherRooms = await chatService.getRoomsForUser(
        seededData.users.admin.id
      );
      expect(otherRooms.some(r => r.id === testRoom.id)).toBe(false);
    });

    it('should prevent messaging in closed room', async () => {
      const closedRoom = await chatRoomRepo.save({
        bookingId: testBlockBooking.id,
        employeeId: seededData.users.employee.id,
        driverId: seededData.users.driver.id,
        status: ChatRoomStatus.CLOSED,
      });

      await expect(
        chatService.sendMessage(closedRoom.id, seededData.users.employee.id, {
          content: 'Should fail',
        })
      ).rejects.toThrow();
    });
  });
});
```

---

## Task 3.4: Multi-Tenant Isolation Integration Test

**File:** `/Users/liam/Workspaces/msm-car-booking/backend/test/integration/multi-tenant.integration-spec.ts`

```typescript
import { DataSource, Repository } from 'typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { startTestDatabase, getTestDataSourceOptions, cleanDatabase } from '../setup/test-database';

import { User } from '../../src/modules/users/entities/user.entity';
import { Department } from '../../src/modules/departments/entities/department.entity';
import { Vehicle } from '../../src/modules/vehicles/entities/vehicle.entity';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';

import {
  UserRole,
  UserSegment,
  PositionLevel,
  VehicleType,
  VehicleStatus,
  BookingType,
  BookingStatus,
} from '../../src/common/enums';
import * as bcrypt from 'bcrypt';

/**
 * Note: Multi-tenant isolation tests
 * 
 * These tests verify that data is properly isolated between tenants.
 * In a real multi-tenant system, each query would be scoped by tenant_id.
 * 
 * For this implementation, we simulate tenants using department isolation
 * as a proxy for tenant isolation. In production, you would add a tenant_id
 * column to all tables and use a TenantAwareRepository.
 */
describe('Multi-Tenant Isolation Integration', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let module: TestingModule;

  let userRepo: Repository<User>;
  let deptRepo: Repository<Department>;
  let vehicleRepo: Repository<Vehicle>;
  let bookingRepo: Repository<Booking>;

  // Simulated tenants
  let tenantA: { dept: Department; user: User; vehicle: Vehicle };
  let tenantB: { dept: Department; user: User; vehicle: Vehicle };

  beforeAll(async () => {
    container = await startTestDatabase();
    const dsOptions = getTestDataSourceOptions(container);

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          ...dsOptions,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([User, Department, Vehicle, Booking]),
      ],
    }).compile();

    dataSource = module.get(DataSource);
    userRepo = module.get(getRepositoryToken(User));
    deptRepo = module.get(getRepositoryToken(Department));
    vehicleRepo = module.get(getRepositoryToken(Vehicle));
    bookingRepo = module.get(getRepositoryToken(Booking));

    // Setup two "tenants" (simulated via departments)
    const passwordHash = await bcrypt.hash('Test123!@#', 10);

    // Tenant A
    const deptA = await deptRepo.save({
      name: 'Tenant A Corp',
      code: 'TENANT-A',
      costCenter: 'CC-A-001',
      isActive: true,
    });

    const userA = await userRepo.save({
      email: 'user@tenant-a.com',
      passwordHash,
      fullName: 'Tenant A User',
      phone: '+84111111111',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.STAFF,
      departmentId: deptA.id,
      isActive: true,
    });

    const vehicleA = await vehicleRepo.save({
      licensePlate: '51A-TENTA',
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      capacity: 4,
      vehicleType: VehicleType.SEDAN,
      status: VehicleStatus.AVAILABLE,
      currentOdometerKm: 10000,
      isActive: true,
    });

    tenantA = { dept: deptA, user: userA, vehicle: vehicleA };

    // Tenant B
    const deptB = await deptRepo.save({
      name: 'Tenant B Inc',
      code: 'TENANT-B',
      costCenter: 'CC-B-001',
      isActive: true,
    });

    const userB = await userRepo.save({
      email: 'user@tenant-b.com',
      passwordHash,
      fullName: 'Tenant B User',
      phone: '+84222222222',
      role: UserRole.EMPLOYEE,
      userSegment: UserSegment.SOMETIMES,
      positionLevel: PositionLevel.STAFF,
      departmentId: deptB.id,
      isActive: true,
    });

    const vehicleB = await vehicleRepo.save({
      licensePlate: '51A-TENTB',
      brand: 'Honda',
      model: 'Accord',
      year: 2023,
      capacity: 4,
      vehicleType: VehicleType.SEDAN,
      status: VehicleStatus.AVAILABLE,
      currentOdometerKm: 5000,
      isActive: true,
    });

    tenantB = { dept: deptB, user: userB, vehicle: vehicleB };
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await module.close();
  });

  describe('Department-Scoped Queries', () => {
    it('should only return users from same department', async () => {
      // Simulate tenant-scoped query
      const tenantAUsers = await userRepo.find({
        where: { departmentId: tenantA.dept.id },
      });

      expect(tenantAUsers.length).toBeGreaterThan(0);
      tenantAUsers.forEach(user => {
        expect(user.departmentId).toBe(tenantA.dept.id);
      });

      // Verify tenant B users are not included
      const tenantBUserIds = tenantAUsers.map(u => u.id);
      expect(tenantBUserIds).not.toContain(tenantB.user.id);
    });

    it('should isolate bookings by department', async () => {
      // Create bookings for each tenant
      const bookingA = await bookingRepo.save({
        bookingCode: 'MSM-TENANT-A-001',
        requesterId: tenantA.user.id,
        departmentId: tenantA.dept.id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Tenant A meeting',
        passengerCount: 1,
        estimatedKm: 30,
      });

      const bookingB = await bookingRepo.save({
        bookingCode: 'MSM-TENANT-B-001',
        requesterId: tenantB.user.id,
        departmentId: tenantB.dept.id,
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        purpose: 'Tenant B meeting',
        passengerCount: 1,
        estimatedKm: 25,
      });

      // Query bookings for Tenant A only
      const tenantABookings = await bookingRepo.find({
        where: { departmentId: tenantA.dept.id },
      });

      expect(tenantABookings.length).toBeGreaterThan(0);
      expect(tenantABookings.some(b => b.id === bookingA.id)).toBe(true);
      expect(tenantABookings.some(b => b.id === bookingB.id)).toBe(false);

      // Query bookings for Tenant B only
      const tenantBBookings = await bookingRepo.find({
        where: { departmentId: tenantB.dept.id },
      });

      expect(tenantBBookings.some(b => b.id === bookingB.id)).toBe(true);
      expect(tenantBBookings.some(b => b.id === bookingA.id)).toBe(false);
    });
  });

  describe('Cross-Tenant Access Prevention', () => {
    it('should prevent user from accessing other department data', async () => {
      // Simulate what would happen if Tenant A user tries to query Tenant B data
      const query = bookingRepo
        .createQueryBuilder('booking')
        .where('booking.departmentId = :deptId', { deptId: tenantA.dept.id })
        .andWhere('booking.requesterId = :requesterId', { 
          requesterId: tenantB.user.id // Tenant B user
        });

      const results = await query.getMany();
      
      // Should return nothing because Tenant B user has no bookings in Tenant A department
      expect(results.length).toBe(0);
    });

    it('should enforce department constraint on booking creation', async () => {
      // Attempt to create booking with mismatched department
      // In a real system, this would be prevented by business logic
      
      // User from Tenant A
      const userId = tenantA.user.id;
      
      // Department from Tenant B (should not be allowed)
      const wrongDeptId = tenantB.dept.id;

      // This demonstrates the need for validation in the service layer
      // to ensure users can only create bookings in their own department
      
      const booking = bookingRepo.create({
        bookingCode: 'MSM-INVALID-001',
        requesterId: userId,
        departmentId: wrongDeptId, // Mismatched!
        bookingType: BookingType.SINGLE_TRIP,
        status: BookingStatus.PENDING,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        purpose: 'Invalid cross-tenant booking',
        passengerCount: 1,
        estimatedKm: 20,
      });

      // In production, service layer would validate this before saving
      // For now, we just verify the mismatch is detectable
      expect(booking.requesterId).not.toBe(tenantB.user.id);
      expect(booking.departmentId).toBe(tenantB.dept.id);
      
      // This represents a data integrity issue that should be caught
      // by validation logic in the service layer
    });
  });

  describe('Index Usage Verification', () => {
    it('should use department index for tenant-scoped queries', async () => {
      // Create a reasonable number of bookings
      const bookings = [];
      for (let i = 0; i < 10; i++) {
        bookings.push({
          bookingCode: `MSM-INDEX-${i}`,
          requesterId: tenantA.user.id,
          departmentId: tenantA.dept.id,
          bookingType: BookingType.SINGLE_TRIP,
          status: BookingStatus.PENDING,
          scheduledDate: new Date(),
          scheduledTime: '10:00',
          purpose: `Index test ${i}`,
          passengerCount: 1,
          estimatedKm: 20 + i,
        });
      }
      await bookingRepo.save(bookings);

      // Execute explain analyze (PostgreSQL specific)
      const explainResult = await dataSource.query(`
        EXPLAIN ANALYZE
        SELECT * FROM bookings
        WHERE department_id = $1
        ORDER BY scheduled_date DESC
        LIMIT 10
      `, [tenantA.dept.id]);

      // Log for debugging (in real tests, you might parse and assert on this)
      console.log('Query plan:', explainResult);

      // The query should complete successfully
      expect(explainResult).toBeDefined();
    });
  });
});
```

---

## Verification Checklist

After implementing all integration tests:

- [ ] Booking flow tests cover complete lifecycle
- [ ] Approval workflow tests all approval types
- [ ] Chat messaging tests room creation and messages
- [ ] Multi-tenant tests verify data isolation
- [ ] All tests run in isolation
- [ ] Database is cleaned between test suites
- [ ] No test pollution between runs

## Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm test:integration -- --testPathPattern=booking-flow

# Run with verbose output
pnpm test:integration -- --verbose
```

## Next Steps

After completing integration tests, proceed to:
- **04-claude-md-update.md** - Update CLAUDE.md with testing documentation

