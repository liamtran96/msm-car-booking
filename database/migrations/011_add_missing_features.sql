-- Migration: 011_add_missing_features
-- Description: Add missing features identified in database review
-- Author: Database Architect Review
-- Date: 2026-01-30

-- ============================================================================
-- FEATURE 1: Cancellation Reasons
-- Track why bookings were cancelled for analytics and improvement
-- ============================================================================

CREATE TYPE cancellation_reason AS ENUM (
    'USER_REQUEST',           -- User cancelled their own booking
    'NO_VEHICLE_AVAILABLE',   -- No suitable vehicle available
    'NO_DRIVER_AVAILABLE',    -- No driver available
    'QUOTA_EXCEEDED',         -- KM quota exceeded (before external redirect)
    'VEHICLE_BREAKDOWN',      -- Vehicle had mechanical issue
    'SCHEDULE_CONFLICT',      -- Scheduling conflict
    'WEATHER',                -- Adverse weather conditions
    'EMERGENCY',              -- User emergency
    'DUPLICATE',              -- Duplicate booking
    'OTHER'                   -- Other reason (see notes)
);

-- Add cancellation tracking columns to bookings
ALTER TABLE bookings
    ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN cancelled_by UUID REFERENCES users(id),
    ADD COLUMN cancellation_reason cancellation_reason,
    ADD COLUMN cancellation_notes TEXT;

-- Add constraint: cancellation fields required when status is CANCELLED
ALTER TABLE bookings
    ADD CONSTRAINT chk_cancellation_required
    CHECK (
        status != 'CANCELLED'
        OR (cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL)
    );

CREATE INDEX idx_bookings_cancelled ON bookings(cancelled_at)
    WHERE status = 'CANCELLED';

COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when booking was cancelled';
COMMENT ON COLUMN bookings.cancelled_by IS 'User who cancelled the booking';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason category for cancellation';

-- ============================================================================
-- FEATURE 2: External Dispatch Records
-- Track when bookings are redirected to external providers (Grab/Taxi)
-- ============================================================================

CREATE TYPE external_provider AS ENUM (
    'GRAB',
    'GOJEK',
    'BE',
    'TAXI_MAI_LINH',
    'TAXI_VINASUN',
    'OTHER'
);

CREATE TABLE external_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider external_provider NOT NULL,
    provider_booking_id VARCHAR(100),  -- External provider's reference
    provider_driver_name VARCHAR(255),
    provider_vehicle_info VARCHAR(255),
    provider_phone VARCHAR(50),
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    dispatch_reason TEXT NOT NULL,     -- Why internal vehicle wasn't used
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_external_dispatches_booking ON external_dispatches(booking_id);
CREATE INDEX idx_external_dispatches_provider ON external_dispatches(provider);
CREATE INDEX idx_external_dispatches_date ON external_dispatches(dispatched_at);

COMMENT ON TABLE external_dispatches IS 'Records when bookings are fulfilled by external providers (Grab/Taxi)';
COMMENT ON COLUMN external_dispatches.dispatch_reason IS 'Reason for using external provider (e.g., quota exceeded, no vehicle available)';

-- ============================================================================
-- FEATURE 3: Driver Availability / Shift Management
-- Track driver schedules and availability
-- ============================================================================

CREATE TYPE shift_status AS ENUM (
    'SCHEDULED',    -- Shift is planned
    'ACTIVE',       -- Driver is currently on shift
    'COMPLETED',    -- Shift ended normally
    'ABSENT',       -- Driver was absent
    'CANCELLED'     -- Shift was cancelled
);

CREATE TABLE driver_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status shift_status NOT NULL DEFAULT 'SCHEDULED',
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shift_times CHECK (end_time > start_time),
    UNIQUE(driver_id, shift_date, start_time)
);

CREATE INDEX idx_driver_shifts_driver_date ON driver_shifts(driver_id, shift_date);
CREATE INDEX idx_driver_shifts_date_status ON driver_shifts(shift_date, status);

-- Add trigger for updated_at
CREATE TRIGGER trg_driver_shifts_updated_at
    BEFORE UPDATE ON driver_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE driver_shifts IS 'Driver work schedules and shift tracking';

-- View: Available drivers for a specific datetime
CREATE OR REPLACE VIEW v_available_drivers AS
SELECT
    u.id AS driver_id,
    u.full_name,
    u.phone,
    ds.shift_date,
    ds.start_time,
    ds.end_time
FROM users u
JOIN driver_shifts ds ON ds.driver_id = u.id
WHERE u.role = 'DRIVER'
  AND u.is_active = true
  AND ds.status IN ('SCHEDULED', 'ACTIVE')
  AND ds.shift_date >= CURRENT_DATE;

COMMENT ON VIEW v_available_drivers IS 'Drivers with scheduled/active shifts';

-- ============================================================================
-- FEATURE 4: Vehicle Maintenance Logs
-- Track maintenance history for vehicles
-- ============================================================================

CREATE TYPE maintenance_type AS ENUM (
    'SCHEDULED',        -- Regular scheduled maintenance
    'REPAIR',           -- Repair after breakdown
    'INSPECTION',       -- Safety inspection
    'TIRE_SERVICE',     -- Tire rotation/replacement
    'OIL_CHANGE',       -- Oil and filter change
    'CLEANING',         -- Interior/exterior cleaning
    'OTHER'
);

CREATE TABLE vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type maintenance_type NOT NULL,
    description TEXT NOT NULL,
    odometer_at_service DECIMAL(10, 2),
    cost DECIMAL(12, 2),
    vendor_name VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    next_service_km DECIMAL(10, 2),      -- Recommended next service at this odometer
    next_service_date DATE,              -- Recommended next service date
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id, started_at DESC);
CREATE INDEX idx_vehicle_maintenance_type ON vehicle_maintenance(maintenance_type);
CREATE INDEX idx_vehicle_maintenance_incomplete ON vehicle_maintenance(vehicle_id)
    WHERE completed_at IS NULL;

COMMENT ON TABLE vehicle_maintenance IS 'Vehicle maintenance and service history';
COMMENT ON COLUMN vehicle_maintenance.next_service_km IS 'Recommended odometer reading for next service';

-- View: Vehicles needing maintenance soon
CREATE OR REPLACE VIEW v_vehicles_maintenance_due AS
SELECT
    v.id AS vehicle_id,
    v.license_plate,
    v.brand,
    v.model,
    v.current_odometer_km,
    vm.maintenance_type AS last_maintenance_type,
    vm.completed_at AS last_maintenance_date,
    vm.next_service_km,
    vm.next_service_date,
    CASE
        WHEN vm.next_service_date <= CURRENT_DATE THEN 'OVERDUE'
        WHEN vm.next_service_date <= CURRENT_DATE + 7 THEN 'DUE_SOON'
        WHEN v.current_odometer_km >= vm.next_service_km THEN 'KM_EXCEEDED'
        ELSE 'OK'
    END AS maintenance_status
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT *
    FROM vehicle_maintenance vm2
    WHERE vm2.vehicle_id = v.id
      AND vm2.completed_at IS NOT NULL
    ORDER BY vm2.completed_at DESC
    LIMIT 1
) vm ON true
WHERE v.is_active = true;

COMMENT ON VIEW v_vehicles_maintenance_due IS 'Vehicles with upcoming or overdue maintenance';

-- ============================================================================
-- FEATURE 5: Useful Views for Reporting
-- ============================================================================

-- Daily booking summary
CREATE OR REPLACE VIEW v_daily_booking_summary AS
SELECT
    scheduled_date,
    COUNT(*) AS total_bookings,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
    COUNT(*) FILTER (WHERE status = 'REDIRECTED_EXTERNAL') AS external,
    COUNT(*) FILTER (WHERE status IN ('PENDING', 'CONFIRMED', 'ASSIGNED')) AS pending,
    COALESCE(SUM(actual_km), 0) AS total_km,
    COALESCE(AVG(actual_km), 0) AS avg_km_per_trip
FROM bookings
GROUP BY scheduled_date
ORDER BY scheduled_date DESC;

COMMENT ON VIEW v_daily_booking_summary IS 'Daily aggregated booking statistics';

-- Department usage summary (for cost allocation)
CREATE OR REPLACE VIEW v_department_usage AS
SELECT
    d.id AS department_id,
    d.name AS department_name,
    d.cost_center,
    DATE_TRUNC('month', b.scheduled_date) AS month,
    COUNT(*) AS total_trips,
    COALESCE(SUM(b.actual_km), 0) AS total_km,
    COALESCE(SUM(b.actual_km) * (
        SELECT (value::TEXT)::DECIMAL FROM system_configs WHERE key = 'default_cost_per_km'
    ), 0) AS estimated_cost
FROM departments d
LEFT JOIN bookings b ON b.department_id = d.id AND b.status = 'COMPLETED'
WHERE d.is_active = true
GROUP BY d.id, d.name, d.cost_center, DATE_TRUNC('month', b.scheduled_date)
ORDER BY month DESC, total_km DESC;

COMMENT ON VIEW v_department_usage IS 'Monthly department transportation usage for cost allocation';

-- Vehicle utilization
CREATE OR REPLACE VIEW v_vehicle_utilization AS
SELECT
    v.id AS vehicle_id,
    v.license_plate,
    v.brand || ' ' || v.model AS vehicle_name,
    DATE_TRUNC('month', b.scheduled_date) AS month,
    COUNT(*) AS trip_count,
    COALESCE(SUM(b.actual_km), 0) AS total_km,
    kq.quota_km,
    kq.used_km,
    ROUND((kq.used_km / NULLIF(kq.quota_km, 0) * 100)::NUMERIC, 1) AS quota_usage_pct
FROM vehicles v
LEFT JOIN bookings b ON b.assigned_vehicle_id = v.id
    AND b.status = 'COMPLETED'
LEFT JOIN km_quotas kq ON kq.vehicle_id = v.id
    AND kq.month = DATE_TRUNC('month', b.scheduled_date)
WHERE v.is_active = true
GROUP BY v.id, v.license_plate, v.brand, v.model,
         DATE_TRUNC('month', b.scheduled_date), kq.quota_km, kq.used_km
ORDER BY month DESC, total_km DESC;

COMMENT ON VIEW v_vehicle_utilization IS 'Monthly vehicle usage and quota utilization';
