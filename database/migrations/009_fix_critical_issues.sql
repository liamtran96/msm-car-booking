-- Migration: 009_fix_critical_issues
-- Description: Fix critical issues identified in database review
-- Author: Database Architect Review
-- Date: 2026-01-30

-- ============================================================================
-- FIX 1: Booking Code Race Condition
-- Problem: Concurrent inserts could generate duplicate booking codes
-- Solution: Use a sequence table with row-level locking
-- ============================================================================

-- Create sequence tracking table
CREATE TABLE booking_sequences (
    date_key DATE PRIMARY KEY,
    last_seq INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE booking_sequences IS 'Tracks booking code sequences per date to prevent race conditions';

-- Replace the booking code generation function with a safe version
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
DECLARE
    date_part VARCHAR(8);
    seq_num INTEGER;
    new_code VARCHAR(20);
BEGIN
    -- Format: MSM-YYYYMMDD-XXXX
    date_part := TO_CHAR(NEW.scheduled_date, 'YYYYMMDD');

    -- Insert or update with row-level lock (UPSERT pattern)
    INSERT INTO booking_sequences (date_key, last_seq)
    VALUES (NEW.scheduled_date, 1)
    ON CONFLICT (date_key) DO UPDATE
        SET last_seq = booking_sequences.last_seq + 1
    RETURNING last_seq INTO seq_num;

    new_code := 'MSM-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.booking_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX 2: Booking Status State Machine Validation
-- Problem: Invalid status transitions were allowed (e.g., CANCELLED -> IN_PROGRESS)
-- Solution: Add trigger to validate state transitions
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    valid_transitions JSONB := '{
        "PENDING": ["CONFIRMED", "CANCELLED", "REDIRECTED_EXTERNAL"],
        "CONFIRMED": ["ASSIGNED", "CANCELLED", "REDIRECTED_EXTERNAL"],
        "ASSIGNED": ["IN_PROGRESS", "CANCELLED", "REDIRECTED_EXTERNAL"],
        "IN_PROGRESS": ["COMPLETED", "CANCELLED"],
        "COMPLETED": [],
        "CANCELLED": [],
        "REDIRECTED_EXTERNAL": []
    }';
    allowed_statuses JSONB;
BEGIN
    -- Only validate on UPDATE when status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        allowed_statuses := valid_transitions->OLD.status::TEXT;

        IF allowed_statuses IS NULL OR NOT (allowed_statuses ? NEW.status::TEXT) THEN
            RAISE EXCEPTION 'Invalid booking status transition: % -> %. Allowed transitions from % are: %',
                OLD.status, NEW.status, OLD.status, allowed_statuses;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_status_validation
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_status_transition();

COMMENT ON FUNCTION validate_booking_status_transition IS 'Enforces valid booking status state machine transitions';

-- ============================================================================
-- FIX 3: KM Quota Update Trigger Bug
-- Problem: Quota not updated if actual_km is set after status changes to COMPLETED
-- Solution: Check both status change AND actual_km update scenarios
-- ============================================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS trg_booking_update_quota ON bookings;

-- Create improved function
CREATE OR REPLACE FUNCTION update_km_quota_usage()
RETURNS TRIGGER AS $$
DECLARE
    trip_km DECIMAL(10, 2);
    trip_month DATE;
    old_km DECIMAL(10, 2);
BEGIN
    -- Case 1: Booking just became COMPLETED with actual_km set
    IF NEW.status = 'COMPLETED' AND NEW.actual_km IS NOT NULL AND NEW.assigned_vehicle_id IS NOT NULL THEN

        -- Determine if this is a new completion or an update to actual_km
        IF OLD.status != 'COMPLETED' THEN
            -- New completion - add the full amount
            trip_km := NEW.actual_km;
        ELSIF OLD.actual_km IS DISTINCT FROM NEW.actual_km THEN
            -- Updating actual_km on already-completed booking - add the difference
            old_km := COALESCE(OLD.actual_km, 0);
            trip_km := NEW.actual_km - old_km;
        ELSE
            -- No change needed
            RETURN NEW;
        END IF;

        trip_month := DATE_TRUNC('month', NEW.scheduled_date);

        -- Update the quota for this vehicle and month
        UPDATE km_quotas
        SET used_km = used_km + trip_km
        WHERE vehicle_id = NEW.assigned_vehicle_id
          AND month = trip_month;

        -- Log if no quota record exists (for debugging)
        IF NOT FOUND THEN
            RAISE WARNING 'No km_quota record found for vehicle % in month %',
                NEW.assigned_vehicle_id, trip_month;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger with broader conditions
CREATE TRIGGER trg_booking_update_quota
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT FROM NEW.status
        OR (NEW.status = 'COMPLETED' AND OLD.actual_km IS DISTINCT FROM NEW.actual_km)
    )
    EXECUTE FUNCTION update_km_quota_usage();

COMMENT ON FUNCTION update_km_quota_usage IS 'Updates km_quotas.used_km when booking is completed or actual_km is updated';

-- ============================================================================
-- FIX 4: Audit Trail for Critical Tables
-- Problem: No record of who changed what and when
-- Solution: Add comprehensive audit logging
-- ============================================================================

-- Create audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],  -- List of fields that changed (for UPDATE)
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_user_name TEXT DEFAULT current_user,
    client_ip INET DEFAULT inet_client_addr()
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_action ON audit_logs(table_name, action);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for critical database changes';

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
    changed_fields TEXT[] := '{}';
    key TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_row := to_jsonb(OLD);
        INSERT INTO audit_logs (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', old_row);
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);

        -- Find changed fields
        FOR key IN SELECT jsonb_object_keys(new_row)
        LOOP
            IF old_row->key IS DISTINCT FROM new_row->key THEN
                changed_fields := array_append(changed_fields, key);
            END IF;
        END LOOP;

        -- Only log if something actually changed (excluding updated_at)
        IF array_length(changed_fields, 1) > 0 AND
           NOT (array_length(changed_fields, 1) = 1 AND changed_fields[1] = 'updated_at') THEN
            INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_fields)
            VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_row, new_row, changed_fields);
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        new_row := to_jsonb(NEW);
        INSERT INTO audit_logs (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', new_row);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER trg_audit_bookings
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_vehicles
    AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_km_quotas
    AFTER INSERT OR UPDATE OR DELETE ON km_quotas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- FIX 5: Additional Indexes for Performance
-- Problem: Missing indexes for common query patterns
-- Solution: Add covering indexes for availability and reporting queries
-- ============================================================================

-- Driver availability queries (find available drivers for a date range)
CREATE INDEX idx_bookings_driver_availability
    ON bookings(assigned_driver_id, scheduled_date, scheduled_time)
    WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'REDIRECTED_EXTERNAL');

-- Vehicle availability queries
CREATE INDEX idx_bookings_vehicle_availability
    ON bookings(assigned_vehicle_id, scheduled_date, scheduled_time)
    WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'REDIRECTED_EXTERNAL');

-- Covering index for km quota lookups (includes all needed columns)
DROP INDEX IF EXISTS idx_km_quotas_vehicle_month;
CREATE INDEX idx_km_quotas_lookup
    ON km_quotas(vehicle_id, month)
    INCLUDE (quota_km, tolerance_km, used_km);

-- Active users by role (for assignment dropdowns)
CREATE INDEX idx_users_active_role
    ON users(role, full_name)
    WHERE is_active = true;

-- Active vehicles by status and type (for booking UI)
CREATE INDEX idx_vehicles_active_available
    ON vehicles(vehicle_type, capacity)
    WHERE is_active = true AND status = 'AVAILABLE';

COMMENT ON INDEX idx_bookings_driver_availability IS 'Optimizes driver availability lookups';
COMMENT ON INDEX idx_bookings_vehicle_availability IS 'Optimizes vehicle availability lookups';
