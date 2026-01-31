-- Migration: 010_gps_partitioning
-- Description: Implement table partitioning for GPS locations (time-series data)
-- Author: Database Architect Review
-- Date: 2026-01-30
--
-- IMPORTANT: This migration recreates the gps_locations table with partitioning.
-- Run this on a fresh database or migrate existing data separately.

-- ============================================================================
-- GPS Locations Partitioning Strategy
-- Problem: GPS data grows rapidly (~17K rows/vehicle/day at 5-sec intervals)
-- Solution: Range partitioning by month with automatic partition management
-- ============================================================================

-- Drop existing table (WARNING: This will delete all data!)
-- In production, you would migrate data first
DROP TABLE IF EXISTS gps_locations CASCADE;

-- Create partitioned table
CREATE TABLE gps_locations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed_kmh DECIMAL(6, 2),
    heading DECIMAL(5, 2) CHECK (heading IS NULL OR (heading >= 0 AND heading < 360)),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, recorded_at)  -- Partition key must be in PK
) PARTITION BY RANGE (recorded_at);

-- Add foreign key (note: FK constraints work differently with partitioned tables)
-- We'll use a trigger-based approach for referential integrity
CREATE OR REPLACE FUNCTION check_vehicle_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE id = NEW.vehicle_id) THEN
        RAISE EXCEPTION 'Vehicle % does not exist', NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gps_check_vehicle
    BEFORE INSERT ON gps_locations
    FOR EACH ROW EXECUTE FUNCTION check_vehicle_exists();

-- Create indexes on the parent table (inherited by partitions)
CREATE INDEX idx_gps_vehicle_time ON gps_locations(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_recorded ON gps_locations(recorded_at DESC);

-- Create partitions for current year and next few months
-- Pattern: gps_locations_YYYY_MM

-- 2026 partitions
CREATE TABLE gps_locations_2026_01 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE gps_locations_2026_02 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE gps_locations_2026_03 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE gps_locations_2026_04 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE gps_locations_2026_05 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE gps_locations_2026_06 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Default partition for any data outside defined ranges
CREATE TABLE gps_locations_default PARTITION OF gps_locations DEFAULT;

COMMENT ON TABLE gps_locations IS 'Partitioned time-series table for GPS tracking data (monthly partitions)';

-- ============================================================================
-- Automatic Partition Management Function
-- Creates new partitions automatically before they're needed
-- ============================================================================

CREATE OR REPLACE FUNCTION create_gps_partition_if_needed(target_date DATE)
RETURNS TEXT AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := DATE_TRUNC('month', target_date);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'gps_locations_' || TO_CHAR(start_date, 'YYYY_MM');

    -- Check if partition exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF gps_locations FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        RETURN 'Created partition: ' || partition_name;
    END IF;

    RETURN 'Partition already exists: ' || partition_name;
END;
$$ LANGUAGE plpgsql;

-- Function to create partitions for the next N months
CREATE OR REPLACE FUNCTION ensure_gps_partitions(months_ahead INTEGER DEFAULT 3)
RETURNS TABLE(partition_name TEXT, status TEXT) AS $$
DECLARE
    i INTEGER;
    target_date DATE;
BEGIN
    FOR i IN 0..months_ahead LOOP
        target_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        partition_name := 'gps_locations_' || TO_CHAR(target_date, 'YYYY_MM');
        status := create_gps_partition_if_needed(target_date);
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_gps_partitions IS 'Creates GPS location partitions for upcoming months. Call monthly via cron/pg_cron.';

-- ============================================================================
-- Data Retention Policy
-- Automatically removes partitions older than retention period
-- ============================================================================

CREATE OR REPLACE FUNCTION drop_old_gps_partitions(retention_months INTEGER DEFAULT 3)
RETURNS TABLE(partition_name TEXT, status TEXT) AS $$
DECLARE
    rec RECORD;
    cutoff_date DATE;
    partition_date DATE;
BEGIN
    cutoff_date := DATE_TRUNC('month', CURRENT_DATE) - (retention_months || ' months')::INTERVAL;

    FOR rec IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_inherits i ON i.inhrelid = c.oid
        JOIN pg_class parent ON parent.oid = i.inhparent
        WHERE parent.relname = 'gps_locations'
          AND c.relname ~ '^gps_locations_[0-9]{4}_[0-9]{2}$'
          AND n.nspname = current_schema()
    LOOP
        -- Extract date from partition name (gps_locations_YYYY_MM)
        partition_date := TO_DATE(SUBSTRING(rec.relname FROM 15 FOR 7), 'YYYY_MM');

        IF partition_date < cutoff_date THEN
            EXECUTE format('DROP TABLE %I', rec.relname);
            partition_name := rec.relname;
            status := 'Dropped (older than ' || retention_months || ' months)';
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION drop_old_gps_partitions IS 'Removes GPS partitions older than retention period. Call monthly via cron/pg_cron.';

-- ============================================================================
-- Helper Views for GPS Data
-- ============================================================================

-- Latest position for each vehicle
CREATE OR REPLACE VIEW v_vehicle_latest_positions AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    latitude,
    longitude,
    speed_kmh,
    heading,
    recorded_at
FROM gps_locations
ORDER BY vehicle_id, recorded_at DESC;

COMMENT ON VIEW v_vehicle_latest_positions IS 'Most recent GPS position for each vehicle';

-- Vehicle positions in last hour (for real-time tracking UI)
CREATE OR REPLACE VIEW v_vehicle_recent_positions AS
SELECT
    g.vehicle_id,
    v.license_plate,
    g.latitude,
    g.longitude,
    g.speed_kmh,
    g.heading,
    g.recorded_at
FROM gps_locations g
JOIN vehicles v ON v.id = g.vehicle_id
WHERE g.recorded_at > NOW() - INTERVAL '1 hour'
ORDER BY g.vehicle_id, g.recorded_at DESC;

COMMENT ON VIEW v_vehicle_recent_positions IS 'GPS positions from the last hour for real-time tracking';
