# Backend Documentation

NestJS-based backend API for the MSM Car Booking system.

**Last Updated:** 2026-02-03

## Architecture

- **Framework:** NestJS 10 with TypeScript
- **Database:** PostgreSQL 16 with TypeORM
- **Authentication:** JWT with Passport.js (httpOnly cookies + Bearer token)
- **Real-time:** Socket.io (WebSocket) for chat
- **API Documentation:** Swagger/OpenAPI
- **Architecture Pattern:** Modular, domain-driven

## Documentation Index

- **[Security Features](./security.md)** - Authentication, rate limiting, CORS, HTTP headers, WebSocket security
- **[Database Setup & Migrations](./database-setup.md)** - Development and production database initialization, migration workflow
- **[Vehicle Matching Algorithm](./vehicle-matching-algorithm.md)** - Automated vehicle-driver assignment with weighted scoring (design only, not yet implemented)

---

## Module Inventory

### Fully Implemented Modules

| Module | Controller | Service | Entities | DTOs | Endpoints | Tests |
|--------|-----------|---------|----------|------|-----------|-------|
| **Auth** | AuthController | AuthService | - | LoginDto | 3 | E2E |
| **Users** | UsersController | UsersService | User | 6 DTOs | 11 | E2E |
| **Driver Shifts** | DriverShiftsController | DriverShiftsService | DriverShift | DriverShiftDto | 13 | E2E |
| **Approvals** | ApprovalsController | ApprovalsService | BookingApproval | RespondApprovalDto | 7 | E2E, Integration |
| **Chat** | ChatController + ChatGateway | ChatService | ChatRoom, ChatMessage | 2 DTOs | 8 REST + WebSocket | Unit, E2E, Integration |
| **Departments** | DepartmentsController | DepartmentsService | Department | - | 2 | E2E |

### Partially Implemented Modules

| Module | What Exists | What's Missing |
|--------|------------|----------------|
| **Bookings** | Controller (3 GET endpoints), Service (full business logic) | POST/PATCH/DELETE endpoints, CreateBookingDto, UpdateBookingDto, CancelBookingDto |
| **Vehicles** | Controller (3 GET endpoints), Service (read + updateStatus) | POST/PATCH/DELETE endpoints, CreateVehicleDto, UpdateVehicleDto |
| **GPS** | Controller (2 GET endpoints), Service (read only) | GPS data ingestion endpoint (POST) |
| **Notifications** | Controller (2 endpoints), Service (read only) | Create notification endpoint, sending mechanism |

### Modules Without Controllers

| Module | Entities Present | What's Needed |
|--------|-----------------|---------------|
| **System** | SystemConfig, AuditLog | Controller, Service, DTOs for configuration CRUD |
| **Locations** | PickupPoint | Controller, Service, DTOs for pickup point CRUD |

### Modules Not Yet Created

| Module | Related Entities (in bookings module) | What's Needed |
|--------|--------------------------------------|---------------|
| **Trips** | TripEvent, TripExpense, TripReport, TripStop | New module or sub-controller with CRUD endpoints |
| **Reports** | (none) | New module with aggregation query endpoints |
| **KM Quotas** | KmQuota (in vehicles module) | CRUD endpoints (could be sub-controller under vehicles) |
| **Odometer** | OdometerLog (in vehicles module) | Recording endpoints with validation |
| **Maintenance** | VehicleMaintenance (in vehicles module) | CRUD endpoints for service history |
| **External Dispatch** | ExternalDispatch (in bookings module) | Queue management and status tracking endpoints |

---

## Endpoint Reference

### Auth Module (3 endpoints)

```
POST   /auth/login          # Login with email/password, sets httpOnly cookie
POST   /auth/logout         # Logout, clears cookie
GET    /auth/me             # Get current authenticated user
```

### Users Module (11 endpoints)

```
POST   /users               # Create user (ADMIN only)
GET    /users               # List users with pagination (ADMIN, PIC)
GET    /users/drivers       # List all drivers
GET    /users/drivers/available  # List available drivers
GET    /users/me            # Get current user profile
PATCH  /users/me            # Update current user profile
PATCH  /users/me/password   # Change own password
GET    /users/:id           # Get user by ID (ADMIN, PIC)
PATCH  /users/:id           # Update user (ADMIN only)
PATCH  /users/:id/password/reset  # Admin password reset
DELETE /users/:id           # Soft delete user (ADMIN only)
PATCH  /users/:id/restore   # Restore deactivated user (ADMIN only)
```

### Driver Shifts Module (13 endpoints)

```
POST   /driver-shifts                   # Create shift (ADMIN, PIC)
GET    /driver-shifts                   # List shifts with filters (ADMIN, PIC)
GET    /driver-shifts/today             # Get today's shifts
GET    /driver-shifts/available         # Get available drivers for date/time
GET    /driver-shifts/my-shifts         # Get current driver's shifts (DRIVER)
GET    /driver-shifts/driver/:driverId  # Get driver's shifts
GET    /driver-shifts/:id               # Get shift by ID
PATCH  /driver-shifts/:id               # Update shift (ADMIN, PIC)
PATCH  /driver-shifts/:id/start         # Start shift (DRIVER)
PATCH  /driver-shifts/:id/end           # End shift (DRIVER)
PATCH  /driver-shifts/:id/cancel        # Cancel shift (ADMIN, PIC)
PATCH  /driver-shifts/:id/absent        # Mark absent (ADMIN, PIC)
DELETE /driver-shifts/:id               # Delete shift (ADMIN)
```

### Bookings Module (3 endpoints - READ ONLY)

```
GET    /bookings                        # List all bookings (optional ?status= filter)
GET    /bookings/:id                    # Get booking by ID
GET    /bookings/driver/:driverId       # Get bookings by driver
```

**Service methods without HTTP endpoints:**
- `createBooking(data)` - Full business logic with approval workflow
- `assignDriver(bookingId, driverId)` - Driver assignment with chat room creation
- `updateStatus(bookingId, status)` - Status update with chat room lifecycle

### Approvals Module (7 endpoints)

```
GET    /approvals/pending               # Pending approvals for current user
GET    /approvals/my-requests           # Approval requests created by user
GET    /approvals/:id                   # Get approval details (authorized only)
GET    /approvals/booking/:bookingId    # Get approval by booking ID
POST   /approvals/:id/respond           # Respond to approval
POST   /approvals/:id/approve           # Approve request
POST   /approvals/:id/reject            # Reject request
```

### Chat Module (8 REST endpoints + WebSocket)

```
GET    /chat/rooms                      # Get all chat rooms for user
GET    /chat/rooms/:id                  # Get chat room by ID
GET    /chat/rooms/booking/:bookingId   # Get or create room for booking
GET    /chat/rooms/:id/messages         # Get messages (?limit=50&offset=0)
POST   /chat/rooms/:id/messages         # Send message
POST   /chat/rooms/:id/schedule-change  # Send schedule change notification
POST   /chat/rooms/:id/read             # Mark messages as read
GET    /chat/unread-count               # Get unread message count
```

**WebSocket Gateway:** `/chat` namespace (Socket.io with JWT auth)

### Vehicles Module (3 endpoints - READ ONLY)

```
GET    /vehicles                        # List all active vehicles
GET    /vehicles/available              # List available vehicles
GET    /vehicles/:id                    # Get vehicle by ID
```

### GPS Module (2 endpoints - READ ONLY)

```
GET    /gps/positions                   # Latest positions for all vehicles
GET    /gps/vehicle/:vehicleId/history  # Vehicle GPS history (?hours=1)
```

### Notifications Module (2 endpoints)

```
GET    /notifications/user/:userId      # Get notifications for user
PATCH  /notifications/:id/read          # Mark notification as read
```

### Departments Module (2 endpoints)

```
GET    /departments                     # List all departments
GET    /departments/:id                 # Get department by ID
```

---

## Entity Inventory

### 19 Entities Across 6 Domains

**User Domain:**
- `User` - Roles, segments, position levels, manager hierarchy
- `Department` - Organization structure with cost centers
- `DriverShift` - Shift scheduling with 5 statuses

**Booking Domain:**
- `Booking` - Core booking with 8 statuses, approval types, driver response
- `BookingSequence` - Atomic booking code generation (MSM-YYYYMMDD-XXXX)
- `BookingApproval` - Approval workflow tracking
- `TripStop` - Multi-stop booking details
- `TripEvent` - Trip lifecycle event log
- `TripExpense` - Toll, parking, fuel, repair expenses
- `TripReport` - Trip completion reports
- `ExternalDispatch` - External provider bookings

**Fleet Domain:**
- `Vehicle` - Fleet with status, odometer, GPS device, assigned driver
- `KmQuota` - Monthly KM quotas with tolerance
- `OdometerLog` - Odometer readings with fraud detection fields
- `VehicleMaintenance` - Service history records

**Chat Domain:**
- `ChatRoom` - Tied to BLOCK_SCHEDULE bookings
- `ChatMessage` - Messages with delivery/read status

**Tracking Domain:**
- `GpsLocation` - Real-time vehicle positions
- `Notification` - Multi-channel notifications (APP_PUSH, AUTO_CALL, SMS)
- `PickupPoint` - Fixed and flexible pickup locations

**System Domain:**
- `SystemConfig` - Key-value configuration
- `AuditLog` - Audit trail for critical operations

---

## Quick Links

### Development

```bash
cd backend

pnpm start:dev          # Start in watch mode
pnpm start:debug        # Start with debugger
pnpm build              # Build for production
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
```

### Testing

```bash
pnpm test               # Unit tests
pnpm test:watch         # Unit tests in watch mode
pnpm test:cov           # Unit tests with coverage
pnpm test:e2e           # E2E tests (requires Docker)
pnpm test:integration   # Integration tests (requires Docker)
pnpm test:all           # All tests
```

### Database

```bash
pnpm typeorm migration:generate src/database/migrations/Name
pnpm typeorm migration:run
pnpm typeorm migration:revert
pnpm seed:run
pnpm db:reset
```

## Related Documentation

- [Implementation Status](../implementation-status.md)
- [DevOps & Deployment](../devops/index.md)
- [Software Requirements Specification](../software-requirements-specification.md)
- [System Workflows](../system-workflows.md)
