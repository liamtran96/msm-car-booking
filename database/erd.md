# MSM Car Booking - Entity Relationship Diagram

```mermaid
erDiagram
    %% ==================== CORE ENTITIES ====================
    departments {
        uuid id PK
        varchar name
        varchar code UK
        varchar cost_center
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar phone
        user_role role
        user_segment user_segment
        uuid department_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    vehicles {
        uuid id PK
        varchar license_plate UK
        varchar brand
        varchar model
        int year
        int capacity
        vehicle_type vehicle_type
        vehicle_status status
        decimal current_odometer_km
        varchar gps_device_id
        uuid assigned_driver_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    km_quotas {
        uuid id PK
        uuid vehicle_id FK
        date month
        decimal quota_km
        decimal tolerance_km
        decimal used_km
        timestamp created_at
        timestamp updated_at
    }

    pickup_points {
        uuid id PK
        varchar name
        varchar address
        decimal latitude
        decimal longitude
        point_type point_type
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% ==================== BOOKING ENTITIES ====================
    bookings {
        uuid id PK
        varchar booking_code UK
        uuid requester_id FK
        uuid department_id FK
        booking_type booking_type
        booking_status status
        date scheduled_date
        time scheduled_time
        date end_date
        text purpose
        int passenger_count
        text notes
        uuid assigned_vehicle_id FK
        uuid assigned_driver_id FK
        decimal estimated_km
        decimal actual_km
        timestamp cancelled_at
        uuid cancelled_by FK
        cancellation_reason cancellation_reason
        timestamp created_at
        timestamp updated_at
    }

    trip_stops {
        uuid id PK
        uuid booking_id FK
        uuid pickup_point_id FK
        varchar custom_address
        decimal latitude
        decimal longitude
        int stop_order
        stop_type stop_type
        time scheduled_time
        timestamp actual_arrival
        timestamp created_at
    }

    external_dispatches {
        uuid id PK
        uuid booking_id FK
        external_provider provider
        varchar provider_booking_id
        varchar provider_driver_name
        decimal estimated_cost
        decimal actual_cost
        text dispatch_reason
        timestamp dispatched_at
        timestamp completed_at
    }

    %% ==================== GPS & TRACKING ====================
    gps_locations {
        uuid id PK
        uuid vehicle_id FK
        decimal latitude
        decimal longitude
        decimal speed_kmh
        decimal heading
        timestamp recorded_at
    }

    odometer_logs {
        uuid id PK
        uuid vehicle_id FK
        uuid booking_id FK
        decimal reading_km
        reading_type reading_type
        timestamp recorded_at
        uuid recorded_by FK
    }

    %% ==================== DRIVER MANAGEMENT ====================
    driver_shifts {
        uuid id PK
        uuid driver_id FK
        date shift_date
        time start_time
        time end_time
        shift_status status
        timestamp actual_start
        timestamp actual_end
        timestamp created_at
        timestamp updated_at
    }

    %% ==================== VEHICLE MAINTENANCE ====================
    vehicle_maintenance {
        uuid id PK
        uuid vehicle_id FK
        maintenance_type maintenance_type
        text description
        decimal odometer_at_service
        decimal cost
        varchar vendor_name
        timestamp started_at
        timestamp completed_at
        decimal next_service_km
        date next_service_date
        uuid performed_by FK
    }

    %% ==================== NOTIFICATIONS ====================
    notifications {
        uuid id PK
        uuid user_id FK
        uuid booking_id FK
        notification_channel channel
        notification_type notification_type
        varchar title
        text message
        notification_status status
        timestamp sent_at
        timestamp created_at
    }

    %% ==================== REPORTING & CONFIG ====================
    trip_reports {
        uuid id PK
        uuid booking_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        uuid requester_id FK
        uuid department_id FK
        date trip_date
        decimal start_km
        decimal end_km
        decimal total_km
        int duration_minutes
        decimal cost_estimate
        timestamp created_at
    }

    system_configs {
        uuid id PK
        varchar key UK
        jsonb value
        text description
        uuid updated_by FK
        timestamp updated_at
    }

    audit_logs {
        uuid id PK
        varchar table_name
        uuid record_id
        varchar action
        jsonb old_values
        jsonb new_values
        text changed_fields
        uuid changed_by FK
        timestamp changed_at
    }

    booking_sequences {
        date date_key PK
        int last_seq
    }

    %% ==================== RELATIONSHIPS ====================
    departments ||--o{ users : "employs"
    departments ||--o{ bookings : "pays_for"
    departments ||--o{ trip_reports : "billed_to"

    users ||--o{ vehicles : "assigned_driver"
    users ||--o{ bookings : "requests"
    users ||--o{ bookings : "drives"
    users ||--o{ bookings : "cancels"
    users ||--o{ notifications : "receives"
    users ||--o{ odometer_logs : "records"
    users ||--o{ driver_shifts : "works"
    users ||--o{ vehicle_maintenance : "performs"
    users ||--o{ system_configs : "updates"
    users ||--o{ audit_logs : "changes"
    users ||--o{ trip_reports : "driver_report"
    users ||--o{ trip_reports : "requester_report"

    vehicles ||--o{ km_quotas : "has_quota"
    vehicles ||--o{ bookings : "assigned_to"
    vehicles ||--o{ gps_locations : "tracked_by"
    vehicles ||--o{ odometer_logs : "logged"
    vehicles ||--o{ vehicle_maintenance : "serviced"
    vehicles ||--o{ trip_reports : "used_in"

    bookings ||--o{ trip_stops : "contains"
    bookings ||--o{ notifications : "triggers"
    bookings ||--o{ odometer_logs : "recorded_for"
    bookings ||--o| trip_reports : "generates"
    bookings ||--o| external_dispatches : "redirected_to"

    pickup_points ||--o{ trip_stops : "location_for"
```

## Diagram Legend

| Symbol | Meaning |
|--------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |
| `||--o{` | One-to-Many relationship |
| `||--o|` | One-to-One (optional) relationship |

## Entity Groups

### Core Entities
| Table | Description |
|-------|-------------|
| `departments` | Organizational units for cost tracking |
| `users` | All system users (admins, drivers, employees) |
| `vehicles` | Fleet vehicles with GPS tracking |
| `km_quotas` | Monthly kilometer quotas per vehicle |
| `pickup_points` | Predefined and custom locations |

### Booking System
| Table | Description |
|-------|-------------|
| `bookings` | Main reservation records |
| `trip_stops` | Individual stops within bookings |
| `external_dispatches` | Records for Grab/Taxi redirects |
| `booking_sequences` | Thread-safe booking code generation |

### Tracking & GPS
| Table | Description |
|-------|-------------|
| `gps_locations` | Real-time vehicle positions (partitioned) |
| `odometer_logs` | Distance readings for trips |

### Operations
| Table | Description |
|-------|-------------|
| `driver_shifts` | Driver schedules and availability |
| `vehicle_maintenance` | Service and repair history |
| `notifications` | Multi-channel notification queue |

### Reporting & Audit
| Table | Description |
|-------|-------------|
| `trip_reports` | Denormalized analytics data |
| `system_configs` | JSONB key-value configuration |
| `audit_logs` | Change tracking for critical tables |

## Enum Types

```sql
-- User & Access
user_role: ADMIN, PIC, GA, DRIVER, EMPLOYEE
user_segment: DAILY, SOMETIMES

-- Vehicles
vehicle_type: SEDAN, SUV, VAN, BUS
vehicle_status: AVAILABLE, IN_USE, MAINTENANCE, INACTIVE

-- Locations
point_type: FIXED, FLEXIBLE

-- Bookings
booking_type: SINGLE_TRIP, MULTI_STOP, BLOCK_SCHEDULE
booking_status: PENDING, CONFIRMED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, REDIRECTED_EXTERNAL
stop_type: PICKUP, DROP, STOP
cancellation_reason: USER_REQUEST, NO_VEHICLE_AVAILABLE, NO_DRIVER_AVAILABLE, QUOTA_EXCEEDED, VEHICLE_BREAKDOWN, SCHEDULE_CONFLICT, WEATHER, EMERGENCY, DUPLICATE, OTHER

-- External Providers
external_provider: GRAB, GOJEK, BE, TAXI_MAI_LINH, TAXI_VINASUN, OTHER

-- Operations
reading_type: TRIP_START, TRIP_END, DAILY_CHECK
shift_status: SCHEDULED, ACTIVE, COMPLETED, ABSENT, CANCELLED
maintenance_type: SCHEDULED, REPAIR, INSPECTION, TIRE_SERVICE, OIL_CHANGE, CLEANING, OTHER

-- Notifications
notification_channel: APP_PUSH, AUTO_CALL, SMS
notification_type: BOOKING_CONFIRMED, VEHICLE_ARRIVING, TRIP_STARTED, TRIP_COMPLETED, BOOKING_CANCELLED
notification_status: PENDING, SENT, DELIVERED, FAILED
```
