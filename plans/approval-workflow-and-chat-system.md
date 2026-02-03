# Implementation Plan: Booking Approval Workflow & In-App Chat System

**Document ID:** PLAN-20260202-001
**Created:** 2026-02-02
**Status:** Draft
**Estimated Effort:** 15-20 days

---

## Executive Summary

This plan covers two major feature additions to the MSM Car Booking system:

1. **Booking Approval Workflow** - Different approval flows based on user type and position level
2. **In-App Chat System** - Real-time communication between employees and drivers for schedule changes

For detailed implementation, see the multi-domain plan files in:
`/Users/liam/Workspaces/msm-car-booking/plans/20260202-approval-workflow-and-chat/`

- `00-overview.md` - Summary and dependencies
- `01-database.md` - Schema changes, migrations, enums
- `02-backend.md` - NestJS modules, services, controllers, WebSocket
- `03-testing.md` - Test strategy and test cases

---

## Quick Reference

### Feature 1: Booking Approval Workflow

| User Type | Condition | Approval Flow |
|-----------|-----------|---------------|
| SIC Employees | `user_segment = DAILY` AND business trip | **No approval required** - CC to line manager only |
| Other Employees | `user_segment = SOMETIMES` OR non-business trip | **Manager approval required** first |
| Management Level | `position_level >= MGR` | **No approval required** - Auto-accept |

### Feature 2: In-App Chat System

For BLOCK_SCHEDULE bookings (fixed route shuttles):
- Chat window between employee and driver
- Schedule change notifications (late return, departure change)
- Real-time messaging via WebSocket

---

## New Database Tables

### 1. booking_approvals

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_id | UUID | FK → bookings |
| approver_id | UUID | FK → users (manager) |
| requester_id | UUID | FK → users (employee) |
| approval_type | ENUM | MANAGER_APPROVAL / CC_ONLY / AUTO_APPROVED |
| status | ENUM | PENDING / APPROVED / REJECTED / EXPIRED |
| notes | TEXT | Approval/rejection notes |
| reminder_count | INT | Number of reminders sent |
| expires_at | TIMESTAMP | Approval expiration time (24h) |

### 2. chat_rooms

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_id | UUID | FK → bookings (UNIQUE) |
| employee_id | UUID | FK → users |
| driver_id | UUID | FK → users |
| status | ENUM | ACTIVE / ARCHIVED / CLOSED |
| last_message_at | TIMESTAMP | Last message timestamp |

### 3. chat_messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| chat_room_id | UUID | FK → chat_rooms |
| sender_id | UUID | FK → users |
| content | TEXT | Message content |
| message_type | VARCHAR | text / schedule_change / system |
| metadata | JSONB | Additional data (schedule changes) |
| status | ENUM | SENT / DELIVERED / READ |

---

## User Table Changes

Add new columns to `users` table:

| Column | Type | Description |
|--------|------|-------------|
| position_level | ENUM | STAFF / SENIOR / TEAM_LEAD / MGR / SR_MGR / DIRECTOR / VP / C_LEVEL |
| manager_id | UUID | FK → users (line manager for approval workflow) |

---

## New Enums

```typescript
// Position level for approval workflow
export enum PositionLevel {
  STAFF = 'STAFF',
  SENIOR = 'SENIOR',
  TEAM_LEAD = 'TEAM_LEAD',
  MGR = 'MGR',
  SR_MGR = 'SR_MGR',
  DIRECTOR = 'DIRECTOR',
  VP = 'VP',
  C_LEVEL = 'C_LEVEL',
}

// Approval status
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_APPROVED = 'AUTO_APPROVED',
  EXPIRED = 'EXPIRED',
}

// Approval type
export enum ApprovalType {
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',
  CC_ONLY = 'CC_ONLY',
  AUTO_APPROVED = 'AUTO_APPROVED',
}

// Chat room status
export enum ChatRoomStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  CLOSED = 'CLOSED',
}

// Message status
export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
```

Update `BookingStatus` enum:
```typescript
export enum BookingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',  // NEW: Awaiting manager approval
  PENDING = 'PENDING',
  // ... existing values
}
```

Update `NotificationType` enum:
```typescript
export enum NotificationType {
  // ... existing values
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  APPROVAL_REMINDER = 'APPROVAL_REMINDER',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_CC_NOTIFICATION = 'BOOKING_CC_NOTIFICATION',
  NEW_CHAT_MESSAGE = 'NEW_CHAT_MESSAGE',
  SCHEDULE_CHANGE_ALERT = 'SCHEDULE_CHANGE_ALERT',
}
```

---

## New API Endpoints

### Approvals API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/approvals/pending` | Get pending approvals for current user (as approver) |
| GET | `/approvals/my-requests` | Get approval requests created by current user |
| GET | `/approvals/:id` | Get approval details by ID |
| POST | `/approvals/:id/approve` | Approve a booking request |
| POST | `/approvals/:id/reject` | Reject a booking request |

### Chat API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat/rooms` | Get all chat rooms for current user |
| GET | `/chat/rooms/:id` | Get chat room details |
| GET | `/chat/rooms/booking/:bookingId` | Get or create chat room for a booking |
| GET | `/chat/rooms/:id/messages` | Get messages for a chat room |
| POST | `/chat/rooms/:id/messages` | Send a message |
| POST | `/chat/rooms/:id/schedule-change` | Send schedule change notification |
| POST | `/chat/rooms/:id/read` | Mark messages as read |
| GET | `/chat/unread-count` | Get unread message count |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Send a new message |
| `newMessage` | Server → Client | New message received |
| `joinRoom` | Client → Server | Join a chat room |
| `markRead` | Client → Server | Mark messages as read |
| `typing` | Client → Server | User is typing indicator |

---

## Backend Modules

### New Modules to Create

```
backend/src/modules/
├── approvals/
│   ├── approvals.module.ts
│   ├── approvals.controller.ts
│   ├── approvals.service.ts
│   ├── dto/
│   │   └── respond-approval.dto.ts
│   └── entities/
│       └── booking-approval.entity.ts
│
├── chat/
│   ├── chat.module.ts
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── chat.gateway.ts           # WebSocket
│   ├── dto/
│   │   ├── create-message.dto.ts
│   │   └── schedule-change.dto.ts
│   └── entities/
│       ├── chat-room.entity.ts
│       └── chat-message.entity.ts
```

### Dependencies to Install

```bash
# WebSocket support
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

# Scheduled jobs for reminders
pnpm add @nestjs/schedule
```

---

## Business Logic

### Approval Flow Decision Logic

```typescript
determineApprovalType(user: User, isBusinessTrip: boolean): ApprovalType {
  // Rule 1: Management level (MGR+) -> Auto-approved
  if (user.positionLevel >= PositionLevel.MGR) {
    return ApprovalType.AUTO_APPROVED;
  }

  // Rule 2: SIC (DAILY segment) with business trips -> CC only
  if (user.userSegment === UserSegment.DAILY && isBusinessTrip) {
    return ApprovalType.CC_ONLY;
  }

  // Rule 3: All others -> Manager approval required
  return ApprovalType.MANAGER_APPROVAL;
}
```

### Chat Room Auto-Creation

```typescript
// Create chat room when driver assigned to BLOCK_SCHEDULE booking
async onDriverAssigned(booking: Booking): Promise<ChatRoom | null> {
  if (booking.bookingType !== BookingType.BLOCK_SCHEDULE) {
    return null;
  }
  return this.createOrGetChatRoom(booking.id);
}
```

---

## Implementation Phases

### Phase 1: Database (Day 1-2)
- [ ] Add new enums to `/backend/src/common/enums/index.ts`
- [ ] Update User entity with position_level and manager_id
- [ ] Create BookingApproval entity
- [ ] Create ChatRoom and ChatMessage entities
- [ ] Generate and run migrations
- [ ] Update seed data

### Phase 2: Approvals Module (Day 3-6)
- [ ] Create approvals module structure
- [ ] Implement ApprovalsService with approval logic
- [ ] Create ApprovalsController with endpoints
- [ ] Integrate with BookingsService
- [ ] Create approval reminder job
- [ ] Write unit tests

### Phase 3: Chat Module (Day 7-10)
- [ ] Install WebSocket dependencies
- [ ] Create chat module structure
- [ ] Implement ChatService
- [ ] Create ChatGateway (WebSocket)
- [ ] Create ChatController for REST fallback
- [ ] Write unit tests

### Phase 4: Integration & Testing (Day 11-13)
- [ ] Integration testing
- [ ] E2E testing
- [ ] Documentation updates

---

## Migration Command

```bash
cd /Users/liam/Workspaces/msm-car-booking/backend

# After updating entities, generate migration
pnpm typeorm migration:generate src/database/migrations/AddApprovalWorkflowAndChat

# Run migration
pnpm typeorm migration:run
```

---

## Documentation Updates Required

After implementation, update:
- [ ] `docs-site/docs/database-models.mdx` - Add new tables and relationships
- [ ] `docs-site/docs/system-workflows.md` - Add approval workflow diagram
- [ ] `docs-site/docs/business-flows.md` - Add approval and chat flows
- [ ] `CLAUDE.md` - Update with new features

---

## Related Files

- `/Users/liam/Workspaces/msm-car-booking/plans/20260202-approval-workflow-and-chat/00-overview.md`
- `/Users/liam/Workspaces/msm-car-booking/plans/20260202-approval-workflow-and-chat/01-database.md`
- `/Users/liam/Workspaces/msm-car-booking/plans/20260202-approval-workflow-and-chat/02-backend.md`
- `/Users/liam/Workspaces/msm-car-booking/plans/20260202-approval-workflow-and-chat/03-testing.md`
