# MSM Car Booking Database

This directory contains the PostgreSQL database schema and migrations for the MSM Car Booking System.

## Structure

```
database/
├── erd.md                    # Mermaid ERD diagram
├── README.md                 # This file
└── migrations/
    ├── 001_create_enums.sql              # Enum types
    ├── 002_create_core_tables.sql        # Core entities (users, vehicles, etc.)
    ├── 003_create_booking_tables.sql     # Booking & trip tables
    ├── 004_create_tracking_tables.sql    # GPS & odometer tracking
    ├── 005_create_notification_tables.sql # Notifications
    ├── 006_create_reporting_tables.sql   # Reports & config
    ├── 007_create_functions_triggers.sql # Functions & triggers
    ├── 008_seed_data.sql                 # Sample data (dev only)
    ├── 009_fix_critical_issues.sql       # Race condition fix, audit logs, state machine
    ├── 010_gps_partitioning.sql          # GPS table partitioning for scalability
    └── 011_add_missing_features.sql      # Cancellations, external dispatch, maintenance
```

## Running Migrations

### Using psql

```bash
# Connect to PostgreSQL
psql -U postgres -d msm_car_booking

# Run migrations in order
\i database/migrations/001_create_enums.sql
\i database/migrations/002_create_core_tables.sql
\i database/migrations/003_create_booking_tables.sql
\i database/migrations/004_create_tracking_tables.sql
\i database/migrations/005_create_notification_tables.sql
\i database/migrations/006_create_reporting_tables.sql
\i database/migrations/007_create_functions_triggers.sql

# Optional: Load seed data (development only)
\i database/migrations/008_seed_data.sql
```

### Using a script

```bash
# Create database
createdb -U postgres msm_car_booking

# Run all migrations
for f in database/migrations/*.sql; do
  psql -U postgres -d msm_car_booking -f "$f"
done
```

## Schema Overview

### Core Entities
- **departments** - Organizational units for cost tracking
- **users** - All system users (admins, drivers, employees)
- **vehicles** - Fleet vehicles
- **km_quotas** - Monthly kilometer quotas per vehicle
- **pickup_points** - Predefined/custom locations

### Booking System
- **bookings** - Main reservation records
- **trip_stops** - Individual stops within bookings

### Tracking
- **gps_locations** - Real-time vehicle positions
- **odometer_logs** - Distance readings

### Support
- **notifications** - Multi-channel notifications
- **trip_reports** - Denormalized analytics data
- **system_configs** - JSONB key-value configuration

## Key Features

1. **UUID Primary Keys** - All tables use UUIDs
2. **Automatic Timestamps** - `updated_at` triggers on all relevant tables
3. **Booking Code Generation** - Auto-generated format: `MSM-YYYYMMDD-XXXX`
4. **KM Quota Tracking** - Automatic usage updates on trip completion
5. **Quota Check Function** - `check_km_quota()` for external dispatch decisions

## ERD Diagram

View the full ERD diagram in [erd.md](./erd.md) (Mermaid format).
