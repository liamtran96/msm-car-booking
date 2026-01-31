-- Migration: 007_create_functions_triggers
-- Description: Create helper functions and triggers
-- Author: System
-- Date: 2026-01-30

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_km_quotas_updated_at
    BEFORE UPDATE ON km_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pickup_points_updated_at
    BEFORE UPDATE ON pickup_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_configs_updated_at
    BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
DECLARE
    date_part VARCHAR(8);
    seq_num INTEGER;
    new_code VARCHAR(20);
BEGIN
    -- Format: MSM-YYYYMMDD-XXXX
    date_part := TO_CHAR(NEW.scheduled_date, 'YYYYMMDD');

    -- Get sequence number for this date
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(booking_code FROM 14 FOR 4) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM bookings
    WHERE booking_code LIKE 'MSM-' || date_part || '-%';

    new_code := 'MSM-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.booking_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_generate_code
    BEFORE INSERT ON bookings
    FOR EACH ROW
    WHEN (NEW.booking_code IS NULL)
    EXECUTE FUNCTION generate_booking_code();

-- Function to update vehicle odometer after trip completion
CREATE OR REPLACE FUNCTION update_vehicle_odometer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reading_type = 'TRIP_END' THEN
        UPDATE vehicles
        SET current_odometer_km = NEW.reading_km
        WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_odometer_update_vehicle
    AFTER INSERT ON odometer_logs
    FOR EACH ROW EXECUTE FUNCTION update_vehicle_odometer();

-- Function to update km_quotas used_km
CREATE OR REPLACE FUNCTION update_km_quota_usage()
RETURNS TRIGGER AS $$
DECLARE
    trip_km DECIMAL(10, 2);
    trip_month DATE;
BEGIN
    -- Only process completed bookings
    IF NEW.status = 'COMPLETED' AND NEW.actual_km IS NOT NULL AND NEW.assigned_vehicle_id IS NOT NULL THEN
        trip_km := NEW.actual_km;
        trip_month := DATE_TRUNC('month', NEW.scheduled_date);

        -- Update the quota for this vehicle and month
        UPDATE km_quotas
        SET used_km = used_km + trip_km
        WHERE vehicle_id = NEW.assigned_vehicle_id
          AND month = trip_month;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_update_quota
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_km_quota_usage();

-- Function to check km quota and recommend external dispatch
CREATE OR REPLACE FUNCTION check_km_quota(
    p_vehicle_id UUID,
    p_estimated_km DECIMAL
) RETURNS TABLE (
    is_within_quota BOOLEAN,
    remaining_km DECIMAL,
    quota_with_tolerance DECIMAL,
    recommendation TEXT
) AS $$
DECLARE
    v_quota RECORD;
    v_current_month DATE;
BEGIN
    v_current_month := DATE_TRUNC('month', CURRENT_DATE);

    SELECT kq.quota_km, kq.tolerance_km, kq.used_km
    INTO v_quota
    FROM km_quotas kq
    WHERE kq.vehicle_id = p_vehicle_id
      AND kq.month = v_current_month;

    IF v_quota IS NULL THEN
        RETURN QUERY SELECT
            TRUE,
            NULL::DECIMAL,
            NULL::DECIMAL,
            'No quota defined for this vehicle/month'::TEXT;
        RETURN;
    END IF;

    quota_with_tolerance := v_quota.quota_km + COALESCE(v_quota.tolerance_km, 0);
    remaining_km := quota_with_tolerance - v_quota.used_km;
    is_within_quota := (v_quota.used_km + p_estimated_km) <= quota_with_tolerance;

    IF is_within_quota THEN
        recommendation := 'Within quota - proceed with internal vehicle';
    ELSE
        recommendation := 'Exceeds quota - recommend external dispatch (Grab/Taxi)';
    END IF;

    RETURN QUERY SELECT is_within_quota, remaining_km, quota_with_tolerance, recommendation;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_km_quota IS 'Check if estimated trip distance is within vehicle km quota';
