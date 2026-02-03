---
id: glossary
title: Glossary
sidebar_position: 6
---

# Glossary

Terminology and abbreviations used throughout the MSM Car Booking System.

---

## Domain Terms

| Term | Definition |
|------|-----------|
| **SIC** | Contract employee category with fixed daily routes (DAILY segment) |
| **PIC** | Person In Charge - dispatch operator managing vehicle assignments |
| **GA** | General Affairs - team managing external vehicle rentals |
| **KM Quota** | Monthly kilometer allowance per vehicle with configurable tolerance |
| **Over-KM** | When projected trip kilometers exceed the vehicle's remaining quota plus tolerance |
| **Block Schedule** | Extended vehicle reservation for multiple days |
| **Multi-stop** | Booking with multiple pickup/drop-off locations in sequence |
| **External Dispatch** | Redirecting a booking to an external provider (Grab, Taxi) when no internal vehicle is available |
| **Booking Code** | Unique identifier in format `MSM-YYYYMMDD-XXXX` |
| **Odometer Log** | Recorded vehicle mileage at trip start/end for quota tracking and fraud detection |
| **Soft Delete** | Deactivation via `is_active` flag instead of permanent deletion |

---

## Position Levels

| Level | Code | Description |
|-------|------|-------------|
| Staff | STAFF | Entry-level employee |
| Senior | SENIOR | Senior-level employee |
| Team Lead | TEAM_LEAD | Team leadership role |
| Manager | MGR | Department manager |
| Senior Manager | SR_MGR | Senior department manager |
| Director | DIRECTOR | Division director |
| Vice President | VP | Vice president |
| C-Level | C_LEVEL | Chief officer (CEO, CFO, CTO, etc.) |

---

## Booking Statuses

| Status | Description |
|--------|-------------|
| `PENDING_APPROVAL` | Awaiting manager approval (SOMETIMES segment employees) |
| `PENDING` | Approved, waiting for system processing |
| `CONFIRMED` | System has confirmed the booking |
| `ASSIGNED` | Vehicle and driver assigned |
| `IN_PROGRESS` | Trip is currently active |
| `COMPLETED` | Trip finished successfully |
| `CANCELLED` | Booking cancelled (with reason) |

---

## User Roles

| Role | Code | Responsibilities |
|------|------|-----------------|
| Administrator | `ADMIN` | Full system access, configuration, user management |
| Person In Charge | `PIC` | Dispatch operations, monitoring, booking management |
| General Affairs | `GA` | External vehicle rental management |
| Driver | `DRIVER` | Trip execution, odometer recording, expense tracking |
| Employee | `EMPLOYEE` | Vehicle booking requests |

---

## User Segments

| Segment | Code | Description |
|---------|------|-------------|
| Daily | `DAILY` | SIC users with fixed routes (contract employees) |
| Sometimes | `SOMETIMES` | Business trippers with occasional bookings |

---

## Notification Types

| Type | Channel | Description |
|------|---------|-------------|
| `BOOKING_CONFIRMED` | APP_PUSH | Booking has been confirmed |
| `VEHICLE_ARRIVING` | APP_PUSH, AUTO_CALL | Vehicle approaching pickup location |
| `TRIP_STARTED` | APP_PUSH | Trip has started |
| `TRIP_COMPLETED` | APP_PUSH | Trip has ended |
| `BOOKING_CANCELLED` | APP_PUSH | Booking was cancelled |
| `APPROVAL_REQUIRED` | APP_PUSH | Manager approval needed |
| `APPROVAL_REMINDER` | APP_PUSH | Reminder for pending approval |
| `BOOKING_APPROVED` | APP_PUSH | Booking approved by manager |
| `BOOKING_REJECTED` | APP_PUSH | Booking rejected by manager |
| `BOOKING_CC_NOTIFICATION` | APP_PUSH | CC notification to line manager |
| `NEW_CHAT_MESSAGE` | APP_PUSH | New chat message in booking |
| `SCHEDULE_CHANGE_ALERT` | APP_PUSH | Schedule change for block booking |

---

## External Providers

| Provider | Type |
|----------|------|
| Grab | Ride-hailing |
| Gojek | Ride-hailing |
| Be | Ride-hailing |
| Mai Linh Taxi | Taxi |
| Vinasun Taxi | Taxi |
