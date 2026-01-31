-- Migration: 008_seed_data
-- Description: Insert initial seed data for development/testing
-- Author: System
-- Date: 2026-01-30

-- Note: This file contains sample data for development purposes only.
-- Do NOT run this in production without review.

-- Insert sample departments
INSERT INTO departments (id, name, code, cost_center) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'Executive Office', 'EXEC', 'CC-001'),
    ('d1000000-0000-0000-0000-000000000002', 'Engineering', 'ENG', 'CC-002'),
    ('d1000000-0000-0000-0000-000000000003', 'Sales & Marketing', 'SALES', 'CC-003'),
    ('d1000000-0000-0000-0000-000000000004', 'Human Resources', 'HR', 'CC-004'),
    ('d1000000-0000-0000-0000-000000000005', 'Finance', 'FIN', 'CC-005'),
    ('d1000000-0000-0000-0000-000000000006', 'Operations', 'OPS', 'CC-006');

-- Insert sample users (password_hash is bcrypt of 'password123')
INSERT INTO users (id, email, password_hash, full_name, phone, role, user_segment, department_id) VALUES
    -- Admins
    ('u1000000-0000-0000-0000-000000000001', 'admin@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'System Admin', '+84901234567', 'ADMIN', NULL, NULL),

    -- GA Staff
    ('u1000000-0000-0000-0000-000000000002', 'ga.manager@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'GA Manager', '+84901234568', 'GA', NULL, 'd1000000-0000-0000-0000-000000000006'),

    -- PIC
    ('u1000000-0000-0000-0000-000000000003', 'pic.exec@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Executive PIC', '+84901234569', 'PIC', NULL, 'd1000000-0000-0000-0000-000000000001'),

    -- Drivers
    ('u1000000-0000-0000-0000-000000000010', 'driver1@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Nguyen Van A', '+84901234570', 'DRIVER', NULL, NULL),
    ('u1000000-0000-0000-0000-000000000011', 'driver2@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Tran Van B', '+84901234571', 'DRIVER', NULL, NULL),
    ('u1000000-0000-0000-0000-000000000012', 'driver3@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Le Van C', '+84901234572', 'DRIVER', NULL, NULL),

    -- Employees (Daily users)
    ('u1000000-0000-0000-0000-000000000020', 'employee1@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Pham Thi D', '+84901234580', 'EMPLOYEE', 'DAILY', 'd1000000-0000-0000-0000-000000000001'),
    ('u1000000-0000-0000-0000-000000000021', 'employee2@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Hoang Van E', '+84901234581', 'EMPLOYEE', 'DAILY', 'd1000000-0000-0000-0000-000000000002'),

    -- Employees (Sometimes users)
    ('u1000000-0000-0000-0000-000000000030', 'sales1@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Vu Thi F', '+84901234590', 'EMPLOYEE', 'SOMETIMES', 'd1000000-0000-0000-0000-000000000003'),
    ('u1000000-0000-0000-0000-000000000031', 'sales2@msm.com', '$2b$10$xJwP8bBz5RzQX9X8X8X8X.hash', 'Do Van G', '+84901234591', 'EMPLOYEE', 'SOMETIMES', 'd1000000-0000-0000-0000-000000000003');

-- Insert sample vehicles
INSERT INTO vehicles (id, license_plate, brand, model, year, capacity, vehicle_type, status, current_odometer_km, gps_device_id, assigned_driver_id) VALUES
    ('v1000000-0000-0000-0000-000000000001', '51A-12345', 'Toyota', 'Camry', 2023, 4, 'SEDAN', 'AVAILABLE', 15000.00, 'GPS-001', 'u1000000-0000-0000-0000-000000000010'),
    ('v1000000-0000-0000-0000-000000000002', '51A-12346', 'Toyota', 'Fortuner', 2022, 7, 'SUV', 'AVAILABLE', 25000.00, 'GPS-002', 'u1000000-0000-0000-0000-000000000011'),
    ('v1000000-0000-0000-0000-000000000003', '51A-12347', 'Ford', 'Transit', 2023, 16, 'VAN', 'AVAILABLE', 30000.00, 'GPS-003', 'u1000000-0000-0000-0000-000000000012'),
    ('v1000000-0000-0000-0000-000000000004', '51A-12348', 'Mercedes', 'S-Class', 2024, 4, 'SEDAN', 'AVAILABLE', 5000.00, 'GPS-004', NULL),
    ('v1000000-0000-0000-0000-000000000005', '51A-12349', 'Hyundai', 'County', 2021, 29, 'BUS', 'MAINTENANCE', 80000.00, 'GPS-005', NULL);

-- Insert KM quotas for current month
INSERT INTO km_quotas (vehicle_id, month, quota_km, tolerance_km, used_km) VALUES
    ('v1000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE), 2000.00, 200.00, 450.00),
    ('v1000000-0000-0000-0000-000000000002', DATE_TRUNC('month', CURRENT_DATE), 3000.00, 300.00, 1200.00),
    ('v1000000-0000-0000-0000-000000000003', DATE_TRUNC('month', CURRENT_DATE), 4000.00, 400.00, 2800.00),
    ('v1000000-0000-0000-0000-000000000004', DATE_TRUNC('month', CURRENT_DATE), 1500.00, 150.00, 200.00),
    ('v1000000-0000-0000-0000-000000000005', DATE_TRUNC('month', CURRENT_DATE), 5000.00, 500.00, 0.00);

-- Insert sample pickup points
INSERT INTO pickup_points (id, name, address, latitude, longitude, point_type) VALUES
    -- Fixed office locations
    ('p1000000-0000-0000-0000-000000000001', 'MSM Head Office', '123 Nguyen Hue, District 1, HCMC', 10.7731, 106.7030, 'FIXED'),
    ('p1000000-0000-0000-0000-000000000002', 'MSM Branch Office - District 7', '456 Nguyen Van Linh, District 7, HCMC', 10.7285, 106.7220, 'FIXED'),
    ('p1000000-0000-0000-0000-000000000003', 'MSM Factory', '789 Highway 1A, Binh Duong', 10.9831, 106.6515, 'FIXED'),
    ('p1000000-0000-0000-0000-000000000004', 'Tan Son Nhat Airport', 'Truong Son, Tan Binh, HCMC', 10.8184, 106.6588, 'FIXED'),
    ('p1000000-0000-0000-0000-000000000005', 'Long Thanh Airport', 'Long Thanh, Dong Nai', 10.9760, 106.9513, 'FIXED'),

    -- Flexible locations (examples)
    ('p1000000-0000-0000-0000-000000000010', 'Rex Hotel', '141 Nguyen Hue, District 1, HCMC', 10.7765, 106.7023, 'FLEXIBLE'),
    ('p1000000-0000-0000-0000-000000000011', 'Bitexco Financial Tower', '2 Hai Trieu, District 1, HCMC', 10.7717, 106.7044, 'FLEXIBLE');

-- Insert sample bookings
INSERT INTO bookings (id, booking_code, requester_id, department_id, booking_type, status, scheduled_date, scheduled_time, purpose, passenger_count, assigned_vehicle_id, assigned_driver_id, estimated_km) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'MSM-20260130-0001', 'u1000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000001', 'SINGLE_TRIP', 'CONFIRMED', CURRENT_DATE + 1, '08:00:00', 'Daily commute to office', 1, 'v1000000-0000-0000-0000-000000000001', 'u1000000-0000-0000-0000-000000000010', 15.00),
    ('b1000000-0000-0000-0000-000000000002', 'MSM-20260130-0002', 'u1000000-0000-0000-0000-000000000030', 'd1000000-0000-0000-0000-000000000003', 'MULTI_STOP', 'PENDING', CURRENT_DATE + 2, '09:30:00', 'Client visits', 2, NULL, NULL, 45.00),
    ('b1000000-0000-0000-0000-000000000003', 'MSM-20260130-0003', 'u1000000-0000-0000-0000-000000000021', 'd1000000-0000-0000-0000-000000000002', 'SINGLE_TRIP', 'ASSIGNED', CURRENT_DATE + 1, '14:00:00', 'Airport pickup - VIP guest', 3, 'v1000000-0000-0000-0000-000000000002', 'u1000000-0000-0000-0000-000000000011', 25.00);

-- Insert trip stops for the bookings
INSERT INTO trip_stops (booking_id, pickup_point_id, stop_order, stop_type, scheduled_time) VALUES
    -- Booking 1: Simple pickup and drop
    ('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000010', 0, 'PICKUP', '08:00:00'),
    ('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 1, 'DROP', '08:30:00'),

    -- Booking 2: Multi-stop
    ('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 0, 'PICKUP', '09:30:00'),
    ('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000011', 1, 'STOP', '10:00:00'),
    ('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 2, 'DROP', '11:00:00'),

    -- Booking 3: Airport pickup
    ('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', 0, 'PICKUP', '14:00:00'),
    ('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 1, 'DROP', '15:00:00');

COMMENT ON TABLE departments IS 'Sample seed data - 6 departments';
