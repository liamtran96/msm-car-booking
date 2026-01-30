-- Migration: 001_create_enums
-- Description: Create all enum types for the MSM Car Booking system
-- Author: System
-- Date: 2026-01-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User role enum
CREATE TYPE user_role AS ENUM (
    'ADMIN',      -- System administrator
    'PIC',        -- Person In Charge
    'GA',         -- General Affairs
    'DRIVER',     -- Vehicle driver
    'EMPLOYEE'    -- Regular employee
);

-- User segment enum
CREATE TYPE user_segment AS ENUM (
    'DAILY',      -- SIC users with fixed routes
    'SOMETIMES'   -- Business trippers with occasional bookings
);

-- Vehicle type enum
CREATE TYPE vehicle_type AS ENUM (
    'SEDAN',      -- Standard sedan
    'SUV',        -- Sport utility vehicle
    'VAN',        -- Passenger van
    'BUS'         -- Bus/minibus
);

-- Vehicle status enum
CREATE TYPE vehicle_status AS ENUM (
    'AVAILABLE',    -- Ready for booking
    'IN_USE',       -- Currently on a trip
    'MAINTENANCE',  -- Under maintenance
    'INACTIVE'      -- Not in service
);

-- Pickup point type enum
CREATE TYPE point_type AS ENUM (
    'FIXED',      -- Predefined office locations
    'FLEXIBLE'    -- Custom user-defined locations
);

-- Booking type enum
CREATE TYPE booking_type AS ENUM (
    'SINGLE_TRIP',     -- One-way or round trip
    'MULTI_STOP',      -- Trip with multiple stops
    'BLOCK_SCHEDULE'   -- Recurring/block booking
);

-- Booking status enum
CREATE TYPE booking_status AS ENUM (
    'PENDING',              -- Awaiting confirmation
    'CONFIRMED',            -- Booking confirmed
    'ASSIGNED',             -- Vehicle and driver assigned
    'IN_PROGRESS',          -- Trip currently active
    'COMPLETED',            -- Trip completed
    'CANCELLED',            -- Booking cancelled
    'REDIRECTED_EXTERNAL'   -- Redirected to external provider (Grab/Taxi)
);

-- Trip stop type enum
CREATE TYPE stop_type AS ENUM (
    'PICKUP',   -- Passenger pickup
    'DROP',     -- Passenger drop-off
    'STOP'      -- Intermediate stop
);

-- Odometer reading type enum
CREATE TYPE reading_type AS ENUM (
    'TRIP_START',   -- Reading at trip start
    'TRIP_END',     -- Reading at trip end
    'DAILY_CHECK'   -- Daily maintenance check
);

-- Notification channel enum
CREATE TYPE notification_channel AS ENUM (
    'APP_PUSH',    -- Mobile app push notification
    'AUTO_CALL',   -- Automated phone call
    'SMS'          -- Text message
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'BOOKING_CONFIRMED',   -- Booking confirmation
    'VEHICLE_ARRIVING',    -- Vehicle en route
    'TRIP_STARTED',        -- Trip has begun
    'TRIP_COMPLETED',      -- Trip finished
    'BOOKING_CANCELLED'    -- Booking was cancelled
);

-- Notification status enum
CREATE TYPE notification_status AS ENUM (
    'PENDING',    -- Not yet sent
    'SENT',       -- Sent to provider
    'DELIVERED',  -- Confirmed delivered
    'FAILED'      -- Delivery failed
);
