-- Migration: 006_create_reporting_tables
-- Description: Create reporting and configuration tables
-- Author: System
-- Date: 2026-01-30

-- Trip Reports table (denormalized for analytics)
CREATE TABLE trip_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    trip_date DATE NOT NULL,
    start_km DECIMAL(10, 2),
    end_km DECIMAL(10, 2),
    total_km DECIMAL(10, 2),
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    cost_estimate DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_km_values CHECK (
        (start_km IS NULL AND end_km IS NULL) OR
        (start_km IS NOT NULL AND end_km IS NOT NULL AND end_km >= start_km)
    )
);

CREATE INDEX idx_trip_reports_booking ON trip_reports(booking_id);
CREATE INDEX idx_trip_reports_vehicle ON trip_reports(vehicle_id);
CREATE INDEX idx_trip_reports_driver ON trip_reports(driver_id);
CREATE INDEX idx_trip_reports_requester ON trip_reports(requester_id);
CREATE INDEX idx_trip_reports_department ON trip_reports(department_id);
CREATE INDEX idx_trip_reports_date ON trip_reports(trip_date);
CREATE INDEX idx_trip_reports_date_dept ON trip_reports(trip_date, department_id);

COMMENT ON TABLE trip_reports IS 'Denormalized trip data for reporting and analytics';
COMMENT ON COLUMN trip_reports.total_km IS 'Total distance traveled (end_km - start_km)';
COMMENT ON COLUMN trip_reports.cost_estimate IS 'Estimated cost based on distance and rates';

-- System Configs table (key-value configuration storage)
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_configs_key ON system_configs(key);

COMMENT ON TABLE system_configs IS 'Key-value configuration storage using JSONB';
COMMENT ON COLUMN system_configs.value IS 'Configuration value stored as JSONB for flexibility';

-- Insert default system configurations
INSERT INTO system_configs (key, value, description) VALUES
    ('km_tolerance_limit', '50', 'Default kilometer tolerance limit before external dispatch'),
    ('auto_dispatch_enabled', 'true', 'Enable automatic dispatch to external providers'),
    ('notification_channels', '["APP_PUSH", "AUTO_CALL"]', 'Enabled notification channels'),
    ('booking_advance_days', '30', 'Maximum days in advance for booking'),
    ('default_cost_per_km', '5000', 'Default cost per kilometer in VND');
