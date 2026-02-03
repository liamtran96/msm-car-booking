import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalStatus, UserRole } from '../../common/enums';
import { generateUuid } from '../../test/utils/test-helper';
import { RespondApprovalDto } from './dto/respond-approval.dto';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;

  // Service spies
  let getPendingForApproverSpy: jest.Mock;
  let getMyRequestsSpy: jest.Mock;
  let findByIdSpy: jest.Mock;
  let findByBookingIdSpy: jest.Mock;
  let approveSpy: jest.Mock;
  let rejectSpy: jest.Mock;

  const userId = generateUuid();
  const mockUser = { user: { id: userId, role: UserRole.EMPLOYEE } };

  beforeEach(async () => {
    getPendingForApproverSpy = jest.fn();
    getMyRequestsSpy = jest.fn();
    findByIdSpy = jest.fn();
    findByBookingIdSpy = jest.fn();
    approveSpy = jest.fn();
    rejectSpy = jest.fn();

    const mockApprovalsService = {
      getPendingForApprover: getPendingForApproverSpy,
      getMyRequests: getMyRequestsSpy,
      findById: findByIdSpy,
      findByBookingId: findByBookingIdSpy,
      approve: approveSpy,
      reject: rejectSpy,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [
        {
          provide: ApprovalsService,
          useValue: mockApprovalsService,
        },
      ],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for current user', async () => {
      const mockApprovals = [
        { id: generateUuid(), status: ApprovalStatus.PENDING },
      ];
      getPendingForApproverSpy.mockResolvedValue(mockApprovals);

      const result = await controller.getPendingApprovals(mockUser);

      expect(result).toEqual(mockApprovals);
      expect(getPendingForApproverSpy).toHaveBeenCalledWith(mockUser.user.id);
    });
  });

  describe('getMyRequests', () => {
    it('should return approval requests created by current user', async () => {
      const mockRequests = [
        { id: generateUuid(), requesterId: mockUser.user.id },
      ];
      getMyRequestsSpy.mockResolvedValue(mockRequests);

      const result = await controller.getMyRequests(mockUser);

      expect(result).toEqual(mockRequests);
      expect(getMyRequestsSpy).toHaveBeenCalledWith(mockUser.user.id);
    });
  });

  describe('findOne', () => {
    it('should return approval by ID when user is requester', async () => {
      const approvalId = generateUuid();
      const mockApproval = {
        id: approvalId,
        status: ApprovalStatus.PENDING,
        requesterId: userId,
        approverId: generateUuid(),
      };
      findByIdSpy.mockResolvedValue(mockApproval);

      const result = await controller.findOne(approvalId, mockUser);

      expect(result).toEqual(mockApproval);
      expect(findByIdSpy).toHaveBeenCalledWith(approvalId);
    });

    it('should return approval by ID when user is approver', async () => {
      const approvalId = generateUuid();
      const mockApproval = {
        id: approvalId,
        status: ApprovalStatus.PENDING,
        requesterId: generateUuid(),
        approverId: userId,
      };
      findByIdSpy.mockResolvedValue(mockApproval);

      const result = await controller.findOne(approvalId, mockUser);

      expect(result).toEqual(mockApproval);
    });

    it('should return approval by ID when user is admin', async () => {
      const approvalId = generateUuid();
      const mockApproval = {
        id: approvalId,
        status: ApprovalStatus.PENDING,
        requesterId: generateUuid(),
        approverId: generateUuid(),
      };
      findByIdSpy.mockResolvedValue(mockApproval);
      const adminUser = { user: { id: generateUuid(), role: UserRole.ADMIN } };

      const result = await controller.findOne(approvalId, adminUser);

      expect(result).toEqual(mockApproval);
    });
  });

  describe('findByBooking', () => {
    it('should return approval by booking ID when user is requester', async () => {
      const bookingId = generateUuid();
      const mockApproval = {
        id: generateUuid(),
        bookingId,
        requesterId: userId,
        approverId: generateUuid(),
      };
      findByBookingIdSpy.mockResolvedValue(mockApproval);

      const result = await controller.findByBooking(bookingId, mockUser);

      expect(result).toEqual(mockApproval);
      expect(findByBookingIdSpy).toHaveBeenCalledWith(bookingId);
    });

    it('should return null when approval not found', async () => {
      const bookingId = generateUuid();
      findByBookingIdSpy.mockResolvedValue(null);

      const result = await controller.findByBooking(bookingId, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('respond', () => {
    it('should approve when decision is APPROVED', async () => {
      const approvalId = generateUuid();
      const dto: RespondApprovalDto = {
        decision: ApprovalStatus.APPROVED,
        notes: 'Looks good',
      };
      const mockResult = { id: approvalId, status: ApprovalStatus.APPROVED };
      approveSpy.mockResolvedValue(mockResult);

      const result = await controller.respond(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(approveSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        dto.notes,
      );
      expect(rejectSpy).not.toHaveBeenCalled();
    });

    it('should reject when decision is REJECTED', async () => {
      const approvalId = generateUuid();
      const dto: RespondApprovalDto = {
        decision: ApprovalStatus.REJECTED,
        notes: 'Not approved',
      };
      const mockResult = { id: approvalId, status: ApprovalStatus.REJECTED };
      rejectSpy.mockResolvedValue(mockResult);

      const result = await controller.respond(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(rejectSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        dto.notes,
      );
      expect(approveSpy).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve an approval request', async () => {
      const approvalId = generateUuid();
      const dto = { notes: 'Approved' };
      const mockResult = { id: approvalId, status: ApprovalStatus.APPROVED };
      approveSpy.mockResolvedValue(mockResult);

      const result = await controller.approve(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(approveSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        dto.notes,
      );
    });

    it('should approve without notes', async () => {
      const approvalId = generateUuid();
      const dto = {};
      const mockResult = { id: approvalId, status: ApprovalStatus.APPROVED };
      approveSpy.mockResolvedValue(mockResult);

      const result = await controller.approve(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(approveSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        undefined,
      );
    });
  });

  describe('reject', () => {
    it('should reject an approval request', async () => {
      const approvalId = generateUuid();
      const dto = { notes: 'Budget exceeded' };
      const mockResult = { id: approvalId, status: ApprovalStatus.REJECTED };
      rejectSpy.mockResolvedValue(mockResult);

      const result = await controller.reject(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(rejectSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        dto.notes,
      );
    });

    it('should reject without notes', async () => {
      const approvalId = generateUuid();
      const dto = {};
      const mockResult = { id: approvalId, status: ApprovalStatus.REJECTED };
      rejectSpy.mockResolvedValue(mockResult);

      const result = await controller.reject(approvalId, dto, mockUser);

      expect(result).toEqual(mockResult);
      expect(rejectSpy).toHaveBeenCalledWith(
        approvalId,
        mockUser.user.id,
        undefined,
      );
    });
  });
});
