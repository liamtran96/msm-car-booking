import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add indexes and constraints for User Module
 *
 * This migration adds critical performance indexes and data integrity constraints
 * for the users and driver_shifts tables.
 *
 * Changes:
 * 1. Add performance indexes for users table (role, is_active, search, etc.)
 * 2. Add performance indexes for driver_shifts table (date, status, availability)
 * 3. Fix users.department_id foreign key to use ON DELETE SET NULL
 * 4. Add time validation constraint for driver shifts
 * 5. Add status transition trigger for shift state machine
 * 6. Enable pg_trgm extension for full-text search
 * 7. Add updated_at triggers for automatic timestamp updates
 */
export class AddUserModuleIndexesAndConstraints1738394400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. Enable pg_trgm extension for full-text search
    // ========================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // ========================================
    // 2. USERS TABLE - Performance Indexes
    // ========================================

    // Index for role filtering (used in findDrivers, authorization checks)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");`,
    );

    // Index for active user filtering (used in almost every query)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users"("is_active");`,
    );

    // Composite index for common filter combinations (role + active status)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_role_active" ON "users"("role", "is_active");`,
    );

    // Index for user segment filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_user_segment" ON "users"("user_segment") WHERE "user_segment" IS NOT NULL;`,
    );

    // Index for department filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_department_id" ON "users"("department_id") WHERE "department_id" IS NOT NULL;`,
    );

    // GIN indexes for full-text search on name and email (using pg_trgm)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_fullname_trgm" ON "users" USING gin("full_name" gin_trgm_ops);`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_email_trgm" ON "users" USING gin("email" gin_trgm_ops);`,
    );

    // Index for pagination ordering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_users_created_at_desc" ON "users"("created_at" DESC);`,
    );

    // ========================================
    // 3. DRIVER_SHIFTS TABLE - Performance Indexes
    // ========================================

    // Index for date range queries (used in findAll with date filters)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_shifts_shift_date" ON "driver_shifts"("shift_date");`,
    );

    // Index for status filtering (used in findAvailableDriversForTime)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_shifts_status" ON "driver_shifts"("status");`,
    );

    // Composite index for date + status filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_shifts_date_status" ON "driver_shifts"("shift_date", "status");`,
    );

    // Composite index for availability queries (critical for performance)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_shifts_availability" ON "driver_shifts"("shift_date", "status", "start_time", "end_time") WHERE "status" IN ('SCHEDULED', 'ACTIVE');`,
    );

    // Index for ordering by date and time
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_driver_shifts_date_time_asc" ON "driver_shifts"("shift_date" ASC, "start_time" ASC);`,
    );

    // ========================================
    // 4. Fix Foreign Key Constraints
    // ========================================

    // Drop existing foreign key constraint on users.department_id (if exists)
    // Note: TypeORM auto-generates FK names, we need to find the actual constraint name
    const departmentFkQuery = (await queryRunner.query(
      `SELECT constraint_name
       FROM information_schema.table_constraints
       WHERE table_name = 'users'
       AND constraint_type = 'FOREIGN KEY'
       AND constraint_name LIKE '%department%';`,
    )) as Array<{ constraint_name: string }>;

    if (departmentFkQuery.length > 0) {
      const fkName = departmentFkQuery[0]?.constraint_name;
      await queryRunner.query(
        `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "${fkName}";`,
      );
    }

    // Re-add foreign key with ON DELETE SET NULL
    await queryRunner.query(
      `ALTER TABLE "users"
       ADD CONSTRAINT "fk_users_department"
       FOREIGN KEY ("department_id")
       REFERENCES "departments"("id")
       ON DELETE SET NULL;`,
    );

    // ========================================
    // 5. Add Time Validation Constraint
    // ========================================

    await queryRunner.query(
      `ALTER TABLE "driver_shifts"
       ADD CONSTRAINT "chk_shift_time_valid"
       CHECK ("start_time" < "end_time");`,
    );

    // ========================================
    // 6. Add Status Transition Trigger
    // ========================================

    // Create function to validate shift status transitions
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_shift_status_transition()
      RETURNS TRIGGER AS $$
      BEGIN
        -- SCHEDULED → ACTIVE or ABSENT or CANCELLED
        IF OLD.status = 'SCHEDULED' THEN
          IF NEW.status NOT IN ('ACTIVE', 'ABSENT', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid transition from SCHEDULED to %. Allowed: ACTIVE, ABSENT, CANCELLED', NEW.status;
          END IF;
        END IF;

        -- ACTIVE → COMPLETED only
        IF OLD.status = 'ACTIVE' THEN
          IF NEW.status != 'COMPLETED' THEN
            RAISE EXCEPTION 'Invalid transition from ACTIVE to %. Only COMPLETED is allowed', NEW.status;
          END IF;
        END IF;

        -- COMPLETED, ABSENT, CANCELLED are terminal states
        IF OLD.status IN ('COMPLETED', 'ABSENT', 'CANCELLED') THEN
          RAISE EXCEPTION 'Cannot transition from terminal state %', OLD.status;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await queryRunner.query(`
      CREATE TRIGGER trg_validate_shift_status_transition
      BEFORE UPDATE ON driver_shifts
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION validate_shift_status_transition();
    `);

    // ========================================
    // 7. Add Updated Timestamp Triggers
    // ========================================

    // Create function to update updated_at column
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for users table
    await queryRunner.query(`
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create trigger for driver_shifts table
    await queryRunner.query(`
      CREATE TRIGGER trg_driver_shifts_updated_at
      BEFORE UPDATE ON driver_shifts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // ========================================
    // 8. Add Database Comments for Documentation
    // ========================================

    await queryRunner.query(
      `COMMENT ON TABLE users IS 'System users with role-based access control (ADMIN, PIC, GA, DRIVER, EMPLOYEE)';`,
    );

    await queryRunner.query(
      `COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (never exposed in API responses)';`,
    );

    await queryRunner.query(
      `COMMENT ON COLUMN users.is_active IS 'Soft delete flag - FALSE means user is deactivated';`,
    );

    await queryRunner.query(
      `COMMENT ON TABLE driver_shifts IS 'Driver work schedules for automated availability matching and dispatch';`,
    );

    // Note: Unique constraint name is auto-generated by TypeORM as "UQ_14e422beb6a82d071e7adc82fed"
    // We skip adding comment to avoid hardcoding the name

    await queryRunner.query(
      `COMMENT ON CONSTRAINT "chk_shift_time_valid" ON driver_shifts IS 'Ensures end_time is after start_time';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // Reverse order: Drop triggers, functions, constraints, indexes
    // ========================================

    // 1. Drop database comments (comments don't need explicit removal)

    // 2. Drop updated_at triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_driver_shifts_updated_at ON driver_shifts;`,
    );

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_users_updated_at ON users;`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column();`,
    );

    // 3. Drop status transition trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_validate_shift_status_transition ON driver_shifts;`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS validate_shift_status_transition();`,
    );

    // 4. Drop time validation constraint
    await queryRunner.query(
      `ALTER TABLE "driver_shifts" DROP CONSTRAINT IF EXISTS "chk_shift_time_valid";`,
    );

    // 5. Revert foreign key change (back to NO ACTION)
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "fk_users_department";`,
    );

    // Re-add with NO ACTION (TypeORM default)
    await queryRunner.query(
      `ALTER TABLE "users"
       ADD CONSTRAINT "fk_users_department"
       FOREIGN KEY ("department_id")
       REFERENCES "departments"("id");`,
    );

    // 6. Drop driver_shifts indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_driver_shifts_date_time_asc";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_driver_shifts_availability";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_driver_shifts_date_status";`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_driver_shifts_status";`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_driver_shifts_shift_date";`,
    );

    // 7. Drop users indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_users_created_at_desc";`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email_trgm";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_fullname_trgm";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_department_id";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_user_segment";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role_active";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_is_active";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role";`);

    // Note: We don't drop pg_trgm extension as it might be used by other parts of the system
    // await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }
}
