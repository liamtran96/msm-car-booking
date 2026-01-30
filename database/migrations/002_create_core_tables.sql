-- Migration: 002_create_core_tables
-- Description: Create core entity tables (departments, users, vehicles, km_quotas, pickup_points)
-- Author: System
-- Date: 2026-01-30

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    cost_center VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE departments IS 'Organizational departments for cost center tracking';
COMMENT ON COLUMN departments.code IS 'Unique department code for identification';
COMMENT ON COLUMN departments.cost_center IS 'Cost center identifier for billing';

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL,
    user_segment user_segment,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'System users including employees, drivers, and administrators';
COMMENT ON COLUMN users.role IS 'User role: ADMIN, PIC, GA, DRIVER, EMPLOYEE';
COMMENT ON COLUMN users.user_segment IS 'User segment: DAILY (fixed routes), SOMETIMES (occasional)';

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    vehicle_type vehicle_type NOT NULL,
    status vehicle_status NOT NULL DEFAULT 'AVAILABLE',
    current_odometer_km DECIMAL(10, 2),
    gps_device_id VARCHAR(100),
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_driver ON vehicles(assigned_driver_id);

COMMENT ON TABLE vehicles IS 'Fleet vehicles available for booking';
COMMENT ON COLUMN vehicles.capacity IS 'Passenger capacity (number of seats)';
COMMENT ON COLUMN vehicles.gps_device_id IS 'GPS tracker device identifier';

-- KM Quotas table
CREATE TABLE km_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    quota_km DECIMAL(10, 2) NOT NULL CHECK (quota_km >= 0),
    tolerance_km DECIMAL(10, 2) CHECK (tolerance_km >= 0),
    used_km DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (used_km >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, month)
);

CREATE INDEX idx_km_quotas_vehicle_month ON km_quotas(vehicle_id, month);

COMMENT ON TABLE km_quotas IS 'Monthly kilometer quotas per vehicle';
COMMENT ON COLUMN km_quotas.month IS 'First day of the month for this quota';
COMMENT ON COLUMN km_quotas.tolerance_km IS 'Allowed tolerance over quota before external dispatch';

-- Pickup Points table
CREATE TABLE pickup_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    point_type point_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pickup_points_type ON pickup_points(point_type);
CREATE INDEX idx_pickup_points_active ON pickup_points(is_active) WHERE is_active = true;

COMMENT ON TABLE pickup_points IS 'Predefined and custom pickup/drop-off locations';
COMMENT ON COLUMN pickup_points.point_type IS 'FIXED (predefined) or FLEXIBLE (user-defined)';
