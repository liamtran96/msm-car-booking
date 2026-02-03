import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApprovalWorkflowAndChat1738506000000 implements MigrationInterface {
  name = 'AddApprovalWorkflowAndChat1738506000000';

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

    // 2. Update users table - add position_level and manager_id
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "position_level" "position_level_enum" DEFAULT 'STAFF'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
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

    // 4. Update bookings table - add approval_type and is_business_trip
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "approval_type" "approval_type_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "is_business_trip" boolean DEFAULT true
    `);

    // 5. Create booking_approvals table
    await queryRunner.query(`
      CREATE TABLE "booking_approvals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "approver_id" uuid NOT NULL,
        "requester_id" uuid NOT NULL,
        "approval_type" "approval_type_enum" NOT NULL,
        "status" "approval_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes" text,
        "reminder_count" integer DEFAULT 0,
        "last_reminder_at" timestamptz,
        "responded_at" timestamptz,
        "expires_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now(),
        CONSTRAINT "FK_booking_approvals_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_approvals_approver" FOREIGN KEY ("approver_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_booking_approvals_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_booking_approvals_booking" ON "booking_approvals" ("booking_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_booking_approvals_approver_status" ON "booking_approvals" ("approver_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_booking_approvals_requester" ON "booking_approvals" ("requester_id")
    `);

    // 6. Create chat_rooms table
    await queryRunner.query(`
      CREATE TABLE "chat_rooms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" uuid UNIQUE NOT NULL,
        "employee_id" uuid NOT NULL,
        "driver_id" uuid NOT NULL,
        "status" "chat_room_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "last_message_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        "updated_at" timestamptz DEFAULT now(),
        CONSTRAINT "FK_chat_rooms_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chat_rooms_employee" FOREIGN KEY ("employee_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_chat_rooms_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_rooms_employee" ON "chat_rooms" ("employee_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_rooms_driver" ON "chat_rooms" ("driver_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_rooms_status" ON "chat_rooms" ("status")
    `);

    // 7. Create chat_messages table
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "chat_room_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "message_type" varchar DEFAULT 'text',
        "metadata" jsonb,
        "status" "message_status_enum" NOT NULL DEFAULT 'SENT',
        "read_at" timestamptz,
        "created_at" timestamptz DEFAULT now(),
        CONSTRAINT "FK_chat_messages_room" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chat_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_messages_room_created" ON "chat_messages" ("chat_room_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_chat_messages_sender" ON "chat_messages" ("sender_id")
    `);

    // 8. Update notification_type enum with new values
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'APPROVAL_REQUIRED'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'APPROVAL_REMINDER'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_APPROVED'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_REJECTED'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'BOOKING_CC_NOTIFICATION'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'NEW_CHAT_MESSAGE'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'SCHEDULE_CHANGE_ALERT'
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
      DROP CONSTRAINT IF EXISTS "FK_users_manager"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "manager_id",
      DROP COLUMN IF EXISTS "position_level"
    `);

    // Drop enum types
    // Note: Cannot remove enum values in PostgreSQL, so we drop the entire types
    await queryRunner.query(`DROP TYPE IF EXISTS "message_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_room_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "position_level_enum"`);

    // Note: Cannot remove values from booking_status_enum or notification_type_enum
    // They will remain but be unused
  }
}
