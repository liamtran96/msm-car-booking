-- ============================================================================
-- MSM CAR BOOKING SYSTEM - INITIAL DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Database: PostgreSQL 16+
-- Description: Complete initial schema for enterprise vehicle management system
--
-- This schema supports:
--   - Multi-role access (Admin, PIC, GA, Driver, Employee)
--   - Vehicle fleet management with KM quota tracking
--   - Booking lifecycle with automated dispatching
--   - GPS tracking with time-series partitioning
--   - Driver app features (expenses, trip events, task responses)
--   - External provider integration (Grab, Taxi)
--   - Comprehensive audit logging
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation

-- ============================================================================
-- SECTION 2: ENUM TYPES
-- ============================================================================
-- Enums provide type safety and self-documenting code
-- PostgreSQL enums are ordered by declaration order
-- ============================================================================

-- -----------------------------------------------------------------------------
-- User & Access Control Enums
-- -----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'ADMIN',      -- Full system access, configuration, user management
    'PIC',        -- Person In Charge: dispatch operations, monitoring, booking management
    'GA',         -- General Affairs: external vehicle rental management
    'DRIVER',     -- Trip execution, odometer recording, expense tracking
    'EMPLOYEE'    -- Vehicle booking requests only
);
COMMENT ON TYPE user_role IS 'System roles defining access levels and permissions';

CREATE TYPE user_segment AS ENUM (
    'DAILY',      -- SIC users with fixed daily routes (contract employees)
    'SOMETIMES'   -- Business trippers with occasional/on-demand bookings
);
COMMENT ON TYPE user_segment IS 'User booking pattern classification for analytics';

-- -----------------------------------------------------------------------------
-- Vehicle Enums
-- -----------------------------------------------------------------------------

CREATE TYPE vehicle_type AS ENUM (
    'SEDAN',      -- Standard 4-5 passenger sedan
    'SUV',        -- Sport utility vehicle, 5-7 passengers
    'VAN',        -- Passenger van, 7-15 passengers
    'BUS'         -- Mini bus, 15+ passengers
);
COMMENT ON TYPE vehicle_type IS 'Vehicle classification by body type and capacity';

CREATE TYPE vehicle_status AS ENUM (
    'AVAILABLE',    -- Ready for booking assignment
    'IN_USE',       -- Currently assigned to active trip
    'MAINTENANCE',  -- Under scheduled or emergency maintenance
    'INACTIVE'      -- Decommissioned or temporarily out of service
);
COMMENT ON TYPE vehicle_status IS 'Current operational status of vehicle';

-- -----------------------------------------------------------------------------
-- Location Enums
-- -----------------------------------------------------------------------------

CREATE TYPE point_type AS ENUM (
    'FIXED',      -- Predefined company locations (offices, factories, etc.)
    'FLEXIBLE'    -- User-defined custom locations
);
COMMENT ON TYPE point_type IS 'Pickup/drop point classification';

-- -----------------------------------------------------------------------------
-- Booking & Trip Enums
-- -----------------------------------------------------------------------------

CREATE TYPE booking_type AS ENUM (
    'SINGLE_TRIP',    -- One-way or round-trip, single day
    'MULTI_STOP',     -- Multiple stops in sequence
    'BLOCK_SCHEDULE'  -- Extended reservation spanning multiple days
);
COMMENT ON TYPE booking_type IS 'Booking pattern classification';

CREATE TYPE booking_status AS ENUM (
    'PENDING',              -- Awaiting confirmation from PIC
    'CONFIRMED',            -- Approved, awaiting vehicle/driver assignment
    'ASSIGNED',             -- Vehicle and driver assigned, awaiting execution
    'IN_PROGRESS',          -- Trip currently active
    'COMPLETED',            -- Trip finished successfully
    'CANCELLED',            -- Cancelled by user or system
    'REDIRECTED_EXTERNAL'   -- Redirected to external provider (Grab/Taxi)
);
COMMENT ON TYPE booking_status IS 'Booking lifecycle status - follows strict state machine';

CREATE TYPE stop_type AS ENUM (
    'PICKUP',  -- First stop - passenger pickup
    'DROP',    -- Final stop - passenger drop-off
    'STOP'     -- Intermediate stop
);
COMMENT ON TYPE stop_type IS 'Type of stop within a multi-stop booking';

CREATE TYPE cancellation_reason AS ENUM (
    'USER_REQUEST',         -- Cancelled by requester
    'NO_VEHICLE_AVAILABLE', -- No suitable vehicle found
    'NO_DRIVER_AVAILABLE',  -- No driver available for time slot
    'QUOTA_EXCEEDED',       -- Monthly KM quota would be exceeded
    'VEHICLE_BREAKDOWN',    -- Assigned vehicle broke down
    'SCHEDULE_CONFLICT',    -- Scheduling conflict detected
    'WEATHER',              -- Severe weather conditions
    'EMERGENCY',            -- Emergency situation
    'DUPLICATE',            -- Duplicate booking detected
    'OTHER'                 -- Other reason (requires notes)
);
COMMENT ON TYPE cancellation_reason IS 'Standardized cancellation reasons for analytics';

-- -----------------------------------------------------------------------------
-- Driver App Enums
-- -----------------------------------------------------------------------------

CREATE TYPE driver_response_status AS ENUM (
    'PENDING',      -- Awaiting driver response to assignment
    'ACCEPTED',     -- Driver accepted the trip assignment
    'REJECTED',     -- Driver rejected (with reason required)
    'NO_RESPONSE'   -- Driver didn't respond within timeout period
);
COMMENT ON TYPE driver_response_status IS 'Driver response to trip assignment';

CREATE TYPE expense_type AS ENUM (
    'TOLL',     -- Highway/road toll fees
    'PARKING',  -- Parking fees
    'FUEL',     -- Fuel/gasoline costs
    'REPAIR',   -- Emergency repair during trip
    'OTHER'     -- Other miscellaneous expenses
);
COMMENT ON TYPE expense_type IS 'Categories of expenses incurred during trips';

CREATE TYPE trip_event_type AS ENUM (
    'DRIVER_ACCEPTED',      -- Driver accepted trip assignment
    'DRIVER_REJECTED',      -- Driver rejected trip assignment
    'TRIP_STARTED',         -- Trip execution began
    'ARRIVED_PICKUP',       -- Driver arrived at pickup point
    'PASSENGER_BOARDED',    -- Passenger entered vehicle
    'ARRIVED_STOP',         -- Arrived at intermediate stop
    'ARRIVED_DESTINATION',  -- Arrived at final destination
    'TRIP_COMPLETED',       -- Trip finished
    'ODOMETER_RECORDED',    -- Odometer reading captured
    'EXPENSE_ADDED',        -- Expense recorded during trip
    'AUTO_CALL_TRIGGERED'   -- Automatic call placed to passenger
);
COMMENT ON TYPE trip_event_type IS 'Timeline events during trip execution for driver app';

-- -----------------------------------------------------------------------------
-- External Provider Enums
-- -----------------------------------------------------------------------------

CREATE TYPE external_provider AS ENUM (
    'GRAB',           -- Grab ride-hailing
    'GOJEK',          -- Gojek ride-hailing
    'BE',             -- Be ride-hailing (Vietnam)
    'TAXI_MAI_LINH',  -- Mai Linh Taxi
    'TAXI_VINASUN',   -- Vinasun Taxi
    'OTHER'           -- Other external provider
);
COMMENT ON TYPE external_provider IS 'External vehicle/ride providers for overflow dispatch';

-- -----------------------------------------------------------------------------
-- Operations Enums
-- -----------------------------------------------------------------------------

CREATE TYPE reading_type AS ENUM (
    'TRIP_START',   -- Odometer at trip start
    'TRIP_END',     -- Odometer at trip end
    'DAILY_CHECK'   -- Daily vehicle inspection reading
);
COMMENT ON TYPE reading_type IS 'Context for odometer readings';

CREATE TYPE shift_status AS ENUM (
    'SCHEDULED',  -- Shift planned but not started
    'ACTIVE',     -- Driver currently on shift
    'COMPLETED',  -- Shift finished normally
    'ABSENT',     -- Driver did not report
    'CANCELLED'   -- Shift cancelled
);
COMMENT ON TYPE shift_status IS 'Driver shift execution status';

CREATE TYPE maintenance_type AS ENUM (
    'SCHEDULED',    -- Regular scheduled maintenance
    'REPAIR',       -- Unscheduled repair
    'INSPECTION',   -- Safety/regulatory inspection
    'TIRE_SERVICE', -- Tire rotation, replacement
    'OIL_CHANGE',   -- Oil and filter change
    'CLEANING',     -- Vehicle cleaning/detailing
    'OTHER'         -- Other maintenance type
);
COMMENT ON TYPE maintenance_type IS 'Vehicle maintenance categories';

-- -----------------------------------------------------------------------------
-- Notification Enums
-- -----------------------------------------------------------------------------

CREATE TYPE notification_channel AS ENUM (
    'APP_PUSH',   -- Mobile app push notification
    'AUTO_CALL',  -- Automated voice call (TTS)
    'SMS'         -- SMS text message
);
COMMENT ON TYPE notification_channel IS 'Delivery channel for notifications';

CREATE TYPE notification_type AS ENUM (
    'BOOKING_CONFIRMED',  -- Booking has been confirmed
    'VEHICLE_ARRIVING',   -- Vehicle approaching pickup point
    'TRIP_STARTED',       -- Trip has begun
    'TRIP_COMPLETED',     -- Trip finished
    'BOOKING_CANCELLED'   -- Booking was cancelled
);
COMMENT ON TYPE notification_type IS 'Notification event types';

CREATE TYPE notification_status AS ENUM (
    'PENDING',    -- Queued for delivery
    'SENT',       -- Sent to provider
    'DELIVERED',  -- Confirmed delivered
    'FAILED'      -- Delivery failed
);
COMMENT ON TYPE notification_status IS 'Notification delivery status';

-- ============================================================================
-- SECTION 3: CORE ENTITY TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- DEPARTMENTS
-- Organizational units for cost center tracking and access control
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    name VARCHAR(255) NOT NULL,                    -- Display name: "Finance Department"
    code VARCHAR(50) UNIQUE NOT NULL,              -- Short code: "FIN", "HR", "OPS"
    cost_center VARCHAR(100),                      -- Accounting cost center code

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,       -- Soft delete flag

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE departments IS 'Organizational departments for cost allocation and booking authorization';
COMMENT ON COLUMN departments.code IS 'Unique short code for department identification in reports';
COMMENT ON COLUMN departments.cost_center IS 'Accounting system cost center for billing integration';
COMMENT ON COLUMN departments.is_active IS 'Soft delete: false = department archived, bookings blocked';

-- -----------------------------------------------------------------------------
-- USERS
-- All system users: employees, drivers, administrators
-- Single table with role-based differentiation
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,            -- Login email, also used for notifications
    password_hash VARCHAR(255) NOT NULL,           -- Bcrypt hashed password

    -- Profile
    full_name VARCHAR(255) NOT NULL,               -- Display name
    phone VARCHAR(50),                             -- Mobile number for SMS/calls

    -- Access Control
    role user_role NOT NULL,                       -- System role (ADMIN, PIC, GA, DRIVER, EMPLOYEE)
    user_segment user_segment,                     -- Booking pattern (DAILY or SOMETIMES)

    -- Organization
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,       -- Soft delete flag

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_drivers ON users(id) WHERE role = 'DRIVER' AND is_active = true;

COMMENT ON TABLE users IS 'All system users with role-based access control';
COMMENT ON COLUMN users.role IS 'ADMIN=full access, PIC=dispatch ops, GA=external rentals, DRIVER=trips, EMPLOYEE=booking';
COMMENT ON COLUMN users.user_segment IS 'DAILY=fixed routes (SIC), SOMETIMES=occasional trips';
COMMENT ON COLUMN users.is_active IS 'Soft delete: false = user deactivated, login blocked';

-- -----------------------------------------------------------------------------
-- VEHICLES
-- Fleet vehicles available for booking
-- Tracks status, GPS, and assigned driver
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    license_plate VARCHAR(20) UNIQUE NOT NULL,     -- Registration plate: "51A-12345"
    brand VARCHAR(100) NOT NULL,                   -- Manufacturer: "Toyota", "Ford"
    model VARCHAR(100) NOT NULL,                   -- Model name: "Camry", "Transit"
    year INTEGER,                                  -- Manufacturing year

    -- Specifications
    capacity INTEGER NOT NULL CHECK (capacity > 0), -- Passenger seats (excluding driver)
    vehicle_type vehicle_type NOT NULL,             -- SEDAN, SUV, VAN, BUS

    -- Operational Status
    status vehicle_status NOT NULL DEFAULT 'AVAILABLE',
    current_odometer_km DECIMAL(10, 2),            -- Current odometer reading in KM

    -- GPS Tracking
    gps_device_id VARCHAR(100),                    -- GPS tracker device identifier

    -- Assignment
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Primary driver

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,       -- Soft delete flag

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_driver ON vehicles(assigned_driver_id);
CREATE INDEX idx_vehicles_available ON vehicles(id) WHERE status = 'AVAILABLE' AND is_active = true;

COMMENT ON TABLE vehicles IS 'Fleet vehicles with real-time status and GPS tracking';
COMMENT ON COLUMN vehicles.capacity IS 'Number of passenger seats (driver seat excluded)';
COMMENT ON COLUMN vehicles.gps_device_id IS 'Hardware GPS tracker ID for real-time location';
COMMENT ON COLUMN vehicles.assigned_driver_id IS 'Primary driver assignment for this vehicle';
COMMENT ON COLUMN vehicles.current_odometer_km IS 'Last recorded odometer, updated after each trip';

-- -----------------------------------------------------------------------------
-- KM_QUOTAS
-- Monthly kilometer quotas per vehicle
-- Used to trigger external dispatch when quota exceeded
-- -----------------------------------------------------------------------------
CREATE TABLE km_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Vehicle Reference
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Quota Period
    month DATE NOT NULL,                           -- First day of month (e.g., 2026-01-01)

    -- Limits
    quota_km DECIMAL(10, 2) NOT NULL CHECK (quota_km >= 0),     -- Monthly limit in KM
    tolerance_km DECIMAL(10, 2) CHECK (tolerance_km >= 0),      -- Allowed overage before external

    -- Usage Tracking
    used_km DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (used_km >= 0),  -- KM used this month

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(vehicle_id, month)                      -- One quota per vehicle per month
);

CREATE INDEX idx_km_quotas_vehicle_month ON km_quotas(vehicle_id, month);

COMMENT ON TABLE km_quotas IS 'Monthly KM quotas per vehicle for cost control';
COMMENT ON COLUMN km_quotas.month IS 'First day of month this quota applies to';
COMMENT ON COLUMN km_quotas.quota_km IS 'Maximum allowed KM for the month';
COMMENT ON COLUMN km_quotas.tolerance_km IS 'Buffer KM allowed over quota before external dispatch';
COMMENT ON COLUMN km_quotas.used_km IS 'Cumulative KM used, auto-updated on trip completion';

-- -----------------------------------------------------------------------------
-- PICKUP_POINTS
-- Predefined and custom pickup/drop-off locations
-- -----------------------------------------------------------------------------
CREATE TABLE pickup_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Location Details
    name VARCHAR(255) NOT NULL,                    -- Location name: "HQ Office", "Factory A"
    address VARCHAR(500) NOT NULL,                 -- Full address
    latitude DECIMAL(10, 8),                       -- GPS latitude (-90 to 90)
    longitude DECIMAL(11, 8),                      -- GPS longitude (-180 to 180)

    -- Classification
    point_type point_type NOT NULL,                -- FIXED (predefined) or FLEXIBLE (custom)

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,       -- Soft delete flag

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pickup_points_type ON pickup_points(point_type);
CREATE INDEX idx_pickup_points_active ON pickup_points(is_active) WHERE is_active = true;

COMMENT ON TABLE pickup_points IS 'Predefined company locations and user-defined custom points';
COMMENT ON COLUMN pickup_points.point_type IS 'FIXED=company location, FLEXIBLE=user-defined';

-- ============================================================================
-- SECTION 4: BOOKING SYSTEM TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- BOOKING_SEQUENCES
-- Thread-safe booking code generation
-- Prevents race conditions when generating sequential codes
-- -----------------------------------------------------------------------------
CREATE TABLE booking_sequences (
    date_key DATE PRIMARY KEY,                     -- Date for sequence
    last_seq INTEGER NOT NULL DEFAULT 0           -- Last used sequence number
);

COMMENT ON TABLE booking_sequences IS 'Atomic sequence generator for booking codes (MSM-YYYYMMDD-XXXX)';
COMMENT ON COLUMN booking_sequences.date_key IS 'Date portion of booking code';
COMMENT ON COLUMN booking_sequences.last_seq IS 'Last assigned sequence, incremented atomically';

-- -----------------------------------------------------------------------------
-- BOOKINGS
-- Main reservation records
-- Central table linking requester, vehicle, driver, and trip details
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    booking_code VARCHAR(20) UNIQUE NOT NULL,      -- Format: MSM-YYYYMMDD-XXXX

    -- Requester Information
    requester_id UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

    -- Booking Type & Status
    booking_type booking_type NOT NULL,            -- SINGLE_TRIP, MULTI_STOP, BLOCK_SCHEDULE
    status booking_status NOT NULL DEFAULT 'PENDING',

    -- Schedule
    scheduled_date DATE NOT NULL,                  -- Trip date
    scheduled_time TIME NOT NULL,                  -- Departure time
    end_date DATE,                                 -- For BLOCK_SCHEDULE: last day

    -- Trip Details
    purpose TEXT,                                  -- Reason for trip
    passenger_count INTEGER NOT NULL DEFAULT 1,   -- Number of passengers
    notes TEXT,                                    -- Special instructions

    -- Assignment (filled when status = ASSIGNED)
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Driver Response (from Driver App)
    driver_response driver_response_status DEFAULT 'PENDING',
    driver_response_at TIMESTAMP WITH TIME ZONE,
    driver_rejection_reason TEXT,

    -- Distance Tracking
    estimated_km DECIMAL(10, 2),                   -- Estimated trip distance
    actual_km DECIMAL(10, 2),                      -- Actual distance (filled on completion)

    -- Cancellation Tracking
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason cancellation_reason,
    cancellation_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_requester ON bookings(requester_id);
CREATE INDEX idx_bookings_department ON bookings(department_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_vehicle ON bookings(assigned_vehicle_id);
CREATE INDEX idx_bookings_driver ON bookings(assigned_driver_id);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_driver_response ON bookings(driver_response) WHERE status = 'ASSIGNED';

COMMENT ON TABLE bookings IS 'Vehicle reservation requests with full lifecycle tracking';
COMMENT ON COLUMN bookings.booking_code IS 'Human-readable code: MSM-YYYYMMDD-XXXX';
COMMENT ON COLUMN bookings.status IS 'Lifecycle: PENDING→CONFIRMED→ASSIGNED→IN_PROGRESS→COMPLETED';
COMMENT ON COLUMN bookings.driver_response IS 'Driver acceptance status from mobile app';
COMMENT ON COLUMN bookings.estimated_km IS 'Pre-trip estimate for quota checking';
COMMENT ON COLUMN bookings.actual_km IS 'Post-trip actual distance for quota deduction';

-- -----------------------------------------------------------------------------
-- TRIP_STOPS
-- Individual stops within bookings (for multi-stop bookings)
-- Each booking has at least 2 stops: PICKUP and DROP
-- -----------------------------------------------------------------------------
CREATE TABLE trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parent Booking
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Location (either reference or custom)
    pickup_point_id UUID REFERENCES pickup_points(id) ON DELETE SET NULL,
    custom_address VARCHAR(500),                   -- Used when pickup_point_id is NULL
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Ordering
    stop_order INTEGER NOT NULL,                   -- 1, 2, 3... sequence
    stop_type stop_type NOT NULL,                  -- PICKUP, DROP, or STOP

    -- Timing
    scheduled_time TIME,                           -- Expected arrival time
    actual_arrival TIMESTAMP WITH TIME ZONE,      -- When driver actually arrived

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_stops_booking ON trip_stops(booking_id);
CREATE INDEX idx_trip_stops_order ON trip_stops(booking_id, stop_order);

COMMENT ON TABLE trip_stops IS 'Ordered stops within a booking, minimum 2 (pickup + drop)';
COMMENT ON COLUMN trip_stops.stop_order IS 'Sequence number: 1=first stop, 2=second, etc.';
COMMENT ON COLUMN trip_stops.pickup_point_id IS 'Reference to predefined location, NULL for custom';
COMMENT ON COLUMN trip_stops.custom_address IS 'Free-text address when not using predefined point';

-- -----------------------------------------------------------------------------
-- EXTERNAL_DISPATCHES
-- Records when bookings are redirected to external providers
-- Tracks Grab, Taxi, etc. when internal vehicles unavailable
-- -----------------------------------------------------------------------------
CREATE TABLE external_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Related Booking
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Provider Details
    provider external_provider NOT NULL,           -- GRAB, TAXI_MAI_LINH, etc.
    provider_booking_id VARCHAR(100),              -- External provider's booking reference
    provider_driver_name VARCHAR(255),             -- External driver name

    -- Cost Tracking
    estimated_cost DECIMAL(12, 2),                 -- Quoted cost
    actual_cost DECIMAL(12, 2),                    -- Final billed cost

    -- Reason for External Dispatch
    dispatch_reason TEXT,                          -- Why internal wasn't available

    -- Timestamps
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_external_dispatches_booking ON external_dispatches(booking_id);
CREATE INDEX idx_external_dispatches_provider ON external_dispatches(provider);

COMMENT ON TABLE external_dispatches IS 'External provider bookings when internal fleet unavailable';
COMMENT ON COLUMN external_dispatches.dispatch_reason IS 'Reason: quota exceeded, no vehicle, no driver, etc.';
COMMENT ON COLUMN external_dispatches.provider_booking_id IS 'Reference number from Grab/Taxi provider';

-- ============================================================================
-- SECTION 5: GPS & TRACKING TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- GPS_LOCATIONS (Partitioned by Month)
-- Real-time vehicle position tracking
-- Partitioned for performance with high-volume time-series data
-- -----------------------------------------------------------------------------
CREATE TABLE gps_locations (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),

    -- Vehicle Reference
    vehicle_id UUID NOT NULL,                      -- References vehicles(id)

    -- Position Data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed_kmh DECIMAL(6, 2),                       -- Speed in km/h
    heading DECIMAL(5, 2),                         -- Direction in degrees (0-360)

    -- Timestamp (partition key)
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id, recorded_at)                  -- Composite PK for partitioning
) PARTITION BY RANGE (recorded_at);

-- Create partitions for current and next month (extend as needed)
-- Example partitions - create monthly partitions via scheduled job
CREATE TABLE gps_locations_2026_01 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE gps_locations_2026_02 PARTITION OF gps_locations
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_gps_vehicle_time ON gps_locations(vehicle_id, recorded_at DESC);

COMMENT ON TABLE gps_locations IS 'Real-time GPS positions, partitioned monthly for performance';
COMMENT ON COLUMN gps_locations.heading IS 'Compass direction: 0=North, 90=East, 180=South, 270=West';
COMMENT ON COLUMN gps_locations.speed_kmh IS 'Instantaneous speed from GPS device';

-- -----------------------------------------------------------------------------
-- ODOMETER_LOGS
-- Distance readings at trip start/end and daily checks
-- Used for KM quota tracking and fraud detection
-- -----------------------------------------------------------------------------
CREATE TABLE odometer_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Reading Data
    reading_km DECIMAL(10, 2) NOT NULL,            -- Odometer value in KM
    reading_type reading_type NOT NULL,            -- TRIP_START, TRIP_END, DAILY_CHECK

    -- Metadata
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by UUID NOT NULL REFERENCES users(id),

    -- Validation (for fraud detection)
    photo_url VARCHAR(500),                        -- Photo of odometer (optional)
    is_validated BOOLEAN DEFAULT false,            -- Admin verified
    validation_notes TEXT
);

CREATE INDEX idx_odometer_vehicle ON odometer_logs(vehicle_id, recorded_at DESC);
CREATE INDEX idx_odometer_booking ON odometer_logs(booking_id);

COMMENT ON TABLE odometer_logs IS 'Odometer readings for KM tracking and quota management';
COMMENT ON COLUMN odometer_logs.reading_type IS 'Context: at trip start, end, or daily inspection';
COMMENT ON COLUMN odometer_logs.is_validated IS 'Admin verification flag for suspicious readings';

-- ============================================================================
-- SECTION 6: DRIVER MANAGEMENT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- DRIVER_SHIFTS
-- Driver work schedules and availability
-- Used for automated vehicle-driver matching
-- -----------------------------------------------------------------------------
CREATE TABLE driver_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Driver Reference
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Schedule
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Status Tracking
    status shift_status NOT NULL DEFAULT 'SCHEDULED',
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(driver_id, shift_date)
);

CREATE INDEX idx_driver_shifts_date ON driver_shifts(shift_date, status);
CREATE INDEX idx_driver_shifts_driver ON driver_shifts(driver_id, shift_date);

COMMENT ON TABLE driver_shifts IS 'Driver work schedules for availability matching';
COMMENT ON COLUMN driver_shifts.status IS 'SCHEDULED→ACTIVE→COMPLETED or ABSENT/CANCELLED';

-- -----------------------------------------------------------------------------
-- TRIP_EXPENSES
-- Expenses recorded by drivers during trips
-- Supports receipt upload and approval workflow
-- -----------------------------------------------------------------------------
CREATE TABLE trip_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Expense Details
    expense_type expense_type NOT NULL,            -- TOLL, PARKING, FUEL, etc.
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,                              -- Additional details

    -- Receipt
    receipt_url VARCHAR(500),                      -- URL to uploaded receipt image

    -- Recording
    recorded_by UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Approval Workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT NULL,              -- NULL=pending, true=approved, false=rejected

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_expenses_booking ON trip_expenses(booking_id);
CREATE INDEX idx_trip_expenses_type ON trip_expenses(expense_type);
CREATE INDEX idx_trip_expenses_pending ON trip_expenses(is_approved) WHERE is_approved IS NULL;

COMMENT ON TABLE trip_expenses IS 'Driver-recorded trip expenses with approval workflow';
COMMENT ON COLUMN trip_expenses.is_approved IS 'Approval status: NULL=pending, true=OK, false=rejected';
COMMENT ON COLUMN trip_expenses.receipt_url IS 'Cloud storage URL for receipt image verification';

-- -----------------------------------------------------------------------------
-- TRIP_EVENTS
-- Timeline of events during trip execution
-- Powers the driver app activity feed
-- -----------------------------------------------------------------------------
CREATE TABLE trip_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Event Details
    event_type trip_event_type NOT NULL,
    event_data JSONB,                              -- Event-specific data (stop_id, amount, etc.)

    -- Location at Event
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Metadata
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_events_booking ON trip_events(booking_id, recorded_at);
CREATE INDEX idx_trip_events_type ON trip_events(event_type);

COMMENT ON TABLE trip_events IS 'Chronological timeline of trip execution events';
COMMENT ON COLUMN trip_events.event_data IS 'JSON payload: {stop_id, expense_id, call_duration, etc.}';

-- ============================================================================
-- SECTION 7: OPERATIONS TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- VEHICLE_MAINTENANCE
-- Service and repair history
-- Tracks maintenance schedules and costs
-- -----------------------------------------------------------------------------
CREATE TABLE vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Vehicle Reference
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Maintenance Details
    maintenance_type maintenance_type NOT NULL,
    description TEXT NOT NULL,

    -- Metrics
    odometer_at_service DECIMAL(10, 2),            -- Odometer when serviced
    cost DECIMAL(12, 2),                           -- Maintenance cost

    -- Vendor
    vendor_name VARCHAR(255),

    -- Timeline
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Next Service Reminder
    next_service_km DECIMAL(10, 2),                -- Service at this odometer
    next_service_date DATE,                        -- Or by this date

    -- Performed By
    performed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_maintenance_type ON vehicle_maintenance(maintenance_type);
CREATE INDEX idx_maintenance_next ON vehicle_maintenance(next_service_date) WHERE completed_at IS NOT NULL;

COMMENT ON TABLE vehicle_maintenance IS 'Vehicle service and repair history';
COMMENT ON COLUMN vehicle_maintenance.next_service_km IS 'Trigger next service at this odometer reading';
COMMENT ON COLUMN vehicle_maintenance.next_service_date IS 'Time-based service reminder date';

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS
-- Multi-channel notification queue
-- Supports push, SMS, and auto-call
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Delivery
    channel notification_channel NOT NULL,         -- APP_PUSH, AUTO_CALL, SMS
    notification_type notification_type NOT NULL,

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Status
    status notification_status NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_booking ON notifications(booking_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'PENDING';

COMMENT ON TABLE notifications IS 'Multi-channel notification queue and delivery log';
COMMENT ON COLUMN notifications.channel IS 'Delivery method: app push, automated call, or SMS';

-- ============================================================================
-- SECTION 8: REPORTING & AUDIT TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TRIP_REPORTS
-- Denormalized analytics data for completed trips
-- Pre-aggregated for fast dashboard queries
-- -----------------------------------------------------------------------------
CREATE TABLE trip_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References (denormalized for query performance)
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

    -- Trip Metrics
    trip_date DATE NOT NULL,
    start_km DECIMAL(10, 2),
    end_km DECIMAL(10, 2),
    total_km DECIMAL(10, 2),
    duration_minutes INTEGER,

    -- Cost Metrics
    cost_estimate DECIMAL(12, 2),                  -- Calculated trip cost
    total_expenses DECIMAL(12, 2) DEFAULT 0,       -- Sum of approved expenses
    expense_breakdown JSONB,                       -- {TOLL: 50, PARKING: 20, ...}

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_reports_date ON trip_reports(trip_date);
CREATE INDEX idx_trip_reports_vehicle ON trip_reports(vehicle_id, trip_date);
CREATE INDEX idx_trip_reports_department ON trip_reports(department_id, trip_date);

COMMENT ON TABLE trip_reports IS 'Denormalized completed trip data for analytics dashboards';
COMMENT ON COLUMN trip_reports.expense_breakdown IS 'JSON breakdown by expense type: {TOLL: 50, FUEL: 100}';

-- -----------------------------------------------------------------------------
-- SYSTEM_CONFIGS
-- Application configuration stored in database
-- Key-value store with JSONB values
-- -----------------------------------------------------------------------------
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Configuration
    key VARCHAR(100) UNIQUE NOT NULL,              -- Config key: "booking.auto_confirm"
    value JSONB NOT NULL,                          -- Config value as JSON
    description TEXT,                              -- Human-readable description

    -- Audit
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_configs IS 'Application settings stored as JSONB key-value pairs';
COMMENT ON COLUMN system_configs.key IS 'Dot-notation config key: "booking.max_advance_days"';
COMMENT ON COLUMN system_configs.value IS 'JSON value: {"enabled": true, "threshold": 100}';

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS
-- Change tracking for critical tables
-- Records old/new values for compliance
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target
    table_name VARCHAR(100) NOT NULL,              -- Table that was changed
    record_id UUID NOT NULL,                       -- Primary key of changed record
    action VARCHAR(20) NOT NULL,                   -- INSERT, UPDATE, DELETE

    -- Change Data
    old_values JSONB,                              -- Previous values (NULL for INSERT)
    new_values JSONB,                              -- New values (NULL for DELETE)
    changed_fields TEXT[],                         -- Array of changed column names

    -- Actor
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_logs(changed_at);

COMMENT ON TABLE audit_logs IS 'Compliance audit trail for critical data changes';
COMMENT ON COLUMN audit_logs.changed_fields IS 'List of columns that changed in this operation';

-- ============================================================================
-- SECTION 9: VIEWS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- V_DRIVER_MONTHLY_STATS
-- Monthly statistics per driver for driver app dashboard
-- -----------------------------------------------------------------------------
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

COMMENT ON VIEW v_driver_monthly_stats IS 'Aggregated monthly KM and trip stats for driver app';

-- ============================================================================
-- SECTION 10: FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: Check KM Quota Availability
-- Returns TRUE if vehicle can accommodate estimated_km within quota + tolerance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_km_quota(
    p_vehicle_id UUID,
    p_estimated_km DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_quota_km DECIMAL;
    v_tolerance_km DECIMAL;
    v_used_km DECIMAL;
    v_available_km DECIMAL;
BEGIN
    -- Get current month's quota
    SELECT quota_km, COALESCE(tolerance_km, 0), used_km
    INTO v_quota_km, v_tolerance_km, v_used_km
    FROM km_quotas
    WHERE vehicle_id = p_vehicle_id
      AND month = DATE_TRUNC('month', CURRENT_DATE)::DATE;

    -- If no quota defined, allow booking
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    -- Calculate available KM (quota + tolerance - used)
    v_available_km := v_quota_km + v_tolerance_km - v_used_km;

    -- Check if estimated KM fits within available
    RETURN p_estimated_km <= v_available_km;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_km_quota IS 'Check if vehicle has sufficient KM quota for trip';

-- -----------------------------------------------------------------------------
-- Function: Generate Booking Code
-- Atomically generates next booking code for given date
-- Format: MSM-YYYYMMDD-XXXX (e.g., MSM-20260131-0042)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_booking_code(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VARCHAR AS $$
DECLARE
    v_seq INTEGER;
    v_code VARCHAR;
BEGIN
    -- Insert or update sequence atomically
    INSERT INTO booking_sequences (date_key, last_seq)
    VALUES (p_date, 1)
    ON CONFLICT (date_key) DO UPDATE
    SET last_seq = booking_sequences.last_seq + 1
    RETURNING last_seq INTO v_seq;

    -- Format: MSM-YYYYMMDD-XXXX
    v_code := 'MSM-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' || LPAD(v_seq::TEXT, 4, '0');

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_booking_code IS 'Generate thread-safe sequential booking code';

-- -----------------------------------------------------------------------------
-- Function: Update KM Quota Usage
-- Called when trip completes to deduct actual_km from monthly quota
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_km_quota_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to COMPLETED
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED'
       AND NEW.assigned_vehicle_id IS NOT NULL
       AND NEW.actual_km IS NOT NULL THEN

        UPDATE km_quotas
        SET used_km = used_km + NEW.actual_km,
            updated_at = CURRENT_TIMESTAMP
        WHERE vehicle_id = NEW.assigned_vehicle_id
          AND month = DATE_TRUNC('month', NEW.scheduled_date)::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_km_quota_usage IS 'Auto-update quota usage when trip completes';

-- ============================================================================
-- SECTION 11: TRIGGERS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at timestamp
-- Applied to all tables with updated_at column
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_km_quotas_updated_at
    BEFORE UPDATE ON km_quotas
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_pickup_points_updated_at
    BEFORE UPDATE ON pickup_points
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_driver_shifts_updated_at
    BEFORE UPDATE ON driver_shifts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- -----------------------------------------------------------------------------
-- Trigger: Update KM quota on trip completion
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_update_km_quota
    AFTER UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
    EXECUTE FUNCTION update_km_quota_usage();

-- -----------------------------------------------------------------------------
-- Trigger: Update trip report expenses on approval
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_trip_report_expenses()
RETURNS TRIGGER AS $$
BEGIN
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

-- -----------------------------------------------------------------------------
-- Trigger: Booking status state machine validation
-- Ensures valid status transitions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid transitions
    IF OLD.status = 'PENDING' AND NEW.status NOT IN ('CONFIRMED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid transition from PENDING to %', NEW.status;
    ELSIF OLD.status = 'CONFIRMED' AND NEW.status NOT IN ('ASSIGNED', 'CANCELLED', 'REDIRECTED_EXTERNAL') THEN
        RAISE EXCEPTION 'Invalid transition from CONFIRMED to %', NEW.status;
    ELSIF OLD.status = 'ASSIGNED' AND NEW.status NOT IN ('IN_PROGRESS', 'CANCELLED', 'CONFIRMED') THEN
        RAISE EXCEPTION 'Invalid transition from ASSIGNED to %', NEW.status;
    ELSIF OLD.status = 'IN_PROGRESS' AND NEW.status NOT IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid transition from IN_PROGRESS to %', NEW.status;
    ELSIF OLD.status IN ('COMPLETED', 'CANCELLED', 'REDIRECTED_EXTERNAL') THEN
        RAISE EXCEPTION 'Cannot transition from terminal status %', OLD.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_booking_status
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_status_transition();

-- ============================================================================
-- SECTION 12: INITIAL SEED DATA (Optional)
-- ============================================================================

-- Default system configuration
INSERT INTO system_configs (key, value, description) VALUES
    ('booking.auto_confirm', '{"enabled": false}', 'Auto-confirm bookings without PIC approval'),
    ('booking.max_advance_days', '{"days": 30}', 'Maximum days in advance for booking'),
    ('booking.cancellation_cutoff_minutes', '{"minutes": 30}', 'Minimum minutes before trip to cancel'),
    ('quota.default_tolerance_percent', '{"percent": 10}', 'Default KM tolerance percentage over quota'),
    ('notification.auto_call_enabled', '{"enabled": true}', 'Enable automated voice calls'),
    ('notification.reminder_minutes', '{"minutes": 15}', 'Minutes before trip to send reminder')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- END OF INITIAL SCHEMA
-- ============================================================================
