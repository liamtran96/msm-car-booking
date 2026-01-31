-- Migration: 003_create_booking_tables
-- Description: Create booking and trip-related tables
-- Author: System
-- Date: 2026-01-30

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    booking_type booking_type NOT NULL,
    status booking_status NOT NULL DEFAULT 'PENDING',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    end_date DATE,
    purpose TEXT,
    passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),
    notes TEXT,
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    estimated_km DECIMAL(10, 2),
    actual_km DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_end_date CHECK (end_date IS NULL OR end_date >= scheduled_date)
);

CREATE INDEX idx_bookings_requester ON bookings(requester_id);
CREATE INDEX idx_bookings_department ON bookings(department_id);
CREATE INDEX idx_bookings_vehicle ON bookings(assigned_vehicle_id);
CREATE INDEX idx_bookings_driver ON bookings(assigned_driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_date, scheduled_time);
CREATE INDEX idx_bookings_code ON bookings(booking_code);

COMMENT ON TABLE bookings IS 'Main booking/reservation records';
COMMENT ON COLUMN bookings.booking_code IS 'Human-readable booking reference code';
COMMENT ON COLUMN bookings.booking_type IS 'SINGLE_TRIP, MULTI_STOP, or BLOCK_SCHEDULE';
COMMENT ON COLUMN bookings.end_date IS 'End date for block schedule bookings';

-- Trip Stops table
CREATE TABLE trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    pickup_point_id UUID REFERENCES pickup_points(id) ON DELETE SET NULL,
    custom_address VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    stop_order INTEGER NOT NULL CHECK (stop_order >= 0),
    stop_type stop_type NOT NULL,
    scheduled_time TIME,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_location CHECK (
        pickup_point_id IS NOT NULL OR custom_address IS NOT NULL
    )
);

CREATE INDEX idx_trip_stops_booking ON trip_stops(booking_id);
CREATE INDEX idx_trip_stops_pickup_point ON trip_stops(pickup_point_id);
CREATE INDEX idx_trip_stops_order ON trip_stops(booking_id, stop_order);

COMMENT ON TABLE trip_stops IS 'Individual stops within a booking (multi-stop support)';
COMMENT ON COLUMN trip_stops.stop_order IS 'Order of stop in trip sequence (0-indexed)';
COMMENT ON COLUMN trip_stops.custom_address IS 'Custom address when not using predefined pickup point';
