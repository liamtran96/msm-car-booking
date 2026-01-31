# MSM Car Booking Database

This directory contains the PostgreSQL database schema and migrations for the MSM Car Booking System.

## Location

This folder is at `/backend/database/` because:
- NestJS/TypeORM manages the database as single source of truth
- Database concerns are co-located with the backend service
- TypeORM CLI handles migrations going forward

## Structure

```
backend/
├── database/                           # Raw SQL reference (legacy)
│   ├── README.md                       # This file
│   ├── erd.md                          # Mermaid ERD diagram
│   └── migrations/
│       ├── 000_initial_schema.sql      # ⭐ CONSOLIDATED INITIAL SCHEMA
│       └── 001-013_*.sql               # Legacy incremental migrations
│
└── src/database/                       # TypeORM managed (active)
    ├── data-source.ts                  # TypeORM CLI configuration
    ├── migrations/                     # TypeORM migrations (going forward)
    └── seeds/                          # Seed scripts
```

## TypeORM Migration Commands

```bash
# Generate migration from entity changes
pnpm migration:generate

# Create empty migration
pnpm migration:create

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Sync schema (development only - NOT for production)
pnpm schema:sync

# Drop all tables
pnpm schema:drop

# Reset database (drop + run migrations)
pnpm db:reset
```

## Quick Start (Fresh Installation)

### Option 1: Use Raw SQL Schema (Recommended for initial setup)

```bash
# With Docker
docker exec -i msm_postgres psql -U postgres -d msm_car_booking < backend/database/migrations/000_initial_schema.sql
```

### Option 2: Use TypeORM Schema Sync (Development)

```bash
cd backend
pnpm schema:sync
```

## Schema Summary

### Tables (20 Total)

| Category | Tables | Description |
|----------|--------|-------------|
| **Core (5)** | `departments`, `users`, `vehicles`, `km_quotas`, `pickup_points` | Organizational units, users, fleet |
| **Booking (4)** | `bookings`, `booking_sequences`, `trip_stops`, `external_dispatches` | Reservations and external redirects |
| **Tracking (2)** | `gps_locations` (partitioned), `odometer_logs` | Real-time GPS, distance tracking |
| **Driver (3)** | `driver_shifts`, `trip_expenses`, `trip_events` | Schedules, expenses, timeline |
| **Operations (2)** | `vehicle_maintenance`, `notifications` | Service history, multi-channel alerts |
| **Reporting (3)** | `trip_reports`, `system_configs`, `audit_logs` | Analytics, config, compliance |

### TypeORM Entities

| Module | Entities |
|--------|----------|
| `users` | User |
| `departments` | Department |
| `vehicles` | Vehicle, KmQuota, VehicleMaintenance |
| `bookings` | Booking, BookingSequence, TripStop, TripEvent, TripReport, ExternalDispatch |
| `gps` | GpsLocation |
| `notifications` | Notification |
| `locations` | PickupPoint |
| `drivers` | DriverShift, TripExpense, OdometerLog |
| `system` | SystemConfig, AuditLog |

### Enum Types (18 Total)

| Category | Enums |
|----------|-------|
| User & Access | `user_role`, `user_segment` |
| Vehicles | `vehicle_type`, `vehicle_status` |
| Locations | `point_type` |
| Bookings | `booking_type`, `booking_status`, `stop_type`, `cancellation_reason` |
| Driver App | `driver_response_status`, `expense_type`, `trip_event_type` |
| External | `external_provider` |
| Operations | `reading_type`, `shift_status`, `maintenance_type` |
| Notifications | `notification_channel`, `notification_type`, `notification_status` |

## Key Features

1. **UUID Primary Keys** - All tables use UUIDs for distributed-friendly IDs
2. **Soft Deletes** - `is_active` flags preserve referential integrity
3. **Automatic Timestamps** - Triggers update `updated_at` on every change
4. **Booking Code Generation** - Thread-safe: `MSM-YYYYMMDD-XXXX`
5. **KM Quota Tracking** - Automatic usage updates on trip completion
6. **GPS Partitioning** - Monthly partitions for time-series performance
7. **Status State Machine** - Database-enforced valid status transitions
8. **Expense Approval Workflow** - NULL=pending, true=approved, false=rejected
9. **Audit Logging** - Full change tracking for compliance

## ERD Diagram

View the full entity relationship diagram in [erd.md](./erd.md) (Mermaid format).

## Status State Machine

```
PENDING → CONFIRMED → ASSIGNED → IN_PROGRESS → COMPLETED
    ↓         ↓           ↓           ↓
CANCELLED  CANCELLED   CANCELLED   CANCELLED
              ↓
    REDIRECTED_EXTERNAL
```

## Multi-Tenant Considerations

For future multi-tenant support, add `tenant_id` column to all tables and create composite indexes with `tenant_id` first.
