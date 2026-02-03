# Testing Strategy

**Document ID:** PLAN-20260202-001-TEST
**Related To:** 00-overview.md, 01-database.md, 02-backend.md
**Status:** Draft

---

## Table of Contents

1. [Test Overview](#1-test-overview)
2. [Unit Tests](#2-unit-tests)
3. [Integration Tests](#3-integration-tests)
4. [E2E Tests](#4-e2e-tests)
5. [Test Data Factories](#5-test-data-factories)

---

## 1. Test Overview

### 1.1 Test Coverage Goals

| Module | Service Coverage | Controller Coverage | Total |
|--------|-----------------|---------------------|-------|
| Approvals | 90%+ | 100% endpoints | 90%+ |
| Chat | 90%+ | 100% endpoints | 90%+ |
| Chat Gateway | 80%+ | N/A | 80%+ |

### 1.2 Test Types

| Type | Purpose | Tools |
|------|---------|-------|
| Unit Tests | Test individual functions and methods | Jest |
| Integration Tests | Test module interactions | Jest + TypeORM |
| E2E Tests | Test full API flows | Jest + Supertest |
| WebSocket Tests | Test real-time communication | Socket.io-client |

---

## 2. Unit Tests

### 2.1 Approvals Service Tests

File: `/backend/src/modules/approvals/approvals.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApprovalsService } from './approvals.service';
import { BookingApproval } from './entities/booking-approval.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApprovalStatus,
  ApprovalType,
  BookingStatus,
  UserSegment,
  PositionLevel,
} from '../../common/enums';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let approvalRepositorySaveSpy: jest.Mock;
  let approvalRepositoryFindOneSpy: jest.Mock;
  let approvalRepositoryFindSpy: jest.Mock;
  let bookingRepositoryUpdateSpy: jest.Mock;
  let bookingRepositoryFindOneSpy: jest.Mock;
  let notificationsServiceCreateSpy: jest.Mock;

  const mockUser = {
    id: 'user-1',
    email: 'employee@company.com',
    fullName: 'Test Employee',
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    managerId: 'manager-1',
  };

  const mockManager = {
    id: 'manager-1',
    email: 'manager@company.com',
    fullName: 'Test Manager',
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.MGR,
    managerId: null,
  };

  const mockSicUser = {
    id: 'sic-user-1',
    email: 'sic@company.com',
    fullName: 'SIC Employee',
    userSegment: UserSegment.DAILY,
    positionLevel: PositionLevel.STAFF,
    managerId: 'manager-1',
  };

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'MSM-20260202-0001',
    requesterId: 'user-1',
    scheduledDate: '2026-02-10',
    isBusinessTrip: true,
    status: BookingStatus.PENDING,
  };

  beforeEach(async () => {
    approvalRepositorySaveSpy = jest.fn();
    approvalRepositoryFindOneSpy = jest.fn();
    approvalRepositoryFindSpy = jest.fn();
    bookingRepositoryUpdateSpy = jest.fn();
    bookingRepositoryFindOneSpy = jest.fn();
    notificationsServiceCreateSpy = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        {
          provide: getRepositoryToken(BookingApproval),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: approvalRepositorySaveSpy,
            findOne: approvalRepositoryFindOneSpy,
            find: approvalRepositoryFindSpy,
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            update: bookingRepositoryUpdateSpy,
            findOne: bookingRepositoryFindOneSpy,
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {
            create: notificationsServiceCreateSpy,
          },
        },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  describe('determineApprovalType', () => {
    it('should return AUTO_APPROVED for management level users', () => {
      const result = service.determineApprovalType(mockManager as User, true);
      expect(result).toBe(ApprovalType.AUTO_APPROVED);
    });

    it('should return CC_ONLY for SIC (DAILY) users with business trips', () => {
      const result = service.determineApprovalType(mockSicUser as User, true);
      expect(result).toBe(ApprovalType.CC_ONLY);
    });

    it('should return MANAGER_APPROVAL for SIC users with non-business trips', () => {
      const result = service.determineApprovalType(mockSicUser as User, false);
      expect(result).toBe(ApprovalType.MANAGER_APPROVAL);
    });

    it('should return MANAGER_APPROVAL for regular (SOMETIMES) users', () => {
      const result = service.determineApprovalType(mockUser as User, true);
      expect(result).toBe(ApprovalType.MANAGER_APPROVAL);
    });
  });

  describe('createApproval', () => {
    it('should create approval record for regular employee', async () => {
      approvalRepositorySaveSpy.mockResolvedValue({
        id: 'approval-1',
        ...mockBooking,
        approverId: 'manager-1',
      });
      notificationsServiceCreateSpy.mockResolvedValue({});

      await service.createApproval(mockBooking as Booking, mockUser as User);

      expect(bookingRepositoryUpdateSpy).toHaveBeenCalledWith(
        mockBooking.id,
        expect.objectContaining({ status: BookingStatus.PENDING_APPROVAL }),
      );
      expect(approvalRepositorySaveSpy).toHaveBeenCalled();
      expect(notificationsServiceCreateSpy).toHaveBeenCalled();
    });

    it('should auto-approve for management level users', async () => {
      await service.createApproval(mockBooking as Booking, mockManager as User);

      expect(bookingRepositoryUpdateSpy).toHaveBeenCalledWith(
        mockBooking.id,
        expect.objectContaining({ status: BookingStatus.PENDING }),
      );
      expect(approvalRepositorySaveSpy).not.toHaveBeenCalled();
    });

    it('should send CC notification for SIC users with business trips', async () => {
      approvalRepositorySaveSpy.mockResolvedValue({
        id: 'approval-1',
        approvalType: ApprovalType.CC_ONLY,
      });

      await service.createApproval(mockBooking as Booking, mockSicUser as User);

      expect(notificationsServiceCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: 'BOOKING_CC_NOTIFICATION',
        }),
      );
    });
  });

  describe('approve', () => {
    const mockApproval = {
      id: 'approval-1',
      bookingId: 'booking-1',
      approverId: 'manager-1',
      requesterId: 'user-1',
      status: ApprovalStatus.PENDING,
      requester: mockUser,
    };

    it('should approve booking and update status', async () => {
      approvalRepositoryFindOneSpy.mockResolvedValue(mockApproval);
      approvalRepositorySaveSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
      });
      bookingRepositoryFindOneSpy.mockResolvedValue(mockBooking);

      const result = await service.approve('approval-1', 'manager-1', 'Approved');

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(bookingRepositoryUpdateSpy).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({ status: BookingStatus.PENDING }),
      );
    });

    it('should throw ForbiddenException if not the approver', async () => {
      approvalRepositoryFindOneSpy.mockResolvedValue(mockApproval);

      await expect(
        service.approve('approval-1', 'wrong-user', 'Approved'),
      ).rejects.toThrow('You are not authorized to approve this request');
    });

    it('should throw BadRequestException if already responded', async () => {
      approvalRepositoryFindOneSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
      });

      await expect(
        service.approve('approval-1', 'manager-1', 'Approved'),
      ).rejects.toThrow('Approval already approved');
    });
  });

  describe('reject', () => {
    const mockApproval = {
      id: 'approval-1',
      bookingId: 'booking-1',
      approverId: 'manager-1',
      requesterId: 'user-1',
      status: ApprovalStatus.PENDING,
      requester: mockUser,
    };

    it('should reject booking with reason', async () => {
      approvalRepositoryFindOneSpy.mockResolvedValue(mockApproval);
      approvalRepositorySaveSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
      });
      bookingRepositoryFindOneSpy.mockResolvedValue(mockBooking);

      const result = await service.reject('approval-1', 'manager-1', 'Not approved');

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(bookingRepositoryUpdateSpy).toHaveBeenCalledWith(
        'booking-1',
        expect.objectContaining({ status: BookingStatus.CANCELLED }),
      );
    });

    it('should require rejection reason', async () => {
      await expect(
        service.reject('approval-1', 'manager-1', ''),
      ).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('findPendingForApprover', () => {
    it('should return pending approvals for approver', async () => {
      const mockApprovals = [
        { id: 'approval-1', status: ApprovalStatus.PENDING },
        { id: 'approval-2', status: ApprovalStatus.PENDING },
      ];
      approvalRepositoryFindSpy.mockResolvedValue(mockApprovals);

      const result = await service.findPendingForApprover('manager-1');

      expect(result).toHaveLength(2);
      expect(approvalRepositoryFindSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { approverId: 'manager-1', status: ApprovalStatus.PENDING },
        }),
      );
    });
  });
});
```

### 2.2 Chat Service Tests

File: `/backend/src/modules/chat/chat.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ChatRoomStatus,
  MessageStatus,
  BookingType,
} from '../../common/enums';

describe('ChatService', () => {
  let service: ChatService;
  let chatRoomRepositorySaveSpy: jest.Mock;
  let chatRoomRepositoryFindOneSpy: jest.Mock;
  let chatRoomRepositoryFindSpy: jest.Mock;
  let chatRoomRepositoryUpdateSpy: jest.Mock;
  let chatMessageRepositorySaveSpy: jest.Mock;
  let chatMessageRepositoryFindSpy: jest.Mock;
  let bookingRepositoryFindOneSpy: jest.Mock;
  let notificationsServiceCreateSpy: jest.Mock;

  const mockBooking = {
    id: 'booking-1',
    requesterId: 'employee-1',
    assignedDriverId: 'driver-1',
    bookingType: BookingType.BLOCK_SCHEDULE,
  };

  const mockChatRoom = {
    id: 'room-1',
    bookingId: 'booking-1',
    employeeId: 'employee-1',
    driverId: 'driver-1',
    status: ChatRoomStatus.ACTIVE,
    employee: { id: 'employee-1', fullName: 'Employee' },
    driver: { id: 'driver-1', fullName: 'Driver' },
  };

  beforeEach(async () => {
    chatRoomRepositorySaveSpy = jest.fn();
    chatRoomRepositoryFindOneSpy = jest.fn();
    chatRoomRepositoryFindSpy = jest.fn();
    chatRoomRepositoryUpdateSpy = jest.fn();
    chatMessageRepositorySaveSpy = jest.fn();
    chatMessageRepositoryFindSpy = jest.fn();
    bookingRepositoryFindOneSpy = jest.fn();
    notificationsServiceCreateSpy = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: chatRoomRepositorySaveSpy,
            findOne: chatRoomRepositoryFindOneSpy,
            find: chatRoomRepositoryFindSpy,
            update: chatRoomRepositoryUpdateSpy,
          },
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: chatMessageRepositorySaveSpy,
            find: chatMessageRepositoryFindSpy,
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 1 }),
              getCount: jest.fn().mockResolvedValue(5),
            }),
          },
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            findOne: bookingRepositoryFindOneSpy,
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: notificationsServiceCreateSpy,
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createOrGetChatRoom', () => {
    it('should return existing chat room if found', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);

      const result = await service.createOrGetChatRoom('booking-1');

      expect(result).toEqual(mockChatRoom);
      expect(chatRoomRepositorySaveSpy).not.toHaveBeenCalled();
    });

    it('should create new chat room if not exists', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(null);
      bookingRepositoryFindOneSpy.mockResolvedValue(mockBooking);
      chatRoomRepositorySaveSpy.mockResolvedValue(mockChatRoom);

      const result = await service.createOrGetChatRoom('booking-1');

      expect(chatRoomRepositorySaveSpy).toHaveBeenCalled();
    });

    it('should throw if booking not found', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(null);
      bookingRepositoryFindOneSpy.mockResolvedValue(null);

      await expect(
        service.createOrGetChatRoom('invalid-booking'),
      ).rejects.toThrow('Booking with ID invalid-booking not found');
    });

    it('should throw if no driver assigned', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(null);
      bookingRepositoryFindOneSpy.mockResolvedValue({
        ...mockBooking,
        assignedDriverId: null,
      });

      await expect(
        service.createOrGetChatRoom('booking-1'),
      ).rejects.toThrow('Cannot create chat room: no driver assigned');
    });
  });

  describe('onDriverAssigned', () => {
    it('should create chat room for BLOCK_SCHEDULE booking', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(null);
      bookingRepositoryFindOneSpy.mockResolvedValue(mockBooking);
      chatRoomRepositorySaveSpy.mockResolvedValue(mockChatRoom);

      const result = await service.onDriverAssigned(mockBooking as Booking);

      expect(result).toBeDefined();
    });

    it('should not create chat room for non-BLOCK_SCHEDULE booking', async () => {
      const singleTripBooking = {
        ...mockBooking,
        bookingType: BookingType.SINGLE_TRIP,
      };

      const result = await service.onDriverAssigned(singleTripBooking as Booking);

      expect(result).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should send message and notify recipient', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);
      chatMessageRepositorySaveSpy.mockResolvedValue({
        id: 'msg-1',
        content: 'Hello',
        senderId: 'employee-1',
      });

      const result = await service.sendMessage('room-1', 'employee-1', {
        content: 'Hello',
      });

      expect(chatMessageRepositorySaveSpy).toHaveBeenCalled();
      expect(chatRoomRepositoryUpdateSpy).toHaveBeenCalledWith(
        'room-1',
        expect.objectContaining({ lastMessageAt: expect.any(Date) }),
      );
      expect(notificationsServiceCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'driver-1', // Recipient (the other party)
          notificationType: 'NEW_CHAT_MESSAGE',
        }),
      );
    });

    it('should throw if user is not a participant', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);

      await expect(
        service.sendMessage('room-1', 'stranger', { content: 'Hello' }),
      ).rejects.toThrow('You are not a participant in this chat room');
    });

    it('should throw if room is not active', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue({
        ...mockChatRoom,
        status: ChatRoomStatus.ARCHIVED,
      });

      await expect(
        service.sendMessage('room-1', 'employee-1', { content: 'Hello' }),
      ).rejects.toThrow('Chat room is archived');
    });
  });

  describe('sendScheduleChange', () => {
    it('should send schedule change message from employee', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);
      chatMessageRepositorySaveSpy.mockResolvedValue({
        id: 'msg-1',
        messageType: 'schedule_change',
      });

      const result = await service.sendScheduleChange('room-1', 'employee-1', {
        changeType: 'LATE_RETURN',
        newTime: '18:00',
        originalTime: '17:00',
        reason: 'Meeting extended',
      });

      expect(notificationsServiceCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: 'SCHEDULE_CHANGE_ALERT',
        }),
      );
    });

    it('should throw if driver tries to send schedule change', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);

      await expect(
        service.sendScheduleChange('room-1', 'driver-1', {
          changeType: 'LATE_RETURN',
          newTime: '18:00',
          originalTime: '17:00',
          reason: 'Meeting extended',
        }),
      ).rejects.toThrow('Only the employee can send schedule change notifications');
    });
  });

  describe('markAsRead', () => {
    it('should mark unread messages as read', async () => {
      chatRoomRepositoryFindOneSpy.mockResolvedValue(mockChatRoom);

      await service.markAsRead('room-1', 'employee-1');

      // Verify query builder was called correctly
    });
  });

  describe('archiveRoom', () => {
    it('should update room status to ARCHIVED', async () => {
      await service.archiveRoom('booking-1');

      expect(chatRoomRepositoryUpdateSpy).toHaveBeenCalledWith(
        { bookingId: 'booking-1' },
        { status: ChatRoomStatus.ARCHIVED },
      );
    });
  });

  describe('closeRoom', () => {
    it('should update room status to CLOSED', async () => {
      await service.closeRoom('booking-1');

      expect(chatRoomRepositoryUpdateSpy).toHaveBeenCalledWith(
        { bookingId: 'booking-1' },
        { status: ChatRoomStatus.CLOSED },
      );
    });
  });
});
```

### 2.3 Approvals Controller Tests

File: `/backend/src/modules/approvals/approvals.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalStatus, ApprovalType } from '../../common/enums';

describe('ApprovalsController', () => {
  let controller: ApprovalsController;
  let findPendingForApproverSpy: jest.Mock;
  let findByRequesterSpy: jest.Mock;
  let findByIdSpy: jest.Mock;
  let approveSpy: jest.Mock;
  let rejectSpy: jest.Mock;

  const mockApproval = {
    id: 'approval-1',
    bookingId: 'booking-1',
    approverId: 'manager-1',
    requesterId: 'user-1',
    status: ApprovalStatus.PENDING,
    approvalType: ApprovalType.MANAGER_APPROVAL,
  };

  beforeEach(async () => {
    findPendingForApproverSpy = jest.fn();
    findByRequesterSpy = jest.fn();
    findByIdSpy = jest.fn();
    approveSpy = jest.fn();
    rejectSpy = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalsController],
      providers: [
        {
          provide: ApprovalsService,
          useValue: {
            findPendingForApprover: findPendingForApproverSpy,
            findByRequester: findByRequesterSpy,
            findById: findByIdSpy,
            approve: approveSpy,
            reject: rejectSpy,
          },
        },
      ],
    }).compile();

    controller = module.get<ApprovalsController>(ApprovalsController);
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for current user', async () => {
      findPendingForApproverSpy.mockResolvedValue([mockApproval]);

      const result = await controller.getPendingApprovals({
        user: { id: 'manager-1' },
      });

      expect(result).toHaveLength(1);
      expect(findPendingForApproverSpy).toHaveBeenCalledWith('manager-1');
    });
  });

  describe('getMyRequests', () => {
    it('should return approval requests by current user', async () => {
      findByRequesterSpy.mockResolvedValue([mockApproval]);

      const result = await controller.getMyRequests({ user: { id: 'user-1' } });

      expect(result).toHaveLength(1);
      expect(findByRequesterSpy).toHaveBeenCalledWith('user-1');
    });
  });

  describe('approve', () => {
    it('should approve the request', async () => {
      approveSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.APPROVED,
      });

      const result = await controller.approve(
        'approval-1',
        { notes: 'Approved' },
        { user: { id: 'manager-1' } },
      );

      expect(result.status).toBe(ApprovalStatus.APPROVED);
      expect(approveSpy).toHaveBeenCalledWith('approval-1', 'manager-1', 'Approved');
    });
  });

  describe('reject', () => {
    it('should reject the request', async () => {
      rejectSpy.mockResolvedValue({
        ...mockApproval,
        status: ApprovalStatus.REJECTED,
      });

      const result = await controller.reject(
        'approval-1',
        { notes: 'Not approved' },
        { user: { id: 'manager-1' } },
      );

      expect(result.status).toBe(ApprovalStatus.REJECTED);
      expect(rejectSpy).toHaveBeenCalledWith('approval-1', 'manager-1', 'Not approved');
    });
  });
});
```

### 2.4 Chat Controller Tests

File: `/backend/src/modules/chat/chat.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRoomStatus, MessageStatus } from '../../common/enums';

describe('ChatController', () => {
  let controller: ChatController;
  let findRoomsForUserSpy: jest.Mock;
  let findRoomByIdSpy: jest.Mock;
  let createOrGetChatRoomSpy: jest.Mock;
  let getMessagesSpy: jest.Mock;
  let sendMessageSpy: jest.Mock;
  let sendScheduleChangeSpy: jest.Mock;
  let markAsReadSpy: jest.Mock;
  let getUnreadCountSpy: jest.Mock;

  const mockChatRoom = {
    id: 'room-1',
    bookingId: 'booking-1',
    employeeId: 'employee-1',
    driverId: 'driver-1',
    status: ChatRoomStatus.ACTIVE,
  };

  const mockMessage = {
    id: 'msg-1',
    chatRoomId: 'room-1',
    senderId: 'employee-1',
    content: 'Hello',
    status: MessageStatus.SENT,
  };

  beforeEach(async () => {
    findRoomsForUserSpy = jest.fn();
    findRoomByIdSpy = jest.fn();
    createOrGetChatRoomSpy = jest.fn();
    getMessagesSpy = jest.fn();
    sendMessageSpy = jest.fn();
    sendScheduleChangeSpy = jest.fn();
    markAsReadSpy = jest.fn();
    getUnreadCountSpy = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            findRoomsForUser: findRoomsForUserSpy,
            findRoomById: findRoomByIdSpy,
            createOrGetChatRoom: createOrGetChatRoomSpy,
            getMessages: getMessagesSpy,
            sendMessage: sendMessageSpy,
            sendScheduleChange: sendScheduleChangeSpy,
            markAsRead: markAsReadSpy,
            getUnreadCount: getUnreadCountSpy,
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  describe('getMyRooms', () => {
    it('should return chat rooms for current user', async () => {
      findRoomsForUserSpy.mockResolvedValue([mockChatRoom]);

      const result = await controller.getMyRooms({ user: { id: 'employee-1' } });

      expect(result).toHaveLength(1);
      expect(findRoomsForUserSpy).toHaveBeenCalledWith('employee-1');
    });
  });

  describe('getMessages', () => {
    it('should return messages for a chat room', async () => {
      getMessagesSpy.mockResolvedValue([mockMessage]);

      const result = await controller.getMessages(
        'room-1',
        50,
        0,
        { user: { id: 'employee-1' } },
      );

      expect(result).toHaveLength(1);
      expect(getMessagesSpy).toHaveBeenCalledWith('room-1', 'employee-1', 50, 0);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      sendMessageSpy.mockResolvedValue(mockMessage);

      const result = await controller.sendMessage(
        'room-1',
        { content: 'Hello' },
        { user: { id: 'employee-1' } },
      );

      expect(result).toEqual(mockMessage);
      expect(sendMessageSpy).toHaveBeenCalledWith(
        'room-1',
        'employee-1',
        { content: 'Hello' },
      );
    });
  });

  describe('sendScheduleChange', () => {
    it('should send schedule change notification', async () => {
      sendScheduleChangeSpy.mockResolvedValue({
        ...mockMessage,
        messageType: 'schedule_change',
      });

      const result = await controller.sendScheduleChange(
        'room-1',
        {
          changeType: 'LATE_RETURN',
          newTime: '18:00',
          originalTime: '17:00',
          reason: 'Meeting extended',
        },
        { user: { id: 'employee-1' } },
      );

      expect(result.messageType).toBe('schedule_change');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read', async () => {
      markAsReadSpy.mockResolvedValue(undefined);

      const result = await controller.markAsRead(
        'room-1',
        { user: { id: 'employee-1' } },
      );

      expect(result).toEqual({ success: true });
      expect(markAsReadSpy).toHaveBeenCalledWith('room-1', 'employee-1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      getUnreadCountSpy.mockResolvedValue(5);

      const result = await controller.getUnreadCount({ user: { id: 'employee-1' } });

      expect(result).toEqual({ count: 5 });
    });
  });
});
```

---

## 3. Integration Tests

### 3.1 Approval Workflow Integration Test

File: `/backend/test/approvals.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { ApprovalsModule } from '../src/modules/approvals/approvals.module';
import { BookingsModule } from '../src/modules/bookings/bookings.module';
import { UsersModule } from '../src/modules/users/users.module';
// ... other imports

describe('Approval Workflow Integration', () => {
  let app: INestApplication;
  let managerId: string;
  let employeeId: string;
  let managerToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Use test database
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432'),
          username: process.env.TEST_DB_USER || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: process.env.TEST_DB_NAME || 'msm_car_booking_test',
          autoLoadEntities: true,
          synchronize: true,
        }),
        ApprovalsModule,
        BookingsModule,
        UsersModule,
        // ... other modules
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test users and get tokens
    // ... setup code
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete approval workflow', () => {
    let bookingId: string;
    let approvalId: string;

    it('should create booking that requires approval', async () => {
      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          scheduledDate: '2026-02-15',
          scheduledTime: '09:00',
          passengerCount: 2,
          purpose: 'Client meeting',
          isBusinessTrip: true,
        })
        .expect(201);

      bookingId = response.body.id;
      expect(response.body.status).toBe('PENDING_APPROVAL');
    });

    it('should have created approval record', async () => {
      const response = await request(app.getHttpServer())
        .get('/approvals/my-requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      approvalId = response.body[0].id;
      expect(response.body[0].status).toBe('PENDING');
    });

    it('manager should see pending approval', async () => {
      const response = await request(app.getHttpServer())
        .get('/approvals/pending')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.some((a: any) => a.id === approvalId)).toBe(true);
    });

    it('manager should approve booking', async () => {
      const response = await request(app.getHttpServer())
        .post(`/approvals/${approvalId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ notes: 'Approved for client meeting' })
        .expect(201);

      expect(response.body.status).toBe('APPROVED');
    });

    it('booking should now be PENDING (ready for assignment)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('SIC employee flow (CC only)', () => {
    // Tests for SIC employees that don't need approval
  });

  describe('Management level flow (auto-approve)', () => {
    // Tests for managers that get auto-approved
  });
});
```

---

## 4. E2E Tests

### 4.1 Chat System E2E Test

File: `/backend/test/chat.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';

describe('Chat System E2E', () => {
  let app: INestApplication;
  let employeeSocket: Socket;
  let driverSocket: Socket;
  let employeeToken: string;
  let driverToken: string;
  let chatRoomId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3001);

    // Get tokens for employee and driver
    // ... setup code
  });

  afterAll(async () => {
    if (employeeSocket) employeeSocket.disconnect();
    if (driverSocket) driverSocket.disconnect();
    await app.close();
  });

  describe('WebSocket Chat', () => {
    it('should connect via WebSocket', (done) => {
      employeeSocket = io('http://localhost:3001/chat', {
        auth: { token: employeeToken },
      });

      employeeSocket.on('connect', () => {
        expect(employeeSocket.connected).toBe(true);
        done();
      });

      employeeSocket.on('connect_error', (err) => {
        done(err);
      });
    });

    it('should join chat room', (done) => {
      employeeSocket.emit('joinRoom', { chatRoomId });

      employeeSocket.on('joinedRoom', (data) => {
        expect(data.chatRoomId).toBe(chatRoomId);
        done();
      });
    });

    it('should send and receive messages', (done) => {
      // Connect driver socket
      driverSocket = io('http://localhost:3001/chat', {
        auth: { token: driverToken },
      });

      driverSocket.on('connect', () => {
        driverSocket.emit('joinRoom', { chatRoomId });
      });

      driverSocket.on('joinedRoom', () => {
        // Driver is in room, now send message from employee
        employeeSocket.emit('sendMessage', {
          chatRoomId,
          content: 'Hello driver!',
        });
      });

      driverSocket.on('newMessage', (message) => {
        expect(message.content).toBe('Hello driver!');
        expect(message.sender.id).toBeDefined();
        done();
      });
    });

    it('should handle typing indicators', (done) => {
      employeeSocket.emit('typing', { chatRoomId, isTyping: true });

      driverSocket.on('userTyping', (data) => {
        expect(data.isTyping).toBe(true);
        expect(data.chatRoomId).toBe(chatRoomId);
        done();
      });
    });
  });

  describe('REST API Chat', () => {
    it('should get messages via REST API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${chatRoomId}/messages`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should send schedule change notification', async () => {
      const response = await request(app.getHttpServer())
        .post(`/chat/rooms/${chatRoomId}/schedule-change`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          changeType: 'LATE_RETURN',
          newTime: '18:30',
          originalTime: '17:00',
          reason: 'Meeting running late',
        })
        .expect(201);

      expect(response.body.messageType).toBe('schedule_change');
    });
  });
});
```

---

## 5. Test Data Factories

### 5.1 User Factory

File: `/backend/src/test/factories/user.factory.ts`

```typescript
import { User } from '../../modules/users/entities/user.entity';
import { UserRole, UserSegment, PositionLevel } from '../../common/enums';

export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    id: 'test-user-id',
    email: 'test@company.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    phone: '+84123456789',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    managerId: null,
    manager: null,
    departmentId: 'dept-1',
    department: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
};

export const createMockManager = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    id: 'manager-id',
    email: 'manager@company.com',
    fullName: 'Test Manager',
    positionLevel: PositionLevel.MGR,
    managerId: null,
    ...overrides,
  });
};

export const createMockSicEmployee = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    id: 'sic-user-id',
    email: 'sic@company.com',
    fullName: 'SIC Employee',
    userSegment: UserSegment.DAILY,
    positionLevel: PositionLevel.STAFF,
    managerId: 'manager-id',
    ...overrides,
  });
};
```

### 5.2 Booking Factory

File: `/backend/src/test/factories/booking.factory.ts`

```typescript
import { Booking } from '../../modules/bookings/entities/booking.entity';
import { BookingType, BookingStatus, ApprovalType } from '../../common/enums';

export const createMockBooking = (overrides: Partial<Booking> = {}): Booking => {
  return {
    id: 'test-booking-id',
    bookingCode: 'MSM-20260202-0001',
    requesterId: 'user-id',
    requester: null,
    departmentId: 'dept-1',
    department: null,
    bookingType: BookingType.SINGLE_TRIP,
    status: BookingStatus.PENDING,
    approvalType: null,
    isBusinessTrip: true,
    scheduledDate: new Date('2026-02-10'),
    scheduledTime: '09:00',
    endDate: null,
    purpose: 'Business meeting',
    passengerCount: 2,
    notes: null,
    assignedVehicleId: null,
    assignedVehicle: null,
    assignedDriverId: null,
    assignedDriver: null,
    driverResponse: null,
    driverResponseAt: null,
    driverRejectionReason: null,
    estimatedKm: 15,
    actualKm: null,
    cancelledAt: null,
    cancelledById: null,
    cancelledBy: null,
    cancellationReason: null,
    cancellationNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Booking;
};

export const createMockBlockScheduleBooking = (overrides: Partial<Booking> = {}): Booking => {
  return createMockBooking({
    bookingType: BookingType.BLOCK_SCHEDULE,
    endDate: new Date('2026-02-14'),
    ...overrides,
  });
};
```

---

## Checklist

### Unit Tests
- [ ] ApprovalsService tests (determineApprovalType, createApproval, approve, reject)
- [ ] ApprovalsController tests (all endpoints)
- [ ] ChatService tests (createOrGetChatRoom, sendMessage, sendScheduleChange, markAsRead)
- [ ] ChatController tests (all endpoints)
- [ ] ChatGateway tests (WebSocket events)

### Integration Tests
- [ ] Approval workflow end-to-end (employee → manager → approval)
- [ ] SIC employee CC flow
- [ ] Management auto-approve flow
- [ ] Approval reminder job
- [ ] Approval expiration

### E2E Tests
- [ ] Chat room creation for BLOCK_SCHEDULE
- [ ] WebSocket connection and authentication
- [ ] Real-time message delivery
- [ ] Schedule change notification
- [ ] Chat room archiving on booking completion

### Test Coverage
- [ ] Verify 90%+ coverage for services
- [ ] Verify 100% endpoint coverage for controllers
- [ ] Run `pnpm test:cov` and review coverage report
