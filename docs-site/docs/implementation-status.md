---
id: implementation-status
title: Implementation Status
sidebar_position: 0
---

# Implementation Status

**Last Updated:** 2026-02-03

This document tracks the implementation status of the MSM Car Booking system against the 32-item feature estimation list and identifies gaps.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **DONE** | Backend + Frontend fully implemented |
| **BE ONLY** | Backend implemented, no frontend UI |
| **PARTIAL** | Entity/schema exists but logic incomplete |
| **NOT STARTED** | No implementation |

---

## Feature Estimation List Status

### Authentication & Authorization

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 2 | SSO Integration | NOT STARTED | Passport.js JWT auth exists | - | SSO strategy not coded. Depends on corporate provider (SAML/OIDC/AD). |
| 3 | User Management | BE ONLY | Full CRUD (11 endpoints) | Placeholder page only | Backend: create, list, update, delete, restore, password reset. Frontend: `UsersPage.tsx` shows title only. |
| 4 | Authorization (RBAC) | **DONE** | 5 roles, guards, decorators | RoleGuard + ProtectedRoute | Fully working role-based access control. |

### System Configuration

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 5 | System Configuration | PARTIAL | `SystemConfig` entity exists | - | No controller, no service, no endpoints, no UI. Entire module API needs building. |

### Reporting

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 6 | Cost Summary Report | NOT STARTED | - | - | No reporting module exists at all. |
| 7 | Total KM Report | NOT STARTED | `KmQuota` entity exists | - | No reporting endpoints. |
| 8 | Trip History Report | NOT STARTED | Trip data entities exist | - | No reporting endpoints. |

### Vehicle Management

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 9 | Vehicle List | BE ONLY | `GET /vehicles`, `GET /vehicles/available`, `GET /vehicles/:id` | - | Read-only endpoints. No frontend page. |
| 10 | Vehicle CRUD | PARTIAL | Only GET endpoints | - | **Missing:** POST, PATCH, DELETE endpoints. No DTOs for create/update. |
| 11 | KM Quota Setup | PARTIAL | `KmQuota` entity exists | - | No CRUD endpoints for quota management. |
| 12 | Vehicle Status (real-time) | PARTIAL | Status field on entity, `updateStatus()` in service | - | No real-time status update mechanism. No HTTP endpoint for status update. |

### GPS & Location

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 13 | GPS Tracking (real-time map) | PARTIAL | `GET /gps/positions`, `GET /gps/vehicle/:id/history` | - | Backend read-only endpoints exist. No GPS data ingestion endpoint. No map UI. |
| 14 | Route Playback | NOT STARTED | GPS history endpoint exists | - | No playback UI or animated map component. |
| 15 | Pickup Point Management | PARTIAL | `PickupPoint` entity exists | - | **No controller, no service.** Locations module has entity only. |

### Booking Calendar

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 16 | Vehicle Calendar/Timeline | NOT STARTED | - | - | No calendar view implementation. |

### Dispatching

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 17 | Vehicle Matching Algorithm | NOT STARTED | - | - | Design doc exists at `docs-site/docs/backend/vehicle-matching-algorithm.md`. No code implementation. |
| 18 | Over-quota Warning | NOT STARTED | Basic quota check in booking service | - | No PIC alerting mechanism. |

### Booking Management

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 19 | Booking Form | BE ONLY | `createBooking()` service method exists | - | **Critical gap:** Service logic exists but **no POST /bookings HTTP endpoint**. No frontend form. |
| 20 | Multi-stop | PARTIAL | `TripStop` entity and schema ready | - | No multi-stop creation logic in service. No UI. |
| 21 | Block Schedule | PARTIAL | `BLOCK_SCHEDULE` booking type defined | - | Type supported in enum but no dedicated UI or extended booking logic. |
| 22 | Cancel Booking | PARTIAL | `CancellationReason` enum, cancellation fields on entity | - | Full cancellation workflow (validation, notifications) incomplete. No cancel endpoint. |
| 23 | Booking List | BE ONLY | `GET /bookings`, `GET /bookings/:id`, `GET /bookings/driver/:driverId` | Placeholder page | Backend list with status filter. Frontend `BookingsPage.tsx` shows title only. |
| 24 | Booking Status | **DONE** | Full 7-status workflow in `BookingStatus` enum | - | Status transitions implemented in `updateStatus()` service method. |
| 25 | Pending Approval List | **DONE** | `GET /approvals/pending` | - | Fully working backend. No dedicated frontend UI (could be part of booking list). |
| 26 | Approval Workflow | **DONE** | Full approval logic with auto-approve rules | - | 3 approval types (MANAGER_APPROVAL, CC_ONLY, AUTO_APPROVED) based on user segment and position level. |

### External Dispatch

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 27 | External Dispatch Queue | PARTIAL | `ExternalDispatch` entity exists | - | Basic entity structure. No queue management endpoints or UI. |
| 28 | External Dispatch Info Form | PARTIAL | Entity fields for provider, cost, driver info | - | No input form or CRUD endpoints. |
| 29 | External Dispatch Status Update | PARTIAL | Entity supports status tracking | - | No notification-back logic or status update endpoint. |

### Communication (PBX/TTS)

| STT | Feature | Status | Backend | Frontend | Notes |
|-----|---------|--------|---------|----------|-------|
| 30 | PBX Gateway Integration | NOT STARTED | - | - | No telephony integration code. |
| 31 | Auto-call Scenarios | NOT STARTED | `NotificationType` enum includes call types | - | Enum values defined but no trigger logic. |
| 32 | Text-to-Speech (Vietnamese) | NOT STARTED | - | - | No TTS implementation. |

---

## Features Not in Estimation List

These are features documented in business requirements or already implemented in the codebase, but **missing from the 32-item estimation list**.

### High Priority

| # | Feature | Current State | What's Needed |
|---|---------|--------------|---------------|
| A | **Chat System UI (Web)** | Backend fully implemented (WebSocket + REST, 8 endpoints) | Frontend UI only. Core feature for BLOCK_SCHEDULE bookings. |
| B | **Driver Shift Management UI (Web)** | Backend fully implemented (13 endpoints) | Frontend UI for PIC/Admin to manage shifts. Required for dispatching. |
| C | **Driver Mobile APIs** (13 features) | Entities exist (TripEvent, TripExpense, OdometerLog) but no endpoints | Backend APIs: trip list, accept/reject, start/end trip, GPS validation, expenses, odometer, KM summary. |
| D | **Employee Mobile APIs** (8 features) | Booking creation service exists but no HTTP endpoint | Backend APIs: booking creation, multi-stop, block booking, cancel (30 min rule), booking history. |
| E | **Trip Execution Flow** | Entities exist (TripEvent, TripReport, TripExpense) but no controller or service | Core operational loop: driver accepts -> starts -> records expenses -> completes. No endpoints. |

### Medium Priority

| # | Feature | Current State | What's Needed |
|---|---------|--------------|---------------|
| F | **Push Notifications (APP_PUSH)** | `NotificationChannel.APP_PUSH` enum defined, basic read endpoints | FCM/APNs integration. Primary notification channel. |
| G | **SMS Notifications** | `NotificationChannel.SMS` enum defined | SMS gateway integration (no provider selected). |
| H | **Trip Expense Tracking** | `TripExpense` entity with toll/parking/fuel/repair types | CRUD endpoints + receipt upload support. |
| I | **Odometer Recording** | `OdometerLog` entity with fraud detection fields | CRUD endpoints + validation logic. |
| K | **Notification Center/Inbox** | `GET /notifications/user/:userId`, `PATCH /notifications/:id/read` | In-app notification inbox UI with read/unread status. |

### Low Priority

| # | Feature | Current State | What's Needed |
|---|---------|--------------|---------------|
| J | **Vehicle Maintenance Management** | `VehicleMaintenance` entity exists | CRUD endpoints + UI for service history and next-service reminders. |
| L | **Department Cost Allocation** | Departments have cost center fields | Allocation logic + reporting endpoints. |
| M | **Vehicle Utilization Analytics** | No implementation | Analytics dashboard for fleet utilization rates. |

---

## Architecture Gaps

Critical backend gaps that block frontend development:

### 1. No Booking Creation Endpoint

**Module:** `bookings`
**Issue:** `BookingsService.createBooking()` exists with full business logic (approval type determination, atomic booking code generation, approval record creation) but there is **no POST /bookings HTTP endpoint** in `BookingsController`.
**Impact:** Blocks booking form (STT 19), employee mobile booking (D).
**Fix:** Add `POST /bookings` endpoint with `CreateBookingDto`.

### 2. No Vehicle CRUD Endpoints

**Module:** `vehicles`
**Issue:** `VehiclesController` only has GET endpoints. No POST, PATCH, or DELETE.
**Impact:** Blocks vehicle CRUD (STT 10), KM quota setup (STT 11), vehicle status update (STT 12).
**Fix:** Add `CreateVehicleDto`, `UpdateVehicleDto`, and full CRUD endpoints. Add `VehiclesService` methods for create, update, delete.

### 3. No System Config Controller

**Module:** `system`
**Issue:** `SystemConfig` entity and `AuditLog` entity exist. No controller, no service.
**Impact:** Blocks system configuration (STT 5).
**Fix:** Create `SystemController` with CRUD endpoints for configuration management.

### 4. No Reporting Module

**Issue:** No `reports` module directory exists at all.
**Impact:** Blocks cost summary (STT 6), KM report (STT 7), trip history report (STT 8).
**Fix:** Create new `ReportsModule` with aggregation query endpoints.

### 5. Locations Module Incomplete

**Module:** `locations`
**Issue:** `PickupPoint` entity exists. No controller, no service.
**Impact:** Blocks pickup point management (STT 15).
**Fix:** Create `LocationsController` and `LocationsService` with full CRUD.

### 6. No Trip Execution Endpoints

**Module:** `bookings` (trip-related entities live here)
**Issue:** `TripEvent`, `TripExpense`, `TripReport`, `TripStop` entities exist with no controller or service methods.
**Impact:** Blocks trip execution flow (E), driver mobile APIs (C), expense tracking (H).
**Fix:** Create `TripsController` and `TripsService` (could be separate module or sub-controller under bookings).

### 7. Missing DTOs

The following DTOs are needed but don't exist:

| DTO | Module | Purpose |
|-----|--------|---------|
| `CreateBookingDto` | bookings | Booking creation validation |
| `UpdateBookingDto` | bookings | Booking update validation |
| `CancelBookingDto` | bookings | Cancellation with reason |
| `AssignDriverDto` | bookings | Driver assignment validation |
| `CreateVehicleDto` | vehicles | Vehicle creation validation |
| `UpdateVehicleDto` | vehicles | Vehicle update validation |
| `CreateKmQuotaDto` | vehicles | KM quota creation |
| `UpdateKmQuotaDto` | vehicles | KM quota update |
| `CreatePickupPointDto` | locations | Pickup point creation |
| `UpdatePickupPointDto` | locations | Pickup point update |
| `SystemConfigDto` | system | Configuration management |
| `CreateTripEventDto` | trips | Trip event logging |
| `CreateTripExpenseDto` | trips | Expense recording |
| `RecordOdometerDto` | trips | Odometer reading |

---

## Backend API Endpoint Inventory

### Fully Implemented Endpoints

| Module | Endpoint | Method | Auth | Roles |
|--------|----------|--------|------|-------|
| **Auth** | `/auth/login` | POST | Public | - |
| **Auth** | `/auth/logout` | POST | JWT | All |
| **Auth** | `/auth/me` | GET | JWT | All |
| **Users** | `/users` | POST | JWT | ADMIN |
| **Users** | `/users` | GET | JWT | ADMIN, PIC |
| **Users** | `/users/drivers` | GET | JWT | All |
| **Users** | `/users/drivers/available` | GET | JWT | All |
| **Users** | `/users/me` | GET | JWT | All |
| **Users** | `/users/me` | PATCH | JWT | All |
| **Users** | `/users/me/password` | PATCH | JWT | All |
| **Users** | `/users/:id` | GET | JWT | ADMIN, PIC |
| **Users** | `/users/:id` | PATCH | JWT | ADMIN |
| **Users** | `/users/:id/password/reset` | PATCH | JWT | ADMIN |
| **Users** | `/users/:id` | DELETE | JWT | ADMIN |
| **Users** | `/users/:id/restore` | PATCH | JWT | ADMIN |
| **Driver Shifts** | `/driver-shifts` | POST | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts` | GET | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/today` | GET | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/available` | GET | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/my-shifts` | GET | JWT | DRIVER |
| **Driver Shifts** | `/driver-shifts/driver/:driverId` | GET | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/:id` | GET | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/:id` | PATCH | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/:id/start` | PATCH | JWT | DRIVER |
| **Driver Shifts** | `/driver-shifts/:id/end` | PATCH | JWT | DRIVER |
| **Driver Shifts** | `/driver-shifts/:id/cancel` | PATCH | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/:id/absent` | PATCH | JWT | ADMIN, PIC |
| **Driver Shifts** | `/driver-shifts/:id` | DELETE | JWT | ADMIN |
| **Approvals** | `/approvals/pending` | GET | JWT | All |
| **Approvals** | `/approvals/my-requests` | GET | JWT | All |
| **Approvals** | `/approvals/:id` | GET | JWT | Authorized |
| **Approvals** | `/approvals/booking/:bookingId` | GET | JWT | All |
| **Approvals** | `/approvals/:id/respond` | POST | JWT | Approver |
| **Approvals** | `/approvals/:id/approve` | POST | JWT | Approver |
| **Approvals** | `/approvals/:id/reject` | POST | JWT | Approver |
| **Chat** | `/chat/rooms` | GET | JWT | All |
| **Chat** | `/chat/rooms/:id` | GET | JWT | All |
| **Chat** | `/chat/rooms/booking/:bookingId` | GET | JWT | All |
| **Chat** | `/chat/rooms/:id/messages` | GET | JWT | All |
| **Chat** | `/chat/rooms/:id/messages` | POST | JWT | All |
| **Chat** | `/chat/rooms/:id/schedule-change` | POST | JWT | All |
| **Chat** | `/chat/rooms/:id/read` | POST | JWT | All |
| **Chat** | `/chat/unread-count` | GET | JWT | All |
| **Departments** | `/departments` | GET | JWT | All |
| **Departments** | `/departments/:id` | GET | JWT | All |

### Read-Only Endpoints (Missing Write Operations)

| Module | Existing Endpoints | Missing Endpoints |
|--------|-------------------|-------------------|
| **Bookings** | GET /bookings, GET /bookings/:id, GET /bookings/driver/:driverId | POST /bookings, PATCH /bookings/:id, PATCH /bookings/:id/status, PATCH /bookings/:id/assign-driver, PATCH /bookings/:id/cancel |
| **Vehicles** | GET /vehicles, GET /vehicles/available, GET /vehicles/:id | POST /vehicles, PATCH /vehicles/:id, DELETE /vehicles/:id, PATCH /vehicles/:id/status |
| **GPS** | GET /gps/positions, GET /gps/vehicle/:vehicleId/history | POST /gps/record (GPS data ingestion) |
| **Notifications** | GET /notifications/user/:userId, PATCH /notifications/:id/read | POST /notifications (create), GET /notifications/unread-count, DELETE /notifications/:id |

### Missing Controllers (Entity Exists, No API)

| Module | Entity | Required Endpoints |
|--------|--------|--------------------|
| **System** | `SystemConfig`, `AuditLog` | GET/POST/PATCH/DELETE /system/config, GET /system/audit-logs |
| **Locations** | `PickupPoint` | GET/POST/PATCH/DELETE /locations/pickup-points |
| **Trips** | `TripEvent`, `TripExpense`, `TripReport` | POST /trips/:id/events, POST /trips/:id/expenses, POST /trips/:id/report |
| **KM Quotas** | `KmQuota` | GET/POST/PATCH/DELETE /vehicles/:id/km-quotas |
| **Odometer** | `OdometerLog` | POST /vehicles/:id/odometer, GET /vehicles/:id/odometer-history |
| **Maintenance** | `VehicleMaintenance` | GET/POST/PATCH /vehicles/:id/maintenance |
| **External Dispatch** | `ExternalDispatch` | GET/POST/PATCH /external-dispatches |
| **Reports** | (none) | GET /reports/cost-summary, GET /reports/km-usage, GET /reports/trip-history |

---

## Frontend Page Status

| Page/Feature | Status | Location | Notes |
|-------------|--------|----------|-------|
| Login | **DONE** | `features/auth/` | Full form with Zod validation, httpOnly cookie auth, auto-redirect |
| Dashboard | Placeholder | `features/dashboard/pages/DashboardPage.tsx` | Welcome message only |
| Bookings | Placeholder | `features/bookings/pages/BookingsPage.tsx` | Title and description only |
| User Management | Placeholder | `features/users/pages/UsersPage.tsx` | Title and description only |
| Vehicle Management | NOT STARTED | - | No components or pages |
| Chat System | NOT STARTED | - | Backend fully built, needs UI |
| Driver Shift Management | NOT STARTED | - | Backend fully built (13 endpoints), needs UI |
| Approval Management | NOT STARTED | - | Backend fully built, needs UI |
| Notification Inbox | NOT STARTED | - | Backend has basic endpoints, needs UI |
| Reports/Analytics | NOT STARTED | - | No backend module, no UI |
| GPS Tracking Map | NOT STARTED | - | Backend has read endpoints, no map UI |
| System Configuration | NOT STARTED | - | No backend endpoints, no UI |
| Pickup Point Management | NOT STARTED | - | No backend endpoints, no UI |

### Frontend Infrastructure (DONE)

- Authentication system (Zustand store, httpOnly cookies, auto-refresh)
- Protected routes with role-based access
- App layout with navigation
- Axios interceptors (auto-logout on 401)
- TanStack Query configuration
- Shadcn UI component library (Button, Card, Input, Label, Sonner)
- Glassmorphism design system
- Type system (enums, user types, API types)
- Utility functions (formatters, UUID validation, cn helper)
- E2E testing with Playwright

---

## Phased Implementation Recommendation

### Phase 1: Core (Backend Gaps + Key Frontend)

**Priority:** Fix missing backend endpoints, then build essential frontend pages.

1. Vehicle CRUD endpoints (POST/PATCH/DELETE) + DTOs
2. Booking creation endpoint (POST /bookings) + DTO
3. Booking status update + driver assignment + cancellation endpoints
4. System Config controller + service
5. Locations/Pickup Points controller + service
6. KM Quota CRUD endpoints
7. User Management frontend page (backend already complete)
8. Vehicle Management frontend page
9. Booking Management frontend (list + form)
10. Driver Shift Management frontend (backend already complete)
11. Chat UI frontend (backend already complete)
12. Approval Management frontend

### Phase 2: Reporting & External Dispatch

1. Reports module (cost summary, KM report, trip history)
2. GPS tracking real-time map
3. Route playback UI
4. External dispatch queue management
5. Trip expense tracking endpoints
6. Dashboard with analytics widgets

### Phase 3: Communication & Notifications

1. Push notification integration (FCM/APNs)
2. SMS gateway integration
3. PBX gateway integration
4. Auto-call scenarios
5. Text-to-Speech (Vietnamese)
6. Notification center/inbox UI

### Phase 4: Advanced Features

1. Vehicle matching algorithm implementation
2. Vehicle calendar/timeline view
3. Vehicle maintenance management
4. Department cost allocation
5. Vehicle utilization analytics
6. Odometer recording with fraud detection

---

## Testing Coverage

### Existing Tests

| Type | Files | Coverage |
|------|-------|----------|
| **Unit Tests** | bookings, chat, notifications (service + controller specs) | Services and controllers for 3 modules |
| **E2E Tests** | auth, users, driver-shifts, bookings, chat, notifications, gps, vehicles, departments, approvals | 10 test suites covering all existing endpoints |
| **Integration Tests** | approval-workflow, booking-flow, chat-messaging, multi-tenant | 4 integration test suites |

### Testing Gaps

- No unit tests for: vehicles service, users service, departments service, GPS service, approvals service
- No E2E tests for: system config, locations, trips (endpoints don't exist yet)
- No performance/load tests
- No mobile API tests
