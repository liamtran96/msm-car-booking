# Database Schema Changes

**Document ID:** PLAN-20260202-001-DB
**Related To:** 00-overview.md
**Status:** Draft

---

## Table of Contents

1. [New Enums](#1-new-enums)
2. [User Table Changes](#2-user-table-changes)
3. [Booking Table Changes](#3-booking-table-changes)
4. [New Tables](#4-new-tables)
5. [Entity Definitions](#5-entity-definitions)
6. [Migration Strategy](#6-migration-strategy)
7. [Seed Data Updates](#7-seed-data-updates)

---

## 1. New Enums

### 1.1 Position Level Enum

Add to `/backend/src/common/enums/index.ts`:

```typescript
// Position level for approval workflow
export enum PositionLevel {
  STAFF = 'STAFF',           // Regular staff member
  SENIOR = 'SENIOR',         // Senior staff
  TEAM_LEAD = 'TEAM_LEAD',   // Team lead
  MGR = 'MGR',               // Manager
  SR_MGR = 'SR_MGR',         // Senior Manager
  DIRECTOR = 'DIRECTOR',     // Director
  VP = 'VP',                 // Vice President
  C_LEVEL = 'C_LEVEL',       // C-Level (CEO, CFO, etc.)
}

// Define management level threshold
export const MANAGEMENT_LEVEL_THRESHOLD: PositionLevel[] = [
  PositionLevel.MGR,
  PositionLevel.SR_MGR,
  PositionLevel.DIRECTOR,
  PositionLevel.VP,
  PositionLevel.C_LEVEL,
];
```

### 1.2 Approval Status Enum

```typescript
// Approval status for booking approvals
export enum ApprovalStatus {
  PENDING = 'PENDING',       // Awaiting approval
  APPROVED = 'APPROVED',     // Approved by manager
  REJECTED = 'REJECTED',     // Rejected by manager
  AUTO_APPROVED = 'AUTO_APPROVED',  // Auto-approved (SIC or management)
  EXPIRED = 'EXPIRED',       // Approval request expired
}
```

### 1.3 Approval Type Enum

```typescript
// Type of approval
export enum ApprovalType {
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',  // Requires manager approval
  CC_ONLY = 'CC_ONLY',                    // Just notify manager (no approval needed)
  AUTO_APPROVED = 'AUTO_APPROVED',        // Auto-approved (management level)
}
```

### 1.4 Update Booking Status Enum

```typescript
export enum BookingStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',  // NEW: Awaiting manager approval
  PENDING = 'PENDING',                     // Awaiting vehicle assignment
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REDIRECTED_EXTERNAL = 'REDIRECTED_EXTERNAL',
}
```

### 1.5 Chat Room Status Enum

```typescript
// Chat room status
export enum ChatRoomStatus {
  ACTIVE = 'ACTIVE',         // Chat room is active
  ARCHIVED = 'ARCHIVED',     // Chat room archived (booking completed)
  CLOSED = 'CLOSED',         // Chat room closed (booking cancelled)
}
```

### 1.6 Chat Message Status Enum

```typescript
// Chat message delivery status
export enum MessageStatus {
  SENT = 'SENT',             // Message sent to server
  DELIVERED = 'DELIVERED',   // Message delivered to recipient
  READ = 'READ',             // Message read by recipient
}
```

### 1.7 Update Notification Type Enum

```typescript
export enum NotificationType {
  // Existing types
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  VEHICLE_ARRIVING = 'VEHICLE_ARRIVING',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  
  // NEW: Approval workflow notifications
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',       // Manager needs to approve
  APPROVAL_REMINDER = 'APPROVAL_REMINDER',       // Reminder for pending approval
  BOOKING_APPROVED = 'BOOKING_APPROVED',         // Booking was approved
  BOOKING_REJECTED = 'BOOKING_REJECTED',         // Booking was rejected
  BOOKING_CC_NOTIFICATION = 'BOOKING_CC_NOTIFICATION', // CC to manager (info only)
  
  // NEW: Chat notifications
  NEW_CHAT_MESSAGE = 'NEW_CHAT_MESSAGE',         // New chat message received
  SCHEDULE_CHANGE_ALERT = 'SCHEDULE_CHANGE_ALERT', // Schedule change notification
}
```

---

## 2. User Table Changes

### 2.1 Add Position Level Column

Add `position_level` column to `users` table:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| position_level | ENUM | DEFAULT 'STAFF' | Employee position level |
| manager_id | UUID | FK → users, NULLABLE | Direct line manager (for approval workflow) |

### 2.2 Updated User Entity

File: `/backend/src/modules/users/entities/user.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole, UserSegment, PositionLevel } from '../../../common/enums';
import { Department } from '../../departments/entities/department.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({
    name: 'user_segment',
    type: 'enum',
    enum: UserSegment,
    nullable: true,
  })
  userSegment: UserSegment;

  // NEW: Position level for approval workflow
  @Column({
    name: 'position_level',
    type: 'enum',
    enum: PositionLevel,
    default: PositionLevel.STAFF,
  })
  positionLevel: PositionLevel;

  // NEW: Line manager for approval workflow
  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## 3. Booking Table Changes

### 3.1 Add Approval-Related Columns

Add columns to track approval status directly on booking:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| approval_type | ENUM | NOT NULL | Type of approval required |
| is_business_trip | BOOLEAN | DEFAULT true | Whether this is a business trip |

### 3.2 Updated Booking Entity

File: `/backend/src/modules/bookings/entities/booking.entity.ts`

Add these columns:

```typescript
// NEW: Approval workflow fields
@Column({
  name: 'approval_type',
  type: 'enum',
  enum: ApprovalType,
  nullable: true,
})
approvalType: ApprovalType;

// NEW: Business trip flag (affects approval flow for DAILY users)
@Column({
  name: 'is_business_trip',
  type: 'boolean',
  default: true,
})
isBusinessTrip: boolean;
```

---

## 4. New Tables

### 4.1 booking_approvals Table

Tracks approval requests and their status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| booking_id | UUID | FK → bookings, NOT NULL | Associated booking |
| approver_id | UUID | FK → users, NOT NULL | Manager who should approve |
| requester_id | UUID | FK → users, NOT NULL | Employee who requested |
| approval_type | ENUM | NOT NULL | MANAGER_APPROVAL / CC_ONLY |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Current approval status |
| notes | TEXT | NULLABLE | Approval/rejection notes |
| reminder_count | INT | DEFAULT 0 | Number of reminders sent |
| last_reminder_at | TIMESTAMP | NULLABLE | Last reminder timestamp |
| responded_at | TIMESTAMP | NULLABLE | When approver responded |
| expires_at | TIMESTAMP | NULLABLE | Approval expiration time |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_booking_approvals_booking` on `(booking_id)`
- `idx_booking_approvals_approver_status` on `(approver_id, status)`
- `idx_booking_approvals_expires` on `(expires_at)` WHERE status = 'PENDING'

### 4.2 chat_rooms Table

Chat rooms for employee-driver communication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| booking_id | UUID | FK → bookings, UNIQUE, NOT NULL | Associated booking |
| employee_id | UUID | FK → users, NOT NULL | Employee in chat |
| driver_id | UUID | FK → users, NOT NULL | Driver in chat |
| status | ENUM | NOT NULL, DEFAULT 'ACTIVE' | Room status |
| last_message_at | TIMESTAMP | NULLABLE | Last message timestamp |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_chat_rooms_booking` on `(booking_id)`
- `idx_chat_rooms_employee` on `(employee_id)`
- `idx_chat_rooms_driver` on `(driver_id)`
- `idx_chat_rooms_status` on `(status)`

### 4.3 chat_messages Table

Individual chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| chat_room_id | UUID | FK → chat_rooms, NOT NULL | Parent chat room |
| sender_id | UUID | FK → users, NOT NULL | Message sender |
| content | TEXT | NOT NULL | Message content |
| message_type | VARCHAR | DEFAULT 'text' | Message type (text, schedule_change, etc.) |
| metadata | JSONB | NULLABLE | Additional data (e.g., new schedule time) |
| status | ENUM | NOT NULL, DEFAULT 'SENT' | Delivery status |
| read_at | TIMESTAMP | NULLABLE | When message was read |
| created_at | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_chat_messages_room_created` on `(chat_room_id, created_at DESC)`
- `idx_chat_messages_sender` on `(sender_id)`
- `idx_chat_messages_status` on `(chat_room_id, status)` WHERE status != 'READ'

---

## 5. Entity Definitions

### 5.1 BookingApproval Entity

File: `/backend/src/modules/approvals/entities/booking-approval.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApprovalStatus, ApprovalType } from '../../../common/enums';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('booking_approvals')
@Index('idx_booking_approvals_approver_status', ['approverId', 'status'])
export class BookingApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'approver_id' })
  approverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({
    name: 'approval_type',
    type: 'enum',
    enum: ApprovalType,
  })
  approvalType: ApprovalType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'reminder_count', default: 0 })
  reminderCount: number;

  @Column({ name: 'last_reminder_at', type: 'timestamptz', nullable: true })
  lastReminderAt: Date;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 5.2 ChatRoom Entity

File: `/backend/src/modules/chat/entities/chat-room.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ChatRoomStatus } from '../../../common/enums';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
@Index('idx_chat_rooms_employee', ['employeeId'])
@Index('idx_chat_rooms_driver', ['driverId'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', unique: true })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'employee_id' })
  employee: User;

  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({
    type: 'enum',
    enum: ChatRoomStatus,
    default: ChatRoomStatus.ACTIVE,
  })
  status: ChatRoomStatus;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 5.3 ChatMessage Entity

File: `/backend/src/modules/chat/entities/chat-message.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MessageStatus } from '../../../common/enums';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
@Index('idx_chat_messages_room_created', ['chatRoomId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_room_id' })
  chatRoomId: string;

  @ManyToOne(() => ChatRoom, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_room_id' })
  chatRoom: ChatRoom;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'message_type', default: 'text' })
  messageType: string; // 'text', 'schedule_change', 'system'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>; // For schedule changes: { newTime: '14:00', reason: '...' }

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## 6. Migration Strategy

### 6.1 Migration Order

1. **Migration 1: Add enums** - Create new enum types
2. **Migration 2: Update users table** - Add position_level and manager_id
3. **Migration 3: Update bookings table** - Add approval_type and is_business_trip
4. **Migration 4: Create booking_approvals table**
5. **Migration 5: Create chat_rooms table**
6. **Migration 6: Create chat_messages table**
7. **Migration 7: Update notifications** - Add new notification types

### 6.2 Generate Migrations

```bash
# After updating entities, generate migrations
cd /Users/liam/Workspaces/msm-car-booking/backend

# Generate migration for all changes
pnpm typeorm migration:generate src/database/migrations/AddApprovalWorkflowAndChat
```

### 6.3 Migration Files

Example migration file structure:

```typescript
// src/database/migrations/[timestamp]-AddApprovalWorkflowAndChat.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovalWorkflowAndChat1706900000000 implements MigrationInterface {
  name = 'AddApprovalWorkflowAndChat1706900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create new enum types
    await queryRunner.query(`
      CREATE TYPE "position_level_enum" AS ENUM (
        'STAFF', 'SENIOR', 'TEAM_LEAD', 'MGR', 'SR_MGR', 'DIRECTOR', 'VP', 'C_LEVEL'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "approval_status_enum" AS ENUM (
        'PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED', 'EXPIRED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "approval_type_enum" AS ENUM (
        'MANAGER_APPROVAL', 'CC_ONLY', 'AUTO_APPROVED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "chat_room_status_enum" AS ENUM (
        'ACTIVE', 'ARCHIVED', 'CLOSED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "message_status_enum" AS ENUM (
        'SENT', 'DELIVERED', 'READ'
      )
    `);

    // 2. Update users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "position_level" "position_level_enum" DEFAULT 'STAFF',
      ADD COLUMN "manager_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_manager"
      FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // 3. Update booking_status enum to include PENDING_APPROVAL
    await queryRunner.query(`
      ALTER TYPE "booking_status_enum" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL' BEFORE 'PENDING'
    `);

    // 4. Update bookings table
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "approval_type" "approval_type_enum",
      ADD COLUMN "is_business_trip" boolean DEFAULT true
    `);

    // 5. Create booking_approvals table
    await queryRunner.query(`
      CREATE TABLE "booking_approvals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
        "approver_id" uuid NOT NULL REFERENCES "users"("id"),
        "requester_id" uuid NOT NULL REFERENCES "users"("id"),
        "approval_type" "approval_type_enum" NOT NULL,
        "status" "approval_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes" text,
        "reminder_count" integer DEFAULT 0,
        "last_reminder_at" timestamptz,
        "responded_at" timestamptz,
        "expires_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_booking_approvals_booking" ON "booking_approvals" ("booking_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_booking_approvals_approver_status" ON "booking_approvals" ("approver_id", "status")
    `);

    // 6. Create chat_rooms table
    await queryRunner.query(`
      CREATE TABLE "chat_rooms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid UNIQUE NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
        "employee_id" uuid NOT NULL REFERENCES "users"("id"),
        "driver_id" uuid NOT NULL REFERENCES "users"("id"),
        "status" "chat_room_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "last_message_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_rooms_employee" ON "chat_rooms" ("employee_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_rooms_driver" ON "chat_rooms" ("driver_id")
    `);

    // 7. Create chat_messages table
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "chat_room_id" uuid NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
        "sender_id" uuid NOT NULL REFERENCES "users"("id"),
        "content" text NOT NULL,
        "message_type" varchar DEFAULT 'text',
        "metadata" jsonb,
        "status" "message_status_enum" NOT NULL DEFAULT 'SENT',
        "read_at" timestamptz,
        "created_at" timestamptz DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_messages_room_created" ON "chat_messages" ("chat_room_id", "created_at" DESC)
    `);

    // 8. Update notification_type enum
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'APPROVAL_REQUIRED';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'APPROVAL_REMINDER';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_APPROVED';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_REJECTED';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_CC_NOTIFICATION';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'NEW_CHAT_MESSAGE';
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'SCHEDULE_CHANGE_ALERT';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_rooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_approvals"`);

    // Remove columns from bookings
    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "approval_type",
      DROP COLUMN IF EXISTS "is_business_trip"
    `);

    // Remove columns from users
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "FK_users_manager",
      DROP COLUMN IF EXISTS "manager_id",
      DROP COLUMN IF EXISTS "position_level"
    `);

    // Drop enum types (note: cannot remove enum values in PostgreSQL)
    await queryRunner.query(`DROP TYPE IF EXISTS "message_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_room_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "position_level_enum"`);
  }
}
```

---

## 7. Seed Data Updates

### 7.1 Update User Seeds

File: `/backend/src/database/seeds/02-users.seed.ts`

Add position_level and manager relationships to existing users:

```typescript
// Example seed data updates
const users = [
  // Management level users (auto-approve)
  {
    email: 'director@company.com',
    fullName: 'Director User',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.DIRECTOR,
    managerId: null, // No manager
  },
  // Manager (can approve)
  {
    email: 'manager@company.com',
    fullName: 'Department Manager',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.MGR,
    managerId: '<director_id>', // Reports to director
  },
  // SIC Employee (DAILY - CC only)
  {
    email: 'sic.employee@company.com',
    fullName: 'SIC Employee',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.DAILY,
    positionLevel: PositionLevel.STAFF,
    managerId: '<manager_id>', // Reports to manager
  },
  // Regular Employee (SOMETIMES - needs approval)
  {
    email: 'employee@company.com',
    fullName: 'Regular Employee',
    role: UserRole.EMPLOYEE,
    userSegment: UserSegment.SOMETIMES,
    positionLevel: PositionLevel.STAFF,
    managerId: '<manager_id>', // Reports to manager
  },
];
```

---

## Entity Relationship Diagram Update

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        user_role role
        user_segment user_segment
        position_level position_level "NEW"
        uuid manager_id FK "NEW"
        uuid department_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    bookings {
        uuid id PK
        varchar booking_code UK
        uuid requester_id FK
        uuid department_id FK
        booking_type booking_type
        booking_status status
        approval_type approval_type "NEW"
        boolean is_business_trip "NEW"
        date scheduled_date
        time scheduled_time
        date end_date
        text purpose
        int passenger_count
        text notes
        uuid assigned_vehicle_id FK
        uuid assigned_driver_id FK
        timestamp created_at
        timestamp updated_at
    }

    booking_approvals {
        uuid id PK "NEW TABLE"
        uuid booking_id FK
        uuid approver_id FK
        uuid requester_id FK
        approval_type approval_type
        approval_status status
        text notes
        int reminder_count
        timestamp last_reminder_at
        timestamp responded_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    chat_rooms {
        uuid id PK "NEW TABLE"
        uuid booking_id FK UK
        uuid employee_id FK
        uuid driver_id FK
        chat_room_status status
        timestamp last_message_at
        timestamp created_at
        timestamp updated_at
    }

    chat_messages {
        uuid id PK "NEW TABLE"
        uuid chat_room_id FK
        uuid sender_id FK
        text content
        varchar message_type
        jsonb metadata
        message_status status
        timestamp read_at
        timestamp created_at
    }

    users ||--o{ users : "manager_of"
    users ||--o{ bookings : "requests"
    users ||--o{ booking_approvals : "approves"
    users ||--o{ booking_approvals : "requests_approval"
    users ||--o{ chat_rooms : "employee_in"
    users ||--o{ chat_rooms : "driver_in"
    users ||--o{ chat_messages : "sends"
    
    bookings ||--o| booking_approvals : "requires"
    bookings ||--o| chat_rooms : "has_chat"
    
    chat_rooms ||--o{ chat_messages : "contains"
```

---

## Checklist

- [ ] Add new enums to `/backend/src/common/enums/index.ts`
- [ ] Update User entity with position_level and manager_id
- [ ] Update Booking entity with approval_type and is_business_trip
- [ ] Create BookingApproval entity
- [ ] Create ChatRoom entity
- [ ] Create ChatMessage entity
- [ ] Generate TypeORM migration
- [ ] Run migration
- [ ] Update seed scripts with new fields
- [ ] Verify all indexes are created
- [ ] Update database-models.mdx documentation
