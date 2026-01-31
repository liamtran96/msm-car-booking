-- Migration: 013_driver_app_features
-- Description: Add missing features for Driver App functionality
-- Author: System
-- Date: 2026-01-31

-- ============================================================================
-- FEATURE 1: Driver Task Response
-- Track driver acceptance/rejection of assigned trips
-- ============================================================================

CREATE TYPE driver_response_status AS ENUM (
    'PENDING',      -- Awaiting driver response
    'ACCEPTED',     -- Driver accepted the trip
    'REJECTED',     -- Driver rejected (with reason)
    'NO_RESPONSE'   -- Driver didn't respond in time
);

-- Add driver response tracking to bookings
ALTER TABLE bookings
    ADD COLUMN driver_response driver_response_status DEFAULT 'PENDING',
    ADD COLUMN driver_response_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN driver_rejection_reason TEXT;

CREATE INDEX idx_bookings_driver_response ON bookings(driver_response)
    WHERE status = 'ASSIGNED';

COMMENT ON COLUMN bookings.driver_response IS 'Driver acceptance status for assigned trip';
COMMENT ON COLUMN bookings.driver_response_at IS 'Timestamp when driver responded';
COMMENT ON COLUMN bookings.driver_rejection_reason IS 'Reason if driver rejected the assignment';

-- ============================================================================
-- FEATURE 2: Trip Expenses
-- Record expenses incurred during trips (tolls, parking, fuel, etc.)
-- ============================================================================

CREATE TYPE expense_type AS ENUM (
    'TOLL',         -- Highway/road toll
    'PARKING',      -- Parking fees
    'FUEL',         -- Fuel cost
    'REPAIR',       -- Emergency repair
    'OTHER'         -- Other expenses
);

CREATE TABLE trip_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    expense_type expense_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    receipt_url VARCHAR(500),           -- URL to uploaded receipt image
    recorded_by UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT NULL,   -- NULL = pending, true = approved, false = rejected
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_expenses_booking ON trip_expenses(booking_id);
CREATE INDEX idx_trip_expenses_type ON trip_expenses(expense_type);
CREATE INDEX idx_trip_expenses_pending ON trip_expenses(is_approved) WHERE is_approved IS NULL;

COMMENT ON TABLE trip_expenses IS 'Expenses recorded by drivers during trips';
COMMENT ON COLUMN trip_expenses.receipt_url IS 'URL to uploaded receipt image for verification';
COMMENT ON COLUMN trip_expenses.is_approved IS 'Approval status: NULL=pending, true=approved, false=rejected';

-- ============================================================================
-- FEATURE 3: Trip Timeline Events
-- Track key events during trip execution for driver app
-- ============================================================================

CREATE TYPE trip_event_type AS ENUM (
    'DRIVER_ACCEPTED',      -- Driver accepted assignment
    'DRIVER_REJECTED',      -- Driver rejected assignment
    'TRIP_STARTED',         -- Trip started
    'ARRIVED_PICKUP',       -- Arrived at pickup point
    'PASSENGER_BOARDED',    -- Passenger got in vehicle
    'ARRIVED_STOP',         -- Arrived at intermediate stop
    'ARRIVED_DESTINATION',  -- Arrived at final destination
    'TRIP_COMPLETED',       -- Trip completed
    'ODOMETER_RECORDED',    -- Odometer reading recorded
    'EXPENSE_ADDED',        -- Expense recorded
    'AUTO_CALL_TRIGGERED'   -- Auto-call was triggered
);

CREATE TABLE trip_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type trip_event_type NOT NULL,
    event_data JSONB,                   -- Additional event-specific data
    latitude DECIMAL(10, 8),            -- GPS location when event occurred
    longitude DECIMAL(11, 8),
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_events_booking ON trip_events(booking_id, recorded_at);
CREATE INDEX idx_trip_events_type ON trip_events(event_type);

COMMENT ON TABLE trip_events IS 'Timeline of events during trip execution';
COMMENT ON COLUMN trip_events.event_data IS 'JSON data specific to event type (e.g., stop_id for ARRIVED_STOP)';

-- ============================================================================
-- FEATURE 4: Driver Statistics View
-- For driver app KM summary feature
-- ============================================================================

CREATE OR REPLACE VIEW v_driver_monthly_stats AS
SELECT
    u.id AS driver_id,
    u.full_name AS driver_name,
    DATE_TRUNC('month', b.scheduled_date) AS month,
    COUNT(*) AS total_trips,
    COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed_trips,
    COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS cancelled_trips,
    COALESCE(SUM(b.actual_km) FILTER (WHERE b.status = 'COMPLETED'), 0) AS total_km,
    COALESCE(AVG(b.actual_km) FILTER (WHERE b.status = 'COMPLETED'), 0) AS avg_km_per_trip,
    COALESCE(SUM(te.amount), 0) AS total_expenses
FROM users u
LEFT JOIN bookings b ON b.assigned_driver_id = u.id
LEFT JOIN trip_expenses te ON te.booking_id = b.id AND te.is_approved = true
WHERE u.role = 'DRIVER' AND u.is_active = true
GROUP BY u.id, u.full_name, DATE_TRUNC('month', b.scheduled_date)
ORDER BY month DESC, total_km DESC;

COMMENT ON VIEW v_driver_monthly_stats IS 'Monthly statistics per driver for driver app dashboard';

-- ============================================================================
-- FEATURE 5: Update trip_reports to include expenses
-- ============================================================================

ALTER TABLE trip_reports
    ADD COLUMN total_expenses DECIMAL(12, 2) DEFAULT 0,
    ADD COLUMN expense_breakdown JSONB;

COMMENT ON COLUMN trip_reports.total_expenses IS 'Total approved expenses for the trip';
COMMENT ON COLUMN trip_reports.expense_breakdown IS 'Breakdown of expenses by type';

-- ============================================================================
-- Trigger: Auto-populate trip_reports.total_expenses on trip completion
-- ============================================================================

CREATE OR REPLACE FUNCTION update_trip_report_expenses()
RETURNS TRIGGER AS $$
BEGIN
    -- Update trip report with expense totals when expenses are approved
    UPDATE trip_reports tr
    SET
        total_expenses = (
            SELECT COALESCE(SUM(amount), 0)
            FROM trip_expenses
            WHERE booking_id = NEW.booking_id AND is_approved = true
        ),
        expense_breakdown = (
            SELECT jsonb_object_agg(expense_type::TEXT, total)
            FROM (
                SELECT expense_type, SUM(amount) as total
                FROM trip_expenses
                WHERE booking_id = NEW.booking_id AND is_approved = true
                GROUP BY expense_type
            ) sub
        )
    WHERE tr.booking_id = NEW.booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_trip_report_expenses
    AFTER UPDATE OF is_approved ON trip_expenses
    FOR EACH ROW
    WHEN (NEW.is_approved = true)
    EXECUTE FUNCTION update_trip_report_expenses();
