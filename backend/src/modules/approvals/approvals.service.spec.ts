import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { BookingApproval } from './entities/booking-approval.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import {
  ApprovalStatus,
  ApprovalType,
  BookingStatus,
  UserSegment,
  PositionLevel,
} from '../../common/enums';
import { createMockUser } from '../../test/factories/user.factory';
import { createMockBooking } from '../../test/factories/booking.factory';
import { createMockRepository } from '../../test/mocks/repository.mock';
import { generateUuid } from '../../test/utils/test-helper';
import { NotificationsService } from '../notifications/notifications.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  // Approval repository spies
  let approvalFindSpy: jest.Mock;
  let approvalFindOneSpy: jest.Mock;
  let approvalCreateSpy: jest.Mock;
  let approvalSaveSpy: jest.Mock;
  let approvalUpdateSpy: jest.Mock;
  let approvalQueryBuilderSpy: jest.Mock;

  // Booking repository spies
  let bookingUpdateSpy: jest.Mock;

  // User repository spies
  let userFindOneSpy: jest.Mock;

  // Notifications service spy
  let notificationsCreateSpy: jest.Mock;

  // Mock query builder
  let mockQueryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    // Setup spies
    approvalFindSpy = jest.fn();
    approvalFindOneSpy = jest.fn();
    approvalCreateSpy = jest.fn(
      <T extends Record<string, unknown>>(entity: T): T => entity,
    );
    approvalSaveSpy = jest.fn(<T extends Record<string, unknown>>(entity: T) =>
      Promise.resolve({ id: generateUuid(), ...entity }),
    );
    approvalUpdateSpy = jest.fn();

    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };
    approvalQueryBuilderSpy = jest.fn().mockReturnValue(mockQueryBuilder);

    bookingUpdateSpy = jest.fn();
    userFindOneSpy = jest.fn();
    notificationsCreateSpy = jest
      .fn()
      .mockResolvedValue({ id: generateUuid() });

    const mockApprovalRepository = {
      ...createMockRepository<BookingApproval>(),
      find: approvalFindSpy,
      findOne: approvalFindOneSpy,
      create: approvalCreateSpy,
      save: approvalSaveSpy,
      update: approvalUpdateSpy,
      createQueryBuilder: approvalQueryBuilderSpy,
    };

    const mockBookingRepository = {
      ...createMockRepository<Booking>(),
      update: bookingUpdateSpy,
    };

    const mockUserRepository = {
      ...createMockRepository<User>(),
      findOne: userFindOneSpy,
    };

    const mockNotificationsService = {
      create: notificationsCreateSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        {
          provide: getRepositoryToken(BookingApproval),
          useValue: mockApprovalRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determineApprovalType', () => {
    it('should return AUTO_APPROVED for management level users (MGR)', () => {
      const manager = createMockUser({ positionLevel: PositionLevel.MGR });

      const result = service.determineApprovalType(manager, true);

      expect(result).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should return AUTO_APPROVED for senior management (DIRECTOR)', () => {
      const director = createMockUser({
        positionLevel: PositionLevel.DIRECTOR,
      });

      const result = service.determineApprovalType(director, false);

      expect(result).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should return AUTO_APPROVED for C-level users', () => {
      const cLevel = createMockUser({ positionLevel: PositionLevel.C_LEVEL });

      const result = service.determineApprovalType(cLevel, true);

      expect(result).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should return CC_ONLY for DAILY segment users on business trips', () => {
      const sicUser = createMockUser({
        userSegment: UserSegment.DAILY,
        positionLevel: PositionLevel.STAFF,
      });

      const result = service.determineApprovalType(sicUser, true);

      expect(result).toBe(ApprovalType.CC_ONLY);
    });

    it('should return MANAGER_APPROVAL for DAILY segment users on non-business trips', () => {
      const sicUser = createMockUser({
        userSegment: UserSegment.DAILY,
        positionLevel: PositionLevel.STAFF,
      });

      const result = service.determineApprovalType(sicUser, false);

      expect(result).toBe(ApprovalType.MANAGER_APPROVAL);
    });

    it('should return MANAGER_APPROVAL for SOMETIMES segment users', () => {
      const regularUser = createMockUser({
        userSegment: UserSegment.SOMETIMES,
        positionLevel: PositionLevel.STAFF,
      });

      const result = service.determineApprovalType(regularUser, true);

      expect(result).toBe(ApprovalType.MANAGER_APPROVAL);
    });

    it('should return MANAGER_APPROVAL for SENIOR level non-management users', () => {
      const seniorUser = createMockUser({
        userSegment: UserSegment.SOMETIMES,
        positionLevel: PositionLevel.SENIOR,
      });

      const result = service.determineApprovalType(seniorUser, true);

      expect(result).toBe(ApprovalType.MANAGER_APPROVAL);
    });
  });

  describe('createApproval', () => {
    it('should return null for AUTO_APPROVED type', async () => {
      const booking = createMockBooking();
      const requester = createMockUser({ positionLevel: PositionLevel.MGR });

      const result = await service.createApproval(
        booking,
        requester,
        ApprovalType.AUTO_APPROVED,
      );

      expect(result).toBeNull();
      expect(approvalCreateSpy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user has no manager', async () => {
      const booking = createMockBooking();
      const requester = createMockUser({ managerId: undefined });
      // Override the managerId to be undefined
      (requester as { managerId: string | undefined }).managerId = undefined;

      await expect(
        service.createApproval(
          booking,
          requester,
          ApprovalType.MANAGER_APPROVAL,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create approval with PENDING status for MANAGER_APPROVAL type', async () => {
      const booking = createMockBooking();
      const managerId = generateUuid();
      const requester = createMockUser({ managerId });

      await service.createApproval(
        booking,
        requester,
        ApprovalType.MANAGER_APPROVAL,
      );

      expect(approvalCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: booking.id,
          approverId: managerId,
          requesterId: requester.id,
          approvalType: ApprovalType.MANAGER_APPROVAL,
          status: ApprovalStatus.PENDING,
        }),
      );
      expect(approvalSaveSpy).toHaveBeenCalled();
    });

    it('should create approval with AUTO_APPROVED status for CC_ONLY type', async () => {
      const booking = createMockBooking();
      const managerId = generateUuid();
      const requester = createMockUser({ managerId });

      await service.createApproval(booking, requester, ApprovalType.CC_ONLY);

      expect(approvalCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          approvalType: ApprovalType.CC_ONLY,
          status: ApprovalStatus.AUTO_APPROVED,
          expiresAt: null,
        }),
      );
    });

    it('should set expiry time for MANAGER_APPROVAL type', async () => {
      const booking = createMockBooking();
      const managerId = generateUuid();
      const requester = createMockUser({ managerId });

      await service.createApproval(
        booking,
        requester,
        ApprovalType.MANAGER_APPROVAL,
      );

      expect(approvalCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getPendingForApprover', () => {
    it('should return pending approvals for an approver', async () => {
      const approverId = generateUuid();
      const mockApprovals = [
        { id: generateUuid(), approverId, status: ApprovalStatus.PENDING },
        { id: generateUuid(), approverId, status: ApprovalStatus.PENDING },
      ];
      approvalFindSpy.mockResolvedValue(mockApprovals);

      const result = await service.getPendingForApprover(approverId);

      expect(result).toHaveLength(2);
      expect(approvalFindSpy).toHaveBeenCalledWith({
        where: { approverId, status: ApprovalStatus.PENDING },
        relations: ['booking', 'requester', 'booking.department'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when no pending approvals', async () => {
      const approverId = generateUuid();
      approvalFindSpy.mockResolvedValue([]);

      const result = await service.getPendingForApprover(approverId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getMyRequests', () => {
    it('should return approval requests for a user', async () => {
      const requesterId = generateUuid();
      const mockApprovals = [
        { id: generateUuid(), requesterId },
        { id: generateUuid(), requesterId },
      ];
      approvalFindSpy.mockResolvedValue(mockApprovals);

      const result = await service.getMyRequests(requesterId);

      expect(result).toHaveLength(2);
      expect(approvalFindSpy).toHaveBeenCalledWith({
        where: { requesterId },
        relations: ['booking', 'approver'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return approval by ID', async () => {
      const approvalId = generateUuid();
      const mockApproval = { id: approvalId, status: ApprovalStatus.PENDING };
      approvalFindOneSpy.mockResolvedValue(mockApproval);

      const result = await service.findById(approvalId);

      expect(result.id).toBe(approvalId);
      expect(approvalFindOneSpy).toHaveBeenCalledWith({
        where: { id: approvalId },
        relations: ['booking', 'approver', 'requester', 'booking.department'],
      });
    });

    it('should throw NotFoundException for non-existent approval', async () => {
      const nonExistentId = generateUuid();
      approvalFindOneSpy.mockResolvedValue(null);

      await expect(service.findById(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve a pending approval', async () => {
      const approvalId = generateUuid();
      const approverId = generateUuid();
      const bookingId = generateUuid();
      const mockApproval = {
        id: approvalId,
        approverId,
        bookingId,
        status: ApprovalStatus.PENDING,
        notes: null,
        respondedAt: null,
      };
      approvalFindOneSpy.mockResolvedValue(mockApproval);
      approvalSaveSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
      });

      const result = await service.approve(approvalId, approverId, 'Approved');

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(bookingUpdateSpy).toHaveBeenCalledWith(bookingId, {
        status: BookingStatus.PENDING,
      });
    });

    it('should throw ForbiddenException if user is not the approver', async () => {
      const approvalId = generateUuid();
      const approverId = generateUuid();
      const wrongApproverId = generateUuid();
      const mockApproval = {
        id: approvalId,
        approverId,
        status: ApprovalStatus.PENDING,
      };
      approvalFindOneSpy.mockResolvedValue(mockApproval);

      await expect(
        service.approve(approvalId, wrongApproverId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if approval already processed', async () => {
      const approvalId = generateUuid();
      const approverId = generateUuid();
      const mockApproval = {
        id: approvalId,
        approverId,
        status: ApprovalStatus.APPROVED,
      };
      approvalFindOneSpy.mockResolvedValue(mockApproval);

      await expect(service.approve(approvalId, approverId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending approval', async () => {
      const approvalId = generateUuid();
      const approverId = generateUuid();
      const bookingId = generateUuid();
      const mockApproval = {
        id: approvalId,
        approverId,
        bookingId,
        status: ApprovalStatus.PENDING,
        notes: null,
        respondedAt: null,
      };
      approvalFindOneSpy.mockResolvedValue(mockApproval);
      approvalSaveSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
      });

      const result = await service.reject(
        approvalId,
        approverId,
        'Not approved',
      );

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(bookingUpdateSpy).toHaveBeenCalledWith(bookingId, {
        status: BookingStatus.CANCELLED,
      });
    });

    it('should throw ForbiddenException if user is not the approver', async () => {
      const approvalId = generateUuid();
      const approverId = generateUuid();
      const wrongApproverId = generateUuid();
      const mockApproval = {
        id: approvalId,
        approverId,
        status: ApprovalStatus.PENDING,
      };
      approvalFindOneSpy.mockResolvedValue(mockApproval);

      await expect(service.reject(approvalId, wrongApproverId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getExpiredApprovals', () => {
    it('should return expired approvals', async () => {
      const mockExpiredApprovals = [
        { id: generateUuid(), status: ApprovalStatus.PENDING },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockExpiredApprovals);

      const result = await service.getExpiredApprovals();

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'approval.status = :status',
        { status: ApprovalStatus.PENDING },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'approval.expires_at < :now',
        expect.any(Object),
      );
    });
  });

  describe('markAsExpired', () => {
    it('should mark approval as expired', async () => {
      const approvalId = generateUuid();

      await service.markAsExpired(approvalId);

      expect(approvalUpdateSpy).toHaveBeenCalledWith(approvalId, {
        status: ApprovalStatus.EXPIRED,
      });
    });
  });

  describe('getApprovalsNeedingReminder', () => {
    it('should return approvals needing reminder', async () => {
      const mockApprovals = [{ id: generateUuid(), reminderCount: 0 }];
      mockQueryBuilder.getMany.mockResolvedValue(mockApprovals);

      const result = await service.getApprovalsNeedingReminder();

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'approval.status = :status',
        { status: ApprovalStatus.PENDING },
      );
    });
  });

  describe('incrementReminderCount', () => {
    it('should increment reminder count', async () => {
      const approvalId = generateUuid();

      await service.incrementReminderCount(approvalId);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        reminderCount: expect.any(Function),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        lastReminderAt: expect.any(Date),
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: approvalId,
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
