# Backend Implementation

**Document ID:** PLAN-20260202-001-BE
**Related To:** 00-overview.md, 01-database.md
**Status:** Draft

---

## Table of Contents

1. [Module Structure](#1-module-structure)
2. [Approvals Module](#2-approvals-module)
3. [Chat Module](#3-chat-module)
4. [Integration with Existing Modules](#4-integration-with-existing-modules)
5. [WebSocket Gateway](#5-websocket-gateway)
6. [Notification Updates](#6-notification-updates)
7. [Background Jobs](#7-background-jobs)
8. [API Endpoints Summary](#8-api-endpoints-summary)
9. [DTOs](#9-dtos)

---

## 1. Module Structure

### 1.1 New Modules

```
backend/src/modules/
├── approvals/
│   ├── approvals.module.ts
│   ├── approvals.controller.ts
│   ├── approvals.controller.spec.ts
│   ├── approvals.service.ts
│   ├── approvals.service.spec.ts
│   ├── dto/
│   │   ├── create-approval.dto.ts
│   │   ├── respond-approval.dto.ts
│   │   └── approval-query.dto.ts
│   └── entities/
│       └── booking-approval.entity.ts
│
├── chat/
│   ├── chat.module.ts
│   ├── chat.controller.ts
│   ├── chat.controller.spec.ts
│   ├── chat.service.ts
│   ├── chat.service.spec.ts
│   ├── chat.gateway.ts           # WebSocket gateway
│   ├── chat.gateway.spec.ts
│   ├── dto/
│   │   ├── create-message.dto.ts
│   │   ├── message-query.dto.ts
│   │   └── schedule-change.dto.ts
│   └── entities/
│       ├── chat-room.entity.ts
│       └── chat-message.entity.ts
```

### 1.2 Dependencies to Install

```bash
# For WebSocket support
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

# For scheduled jobs (approval reminders)
pnpm add @nestjs/schedule

# For Redis adapter (production WebSocket scaling)
pnpm add @socket.io/redis-adapter redis
```

---

## 2. Approvals Module

### 2.1 Module Definition

File: `/backend/src/modules/approvals/approvals.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { BookingApproval } from './entities/booking-approval.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingApproval, Booking, User]),
    NotificationsModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
```

### 2.2 Approvals Service

File: `/backend/src/modules/approvals/approvals.service.ts`

```typescript
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  NotificationType,
  MANAGEMENT_LEVEL_THRESHOLD,
} from '../../common/enums';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(BookingApproval)
    private readonly approvalRepository: Repository<BookingApproval>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Determine the approval type based on user and booking characteristics
   */
  determineApprovalType(user: User, isBusinessTrip: boolean): ApprovalType {
    // Rule 1: Management level (MGR and above) -> Auto-approved
    if (MANAGEMENT_LEVEL_THRESHOLD.includes(user.positionLevel)) {
      return ApprovalType.AUTO_APPROVED;
    }

    // Rule 2: SIC employees (DAILY segment) with business trips -> CC only
    if (user.userSegment === UserSegment.DAILY && isBusinessTrip) {
      return ApprovalType.CC_ONLY;
    }

    // Rule 3: All others -> Manager approval required
    return ApprovalType.MANAGER_APPROVAL;
  }

  /**
   * Create an approval request for a booking
   */
  async createApproval(
    booking: Booking,
    requester: User,
  ): Promise<BookingApproval | null> {
    const approvalType = this.determineApprovalType(requester, booking.isBusinessTrip);

    // Update booking with approval type
    await this.bookingRepository.update(booking.id, { approvalType });

    // If auto-approved, no approval record needed
    if (approvalType === ApprovalType.AUTO_APPROVED) {
      // Booking goes directly to PENDING status
      await this.bookingRepository.update(booking.id, {
        status: BookingStatus.PENDING,
      });
      return null;
    }

    // Get the requester's manager
    if (!requester.managerId) {
      // No manager assigned - default to auto-approve with warning
      await this.bookingRepository.update(booking.id, {
        status: BookingStatus.PENDING,
        approvalType: ApprovalType.AUTO_APPROVED,
      });
      return null;
    }

    // Set booking status to PENDING_APPROVAL
    await this.bookingRepository.update(booking.id, {
      status: BookingStatus.PENDING_APPROVAL,
    });

    // Calculate expiration time (24 hours for approval)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create approval record
    const approval = this.approvalRepository.create({
      bookingId: booking.id,
      approverId: requester.managerId,
      requesterId: requester.id,
      approvalType,
      status: ApprovalStatus.PENDING,
      expiresAt,
    });

    const savedApproval = await this.approvalRepository.save(approval);

    // Send notification to approver
    await this.sendApprovalNotification(savedApproval, booking, requester);

    return savedApproval;
  }

  /**
   * Send notification to manager for approval or CC
   */
  private async sendApprovalNotification(
    approval: BookingApproval,
    booking: Booking,
    requester: User,
  ): Promise<void> {
    const notificationType = approval.approvalType === ApprovalType.CC_ONLY
      ? NotificationType.BOOKING_CC_NOTIFICATION
      : NotificationType.APPROVAL_REQUIRED;

    const title = approval.approvalType === ApprovalType.CC_ONLY
      ? 'Thông báo đặt xe'
      : 'Yêu cầu phê duyệt đặt xe';

    const message = approval.approvalType === ApprovalType.CC_ONLY
      ? `${requester.fullName} đã đặt xe cho ngày ${booking.scheduledDate}`
      : `${requester.fullName} yêu cầu phê duyệt đặt xe cho ngày ${booking.scheduledDate}. Vui lòng phê duyệt trong vòng 24 giờ.`;

    await this.notificationsService.create({
      userId: approval.approverId,
      bookingId: booking.id,
      notificationType,
      title,
      message,
    });
  }

  /**
   * Approve a booking request
   */
  async approve(
    approvalId: string,
    approverId: string,
    notes?: string,
  ): Promise<BookingApproval> {
    const approval = await this.findById(approvalId);

    // Verify approver
    if (approval.approverId !== approverId) {
      throw new ForbiddenException('You are not authorized to approve this request');
    }

    // Check if already responded
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval already ${approval.status.toLowerCase()}`);
    }

    // Update approval
    approval.status = ApprovalStatus.APPROVED;
    approval.notes = notes;
    approval.respondedAt = new Date();

    await this.approvalRepository.save(approval);

    // Update booking status to PENDING (ready for vehicle assignment)
    await this.bookingRepository.update(approval.bookingId, {
      status: BookingStatus.PENDING,
    });

    // Notify requester
    const booking = await this.bookingRepository.findOne({
      where: { id: approval.bookingId },
    });

    await this.notificationsService.create({
      userId: approval.requesterId,
      bookingId: approval.bookingId,
      notificationType: NotificationType.BOOKING_APPROVED,
      title: 'Đặt xe đã được phê duyệt',
      message: `Yêu cầu đặt xe của bạn cho ngày ${booking.scheduledDate} đã được phê duyệt.`,
    });

    return approval;
  }

  /**
   * Reject a booking request
   */
  async reject(
    approvalId: string,
    approverId: string,
    notes: string,
  ): Promise<BookingApproval> {
    if (!notes || notes.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    const approval = await this.findById(approvalId);

    // Verify approver
    if (approval.approverId !== approverId) {
      throw new ForbiddenException('You are not authorized to reject this request');
    }

    // Check if already responded
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval already ${approval.status.toLowerCase()}`);
    }

    // Update approval
    approval.status = ApprovalStatus.REJECTED;
    approval.notes = notes;
    approval.respondedAt = new Date();

    await this.approvalRepository.save(approval);

    // Update booking status to CANCELLED
    await this.bookingRepository.update(approval.bookingId, {
      status: BookingStatus.CANCELLED,
      cancellationReason: 'MANAGER_REJECTED' as any, // Need to add this to enum
    });

    // Notify requester
    const booking = await this.bookingRepository.findOne({
      where: { id: approval.bookingId },
    });

    await this.notificationsService.create({
      userId: approval.requesterId,
      bookingId: approval.bookingId,
      notificationType: NotificationType.BOOKING_REJECTED,
      title: 'Đặt xe đã bị từ chối',
      message: `Yêu cầu đặt xe của bạn cho ngày ${booking.scheduledDate} đã bị từ chối. Lý do: ${notes}`,
    });

    return approval;
  }

  /**
   * Find approval by ID
   */
  async findById(id: string): Promise<BookingApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id },
      relations: ['booking', 'approver', 'requester'],
    });

    if (!approval) {
      throw new NotFoundException(`Approval with ID ${id} not found`);
    }

    return approval;
  }

  /**
   * Find pending approvals for a manager
   */
  async findPendingForApprover(approverId: string): Promise<BookingApproval[]> {
    return this.approvalRepository.find({
      where: {
        approverId,
        status: ApprovalStatus.PENDING,
      },
      relations: ['booking', 'requester'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find approvals by requester
   */
  async findByRequester(requesterId: string): Promise<BookingApproval[]> {
    return this.approvalRepository.find({
      where: { requesterId },
      relations: ['booking', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Send reminders for pending approvals
   * Called by scheduled job
   */
  async sendPendingReminders(): Promise<void> {
    const pendingApprovals = await this.approvalRepository.find({
      where: {
        status: ApprovalStatus.PENDING,
        approvalType: ApprovalType.MANAGER_APPROVAL,
      },
      relations: ['booking', 'approver', 'requester'],
    });

    const now = new Date();
    const reminderThresholdHours = 4; // Send reminder every 4 hours
    const maxReminders = 5;

    for (const approval of pendingApprovals) {
      // Check if expired
      if (approval.expiresAt && approval.expiresAt < now) {
        await this.expireApproval(approval);
        continue;
      }

      // Check if reminder should be sent
      const hoursSinceLastReminder = approval.lastReminderAt
        ? (now.getTime() - approval.lastReminderAt.getTime()) / (1000 * 60 * 60)
        : reminderThresholdHours + 1; // Force first reminder if never sent

      if (
        hoursSinceLastReminder >= reminderThresholdHours &&
        approval.reminderCount < maxReminders
      ) {
        await this.sendReminder(approval);
      }
    }
  }

  /**
   * Send a reminder notification
   */
  private async sendReminder(approval: BookingApproval): Promise<void> {
    await this.notificationsService.create({
      userId: approval.approverId,
      bookingId: approval.bookingId,
      notificationType: NotificationType.APPROVAL_REMINDER,
      title: 'Nhắc nhở: Phê duyệt đặt xe đang chờ',
      message: `Yêu cầu đặt xe từ ${approval.requester.fullName} đang chờ phê duyệt. Vui lòng xử lý sớm.`,
    });

    approval.reminderCount += 1;
    approval.lastReminderAt = new Date();
    await this.approvalRepository.save(approval);
  }

  /**
   * Expire an approval that has passed its deadline
   */
  private async expireApproval(approval: BookingApproval): Promise<void> {
    approval.status = ApprovalStatus.EXPIRED;
    await this.approvalRepository.save(approval);

    // Auto-approve on expiration (or auto-reject based on business rules)
    // Here we auto-approve to not block the employee
    await this.bookingRepository.update(approval.bookingId, {
      status: BookingStatus.PENDING,
    });

    // Notify both parties
    await this.notificationsService.create({
      userId: approval.requesterId,
      bookingId: approval.bookingId,
      notificationType: NotificationType.BOOKING_APPROVED,
      title: 'Đặt xe đã được tự động phê duyệt',
      message: 'Yêu cầu đặt xe của bạn đã được tự động phê duyệt do quá hạn phê duyệt.',
    });
  }
}
```

### 2.3 Approvals Controller

File: `/backend/src/modules/approvals/approvals.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovalsService } from './approvals.service';
import { RespondApprovalDto } from './dto/respond-approval.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending approvals for current user (as approver)' })
  async getPendingApprovals(@Request() req) {
    return this.approvalsService.findPendingForApprover(req.user.id);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get approval requests created by current user' })
  async getMyRequests(@Request() req) {
    return this.approvalsService.findByRequester(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval details by ID' })
  async getApproval(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalsService.findById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a booking request' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondApprovalDto,
    @Request() req,
  ) {
    return this.approvalsService.approve(id, req.user.id, dto.notes);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a booking request' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondApprovalDto,
    @Request() req,
  ) {
    return this.approvalsService.reject(id, req.user.id, dto.notes);
  }
}
```

---

## 3. Chat Module

### 3.1 Module Definition

File: `/backend/src/modules/chat/chat.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMessage, Booking, User]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
```

### 3.2 Chat Service

File: `/backend/src/modules/chat/chat.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ChatRoomStatus,
  MessageStatus,
  BookingType,
  BookingStatus,
  NotificationType,
} from '../../common/enums';
import { CreateMessageDto } from './dto/create-message.dto';
import { ScheduleChangeDto } from './dto/schedule-change.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create or get chat room for a booking
   * Auto-created for BLOCK_SCHEDULE bookings when driver is assigned
   */
  async createOrGetChatRoom(bookingId: string): Promise<ChatRoom> {
    // Check if chat room already exists
    const existing = await this.chatRoomRepository.findOne({
      where: { bookingId },
      relations: ['employee', 'driver', 'booking'],
    });

    if (existing) {
      return existing;
    }

    // Get booking details
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['requester'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Verify booking has a driver assigned
    if (!booking.assignedDriverId) {
      throw new BadRequestException('Cannot create chat room: no driver assigned');
    }

    // Create chat room
    const chatRoom = this.chatRoomRepository.create({
      bookingId,
      employeeId: booking.requesterId,
      driverId: booking.assignedDriverId,
      status: ChatRoomStatus.ACTIVE,
    });

    return this.chatRoomRepository.save(chatRoom);
  }

  /**
   * Auto-create chat room when driver is assigned to BLOCK_SCHEDULE booking
   */
  async onDriverAssigned(booking: Booking): Promise<ChatRoom | null> {
    // Only create for BLOCK_SCHEDULE bookings
    if (booking.bookingType !== BookingType.BLOCK_SCHEDULE) {
      return null;
    }

    return this.createOrGetChatRoom(booking.id);
  }

  /**
   * Send a message in a chat room
   */
  async sendMessage(
    chatRoomId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<ChatMessage> {
    const chatRoom = await this.findRoomById(chatRoomId);

    // Verify sender is a participant
    if (chatRoom.employeeId !== senderId && chatRoom.driverId !== senderId) {
      throw new ForbiddenException('You are not a participant in this chat room');
    }

    // Verify room is active
    if (chatRoom.status !== ChatRoomStatus.ACTIVE) {
      throw new BadRequestException(`Chat room is ${chatRoom.status.toLowerCase()}`);
    }

    // Create message
    const message = this.chatMessageRepository.create({
      chatRoomId,
      senderId,
      content: dto.content,
      messageType: dto.messageType || 'text',
      metadata: dto.metadata,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // Update chat room last message time
    await this.chatRoomRepository.update(chatRoomId, {
      lastMessageAt: new Date(),
    });

    // Send push notification to recipient
    const recipientId = chatRoom.employeeId === senderId
      ? chatRoom.driverId
      : chatRoom.employeeId;

    await this.notificationsService.create({
      userId: recipientId,
      bookingId: chatRoom.bookingId,
      notificationType: NotificationType.NEW_CHAT_MESSAGE,
      title: 'Tin nhắn mới',
      message: dto.content.substring(0, 100) + (dto.content.length > 100 ? '...' : ''),
    });

    return savedMessage;
  }

  /**
   * Send a schedule change notification message
   */
  async sendScheduleChange(
    chatRoomId: string,
    senderId: string,
    dto: ScheduleChangeDto,
  ): Promise<ChatMessage> {
    const chatRoom = await this.findRoomById(chatRoomId);

    // Verify sender is the employee (schedule changes come from employee)
    if (chatRoom.employeeId !== senderId) {
      throw new ForbiddenException('Only the employee can send schedule change notifications');
    }

    const messageContent = dto.changeType === 'LATE_RETURN'
      ? `Tôi sẽ trễ, thời gian trở về mới: ${dto.newTime}. Lý do: ${dto.reason}`
      : `Thay đổi giờ khởi hành: ${dto.newTime}. Lý do: ${dto.reason}`;

    const message = await this.sendMessage(chatRoomId, senderId, {
      content: messageContent,
      messageType: 'schedule_change',
      metadata: {
        changeType: dto.changeType,
        newTime: dto.newTime,
        reason: dto.reason,
        originalTime: dto.originalTime,
      },
    });

    // Send additional notification to driver
    await this.notificationsService.create({
      userId: chatRoom.driverId,
      bookingId: chatRoom.bookingId,
      notificationType: NotificationType.SCHEDULE_CHANGE_ALERT,
      title: 'Thay đổi lịch trình',
      message: messageContent,
    });

    return message;
  }

  /**
   * Get messages for a chat room
   */
  async getMessages(
    chatRoomId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    const chatRoom = await this.findRoomById(chatRoomId);

    // Verify user is a participant
    if (chatRoom.employeeId !== userId && chatRoom.driverId !== userId) {
      throw new ForbiddenException('You are not a participant in this chat room');
    }

    return this.chatMessageRepository.find({
      where: { chatRoomId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    chatRoomId: string,
    userId: string,
  ): Promise<void> {
    const chatRoom = await this.findRoomById(chatRoomId);

    // Verify user is a participant
    if (chatRoom.employeeId !== userId && chatRoom.driverId !== userId) {
      throw new ForbiddenException('You are not a participant in this chat room');
    }

    // Mark all unread messages from the other participant as read
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({
        status: MessageStatus.READ,
        readAt: new Date(),
      })
      .where('chat_room_id = :chatRoomId', { chatRoomId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('status != :readStatus', { readStatus: MessageStatus.READ })
      .execute();
  }

  /**
   * Find chat room by ID
   */
  async findRoomById(id: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['employee', 'driver', 'booking'],
    });

    if (!room) {
      throw new NotFoundException(`Chat room with ID ${id} not found`);
    }

    return room;
  }

  /**
   * Find chat room by booking ID
   */
  async findRoomByBooking(bookingId: string): Promise<ChatRoom | null> {
    return this.chatRoomRepository.findOne({
      where: { bookingId },
      relations: ['employee', 'driver', 'booking'],
    });
  }

  /**
   * Get chat rooms for a user
   */
  async findRoomsForUser(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: [
        { employeeId: userId, status: ChatRoomStatus.ACTIVE },
        { driverId: userId, status: ChatRoomStatus.ACTIVE },
      ],
      relations: ['employee', 'driver', 'booking'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  /**
   * Archive chat room when booking is completed
   */
  async archiveRoom(bookingId: string): Promise<void> {
    await this.chatRoomRepository.update(
      { bookingId },
      { status: ChatRoomStatus.ARCHIVED },
    );
  }

  /**
   * Close chat room when booking is cancelled
   */
  async closeRoom(bookingId: string): Promise<void> {
    await this.chatRoomRepository.update(
      { bookingId },
      { status: ChatRoomStatus.CLOSED },
    );
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.findRoomsForUser(userId);
    const roomIds = rooms.map((r) => r.id);

    if (roomIds.length === 0) {
      return 0;
    }

    const result = await this.chatMessageRepository
      .createQueryBuilder('msg')
      .where('msg.chat_room_id IN (:...roomIds)', { roomIds })
      .andWhere('msg.sender_id != :userId', { userId })
      .andWhere('msg.status != :readStatus', { readStatus: MessageStatus.READ })
      .getCount();

    return result;
  }
}
```

### 3.3 Chat Controller

File: `/backend/src/modules/chat/chat.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ScheduleChangeDto } from './dto/schedule-change.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all chat rooms for current user' })
  async getMyRooms(@Request() req) {
    return this.chatService.findRoomsForUser(req.user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get chat room details' })
  async getRoom(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatService.findRoomById(id);
  }

  @Get('rooms/booking/:bookingId')
  @ApiOperation({ summary: 'Get or create chat room for a booking' })
  async getRoomByBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.chatService.createOrGetChatRoom(bookingId);
  }

  @Get('rooms/:id/messages')
  @ApiOperation({ summary: 'Get messages for a chat room' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Request() req,
  ) {
    return this.chatService.getMessages(id, req.user.id, limit, offset);
  }

  @Post('rooms/:id/messages')
  @ApiOperation({ summary: 'Send a message in a chat room' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
    @Request() req,
  ) {
    return this.chatService.sendMessage(id, req.user.id, dto);
  }

  @Post('rooms/:id/schedule-change')
  @ApiOperation({ summary: 'Send a schedule change notification' })
  async sendScheduleChange(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleChangeDto,
    @Request() req,
  ) {
    return this.chatService.sendScheduleChange(id, req.user.id, dto);
  }

  @Post('rooms/:id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    await this.chatService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  async getUnreadCount(@Request() req) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { count };
  }
}
```

---

## 4. Integration with Existing Modules

### 4.1 Update Bookings Service

Add approval workflow integration to BookingsService:

```typescript
// In bookings.service.ts

import { ApprovalsService } from '../approvals/approvals.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class BookingsService {
  constructor(
    // ... existing injections
    private readonly approvalsService: ApprovalsService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Create a new booking with approval workflow
   */
  async create(
    createBookingDto: CreateBookingDto,
    requester: User,
  ): Promise<Booking> {
    // Create booking record
    const booking = await this.createBookingRecord(createBookingDto, requester);

    // Initiate approval workflow
    await this.approvalsService.createApproval(booking, requester);

    return booking;
  }

  /**
   * When vehicle and driver are assigned, create chat room if applicable
   */
  async assignVehicleAndDriver(
    bookingId: string,
    vehicleId: string,
    driverId: string,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);

    booking.assignedVehicleId = vehicleId;
    booking.assignedDriverId = driverId;
    booking.status = BookingStatus.ASSIGNED;

    const updatedBooking = await this.bookingRepository.save(booking);

    // Create chat room for BLOCK_SCHEDULE bookings
    await this.chatService.onDriverAssigned(updatedBooking);

    return updatedBooking;
  }

  /**
   * When booking is completed, archive chat room
   */
  async complete(bookingId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);
    booking.status = BookingStatus.COMPLETED;
    
    const updatedBooking = await this.bookingRepository.save(booking);

    // Archive chat room
    await this.chatService.archiveRoom(bookingId);

    return updatedBooking;
  }

  /**
   * When booking is cancelled, close chat room
   */
  async cancel(bookingId: string, userId: string, reason: string): Promise<Booking> {
    // ... existing cancel logic

    // Close chat room
    await this.chatService.closeRoom(bookingId);

    return updatedBooking;
  }
}
```

### 4.2 Update Notifications Service

Add new notification creation method:

```typescript
// In notifications.service.ts

interface CreateNotificationDto {
  userId: string;
  bookingId?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
}

async create(dto: CreateNotificationDto): Promise<Notification> {
  const notification = this.notificationRepository.create({
    userId: dto.userId,
    bookingId: dto.bookingId,
    notificationType: dto.notificationType,
    title: dto.title,
    message: dto.message,
    channel: dto.channel || NotificationChannel.APP_PUSH,
    status: NotificationStatus.PENDING,
  });

  const saved = await this.notificationRepository.save(notification);

  // Trigger push notification here if needed
  // await this.pushNotificationService.send(saved);

  return saved;
}
```

---

## 5. WebSocket Gateway

### 5.1 Chat Gateway

File: `/backend/src/modules/chat/chat.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*', // Configure properly for production
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      // Track user's socket connections
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId).add(client.id);

      // Join user's chat rooms
      const rooms = await this.chatService.findRoomsForUser(client.userId);
      for (const room of rooms) {
        client.join(`room:${room.id}`);
      }

      console.log(`User ${client.userId} connected via socket ${client.id}`);
    } catch (error) {
      console.error('Socket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      console.log(`User ${client.userId} disconnected from socket ${client.id}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatRoomId: string; content: string; messageType?: string },
  ): Promise<void> {
    try {
      const message = await this.chatService.sendMessage(
        data.chatRoomId,
        client.userId,
        {
          content: data.content,
          messageType: data.messageType || 'text',
        },
      );

      // Broadcast to room
      this.server.to(`room:${data.chatRoomId}`).emit('newMessage', {
        ...message,
        sender: { id: client.userId },
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatRoomId: string },
  ): Promise<void> {
    try {
      // Verify user is a participant
      const room = await this.chatService.findRoomById(data.chatRoomId);
      if (room.employeeId !== client.userId && room.driverId !== client.userId) {
        client.emit('error', { message: 'Not authorized to join this room' });
        return;
      }

      client.join(`room:${data.chatRoomId}`);
      client.emit('joinedRoom', { chatRoomId: data.chatRoomId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatRoomId: string },
  ): Promise<void> {
    try {
      await this.chatService.markAsRead(data.chatRoomId, client.userId);

      // Notify room that messages were read
      this.server.to(`room:${data.chatRoomId}`).emit('messagesRead', {
        chatRoomId: data.chatRoomId,
        readBy: client.userId,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatRoomId: string; isTyping: boolean },
  ): void {
    client.to(`room:${data.chatRoomId}`).emit('userTyping', {
      chatRoomId: data.chatRoomId,
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Send notification to specific user(s)
   */
  sendToUser(userId: string, event: string, data: any): void {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      for (const socketId of userSocketIds) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}
```

---

## 6. Notification Updates

### 6.1 Update Notification Types Enum

Already covered in 01-database.md. Ensure the enum in `/backend/src/common/enums/index.ts` includes:

```typescript
export enum NotificationType {
  // Existing types
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  VEHICLE_ARRIVING = 'VEHICLE_ARRIVING',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',

  // Approval workflow notifications
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  APPROVAL_REMINDER = 'APPROVAL_REMINDER',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CC_NOTIFICATION = 'BOOKING_CC_NOTIFICATION',

  // Chat notifications
  NEW_CHAT_MESSAGE = 'NEW_CHAT_MESSAGE',
  SCHEDULE_CHANGE_ALERT = 'SCHEDULE_CHANGE_ALERT',
}
```

---

## 7. Background Jobs

### 7.1 Approval Reminder Job

File: `/backend/src/jobs/approval-reminder.job.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApprovalsService } from '../modules/approvals/approvals.service';

@Injectable()
export class ApprovalReminderJob {
  constructor(private readonly approvalsService: ApprovalsService) {}

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleApprovalReminders(): Promise<void> {
    console.log('Running approval reminder job...');
    try {
      await this.approvalsService.sendPendingReminders();
      console.log('Approval reminder job completed');
    } catch (error) {
      console.error('Approval reminder job failed:', error);
    }
  }
}
```

### 7.2 Register Job in App Module

```typescript
// In app.module.ts
import { ScheduleModule } from '@nestjs/schedule';
import { ApprovalReminderJob } from './jobs/approval-reminder.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
  providers: [
    ApprovalReminderJob,
    // ... other providers
  ],
})
export class AppModule {}
```

---

## 8. API Endpoints Summary

### 8.1 Approvals Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/approvals/pending` | Get pending approvals for current user (as approver) | JWT |
| GET | `/approvals/my-requests` | Get approval requests created by current user | JWT |
| GET | `/approvals/:id` | Get approval details by ID | JWT |
| POST | `/approvals/:id/approve` | Approve a booking request | JWT |
| POST | `/approvals/:id/reject` | Reject a booking request | JWT |

### 8.2 Chat Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/chat/rooms` | Get all chat rooms for current user | JWT |
| GET | `/chat/rooms/:id` | Get chat room details | JWT |
| GET | `/chat/rooms/booking/:bookingId` | Get or create chat room for a booking | JWT |
| GET | `/chat/rooms/:id/messages` | Get messages for a chat room | JWT |
| POST | `/chat/rooms/:id/messages` | Send a message in a chat room | JWT |
| POST | `/chat/rooms/:id/schedule-change` | Send a schedule change notification | JWT |
| POST | `/chat/rooms/:id/read` | Mark messages as read | JWT |
| GET | `/chat/unread-count` | Get unread message count | JWT |

### 8.3 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Send a new message |
| `newMessage` | Server → Client | New message received |
| `joinRoom` | Client → Server | Join a chat room |
| `joinedRoom` | Server → Client | Confirmation of room join |
| `markRead` | Client → Server | Mark messages as read |
| `messagesRead` | Server → Client | Messages marked as read |
| `typing` | Client → Server | User is typing |
| `userTyping` | Server → Client | Another user is typing |
| `error` | Server → Client | Error occurred |

---

## 9. DTOs

### 9.1 Approval DTOs

File: `/backend/src/modules/approvals/dto/respond-approval.dto.ts`

```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RespondApprovalDto {
  @ApiPropertyOptional({
    description: 'Notes for approval/rejection',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
```

### 9.2 Chat DTOs

File: `/backend/src/modules/chat/dto/create-message.dto.ts`

```typescript
import { IsNotEmpty, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message content',
    maxLength: 2000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({
    description: 'Message type (text, schedule_change, system)',
    default: 'text',
  })
  @IsOptional()
  @IsString()
  messageType?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
```

File: `/backend/src/modules/chat/dto/schedule-change.dto.ts`

```typescript
import { IsNotEmpty, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleChangeDto {
  @ApiProperty({
    description: 'Type of schedule change',
    enum: ['LATE_RETURN', 'DEPARTURE_CHANGE'],
  })
  @IsNotEmpty()
  @IsIn(['LATE_RETURN', 'DEPARTURE_CHANGE'])
  changeType: 'LATE_RETURN' | 'DEPARTURE_CHANGE';

  @ApiProperty({
    description: 'New time (HH:mm format)',
    example: '14:30',
  })
  @IsNotEmpty()
  @IsString()
  newTime: string;

  @ApiProperty({
    description: 'Original time (HH:mm format)',
    example: '12:00',
  })
  @IsNotEmpty()
  @IsString()
  originalTime: string;

  @ApiProperty({
    description: 'Reason for the change',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}
```

---

## Checklist

### Module Setup
- [ ] Create `/backend/src/modules/approvals/` directory structure
- [ ] Create `/backend/src/modules/chat/` directory structure
- [ ] Install WebSocket dependencies (`@nestjs/websockets`, `socket.io`)
- [ ] Install schedule dependencies (`@nestjs/schedule`)

### Approvals Module
- [ ] Create BookingApproval entity
- [ ] Create ApprovalsModule
- [ ] Implement ApprovalsService
- [ ] Implement ApprovalsController
- [ ] Create DTOs
- [ ] Write unit tests for ApprovalsService
- [ ] Write unit tests for ApprovalsController

### Chat Module
- [ ] Create ChatRoom entity
- [ ] Create ChatMessage entity
- [ ] Create ChatModule
- [ ] Implement ChatService
- [ ] Implement ChatController
- [ ] Implement ChatGateway (WebSocket)
- [ ] Create DTOs
- [ ] Write unit tests for ChatService
- [ ] Write unit tests for ChatController
- [ ] Write unit tests for ChatGateway

### Integration
- [ ] Update BookingsService with approval workflow
- [ ] Update BookingsService with chat room creation
- [ ] Update NotificationsService with new methods
- [ ] Register modules in AppModule
- [ ] Configure WebSocket in main.ts

### Background Jobs
- [ ] Create ApprovalReminderJob
- [ ] Register ScheduleModule
- [ ] Test job execution

### Documentation
- [ ] Update Swagger documentation
- [ ] Update API documentation in docs-site
