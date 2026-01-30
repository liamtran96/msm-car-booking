-- Migration: 004_create_tracking_tables
-- Description: Create GPS tracking and odometer log tables
-- Author: System
-- Date: 2026-01-30

-- GPS Locations table (time-series data)
CREATE TABLE gps_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed_kmh DECIMAL(6, 2),
    heading DECIMAL(5, 2) CHECK (heading IS NULL OR (heading >= 0 AND heading < 360)),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Primary index for time-series queries (vehicle + time)
CREATE INDEX idx_gps_locations_vehicle_time ON gps_locations(vehicle_id, recorded_at DESC);

-- Index for recent location lookups
CREATE INDEX idx_gps_locations_recorded ON gps_locations(recorded_at DESC);

COMMENT ON TABLE gps_locations IS 'Real-time vehicle position tracking (time-series data)';
COMMENT ON COLUMN gps_locations.heading IS 'Direction in degrees (0-359, where 0 is North)';
COMMENT ON COLUMN gps_locations.speed_kmh IS 'Current speed in kilometers per hour';

-- Odometer Logs table
CREATE TABLE odometer_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    reading_km DECIMAL(10, 2) NOT NULL CHECK (reading_km >= 0),
    reading_type reading_type NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_odometer_logs_vehicle ON odometer_logs(vehicle_id, recorded_at DESC);
CREATE INDEX idx_odometer_logs_booking ON odometer_logs(booking_id);
CREATE INDEX idx_odometer_logs_type ON odometer_logs(reading_type);

COMMENT ON TABLE odometer_logs IS 'Vehicle odometer readings for distance tracking';
COMMENT ON COLUMN odometer_logs.reading_type IS 'TRIP_START, TRIP_END, or DAILY_CHECK';
