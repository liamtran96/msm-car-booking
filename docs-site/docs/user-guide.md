---
id: user-guide
title: User Guide
sidebar_position: 5
---

# User Guide

Role-based usage guide for the MSM Car Booking System.

---

## Admin

System administrators with full access to configuration, user management, and monitoring.

### Key Workflows

- User and role management (create, update, deactivate)
- Vehicle and driver fleet configuration
- Department setup and cost allocation
- KM quota configuration per vehicle
- System monitoring and reporting

<!-- TODO: Add step-by-step instructions with screenshots -->

---

## PIC (Person In Charge)

Dispatch operators responsible for booking management and vehicle assignment.

### Key Workflows

- Review and process incoming booking requests
- Manual vehicle and driver assignment
- Monitor active trips in real-time
- Handle booking cancellations and reassignment
- Manage over-KM warnings and external dispatch decisions

<!-- TODO: Add step-by-step instructions with screenshots -->

---

## GA (General Affairs)

External vehicle rental management team.

### Key Workflows

- Process external vehicle rental queue
- Book rides through external providers (Grab, Taxi)
- Track external booking costs and driver information
- Record actual costs after trip completion

<!-- TODO: Add step-by-step instructions with screenshots -->

---

## Driver (Mobile App)

Vehicle operators using the mobile app for trip execution.

### Key Workflows

1. **Login** with assigned account
2. **View trip list** filtered by status (waiting, in progress, completed)
3. **Accept or reject** trip assignments (with reason for rejection)
4. **Start trip** with GPS validation at pickup location
5. **Record expenses** (toll, parking, fuel) with receipt uploads
6. **End trip** with odometer entry and fraud detection check
7. **View trip history** by day/week/month
8. **Monitor KM summary** for personal quota

### Notifications

- Push notifications for new trip assignments
- Schedule reminders 15 minutes before departure
- Auto-call trigger when arrived at pickup location

<!-- TODO: Add mobile app screenshots and detailed instructions -->

---

## Employee (Mobile App)

Staff members requesting vehicle bookings through the mobile app.

### Key Workflows

1. **Login** with assigned account
2. **Create booking** - one-way or round-trip
3. **Multi-stop booking** for visits to multiple locations
4. **Block booking** for extended day reservations
5. **Cancel booking** (up to 30 minutes before departure, with reason)
6. **View booking history**
7. **Receive notifications** for booking confirmations and trip updates

### Approval Flow

- **SIC employees (DAILY segment):** CC notification to line manager, no approval needed
- **Other employees (SOMETIMES segment):** Manager approval required
- **Management level (MGR and above):** Auto-approved

<!-- TODO: Add mobile app screenshots and detailed instructions -->
