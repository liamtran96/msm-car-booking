---
id: business-flows
title: Business Flows
sidebar_position: 1
---

# Vehicle Management Software Requirements Specification

## 1. Functional Requirements

### 1.1. Booking & Dispatching Module

- **Automated Dispatching**: System automatically arranges and dispatches vehicles based on schedule, reducing manual operations for PIC (Person In Charge).
- **Advance Booking**: Allows users or admin to create vehicle booking requests for future dates.
- **Multi-stop/Block Schedule**:
  - Supports employees traveling to multiple consecutive locations.
  - "Block schedule" feature: Reserve a vehicle for an extended period, reducing the need to create multiple separate trips for the same journey.
- **Pickup Points Management**: System allows defining and routing fixed or flexible pickup/drop-off points.

### 1.2. Fleet Management Module

- **Real-time GPS Tracking**: PIC can view the current position of vehicles on a digital map in real-time.
- **Odometer Management**:
  - Record monthly kilometers for each vehicle.
  - Track assigned km quota.

### 1.3. Notification System

- **Multi-channel**: Send confirmation notifications, vehicle arrival, or trip cancellation via App Notification and Automated Calls.

### 1.4. Reporting

- Comprehensive reports on costs, total kilometers, trip history by vehicle/department/user.

## 2. Business Logic & Processing Rules

### 2.1. User Segments

- **Daily Group**: For SIC (contract employees/fixed routes).
- **Sometimes Group**: For Business Trippers (employees on business trips), External Guests.

### 2.2. Over-KM Handling Logic

**Parameter Configuration**: System allows Admin to configure "Tolerance Limit" (e.g., 50km, 100km...).

**Booking Verification Process**:
- System calculates: Projected Total KM = (Current Actual KM + New Trip KM)
- **Scenario 1 (Within Limit)**: If Projected Total KM is less than or equal to (Monthly Quota + Tolerance Limit), ALLOW system to dispatch that vehicle (Display KM consumption warning to PIC)
- **Scenario 2 (Over Limit)**: If Projected Total KM exceeds (Monthly Quota + Tolerance Limit), System automatically redirects to GA request for external vehicle (Grab/Taxi)

## 3. Technical Requirements

### 3.1. Platform

- **Web Portal**: For Admin/PIC/GA administration.
- **Mobile App**: For Drivers and End-users. Must support both Android and iOS.

### 3.2. GPS & Hardware System (IoT)

- **Standalone System**: Build data collection system from separate black box/GPS. Process data directly, not dependent on/embedded third-party web.
- **Location Security**: Security check mechanism when using GPS location on user phones.

### 3.3. Infrastructure & Deployment

- **Storage**: Deploy on Physical Server (Company Server Room) OR Private Cloud.
- **Integration Capability**: Have API/Service to link with current Portal or company Office system.
- **Scalability**: System architecture must support "Extend function" easily in the future.

## Feature Matrix

| No. | Module | Feature Name | Detailed Description |
|----:|--------|--------------|---------------------|
| 1 | Integration Solution Analysis | Survey & Integration Design | Review existing system, analyze source code, database, existing business |
| 2 | Authentication | SSO | Integrate Single Sign-On (SSO) with company's current Web-portal |
| 3 | System Admin & Permissions | User Management | Manage employee profiles, drivers, Admin, PIC, GA, user groups |
| 4 | System Admin & Permissions | Authorization | Detailed permission allocation for each user group |
| 5 | System Admin & Permissions | Parameter Configuration | Set system parameters: KM warning thresholds, quotas, vehicle types... |
| 6 | Dashboard | Cost Summary Report | Statistics and visualization of operational costs (fuel, repairs, tolls, outsourcing) |
| 7 | Dashboard | Total KM Report | Summary of actual travel distance for each vehicle |
| 8 | Dashboard | Trip History Report | Retrieve detailed journey logs by vehicle/department/user (route, time, user) |
| 9 | Fleet Profile Management | Vehicle List | List vehicles by North-South region (display monthly km and quota for each vehicle) |
| 10 | Fleet Profile Management | Add/Edit/Delete Vehicle | Add, edit, delete vehicles by North-South region |
| 11 | Fleet Profile Management | Set Quota | Set maximum monthly km limit for each vehicle |
| 12 | Fleet Profile Management | Vehicle Status | Available / Booked / Under Repair (real-time) |
| 13 | GPS Journey Monitoring | View Current Location | Track vehicle location in real-time on digital map |
| 14 | GPS Journey Monitoring | View Route History | Retrieve past travel history |
| 15 | GPS Journey Monitoring | Pickup Point Management | Define and route fixed or flexible pickup/drop-off points |
| 16 | Smart Dispatch Center | Vehicle Schedule | Timeline/calendar interface based on booking form |
| 17 | Smart Dispatch Center | Vehicle Matching Algorithm | Automatically scan and assign the most suitable vehicle for requests |
| 18 | Smart Dispatch Center | Over-quota Warning | Automatically warn PIC when exceeding quota |
| 19 | Booking on Behalf | Booking Form | Date, time, pickup/drop-off points, assign requester |
| 20 | Booking on Behalf | Add Stops | Set up multi-point routes (waypoints/transfers) |
| 21 | Booking on Behalf | Block Schedule | Manually lock vehicle or driver schedule |
| 22 | Booking on Behalf | Cancel Booking | Cancel request, release vehicle/driver and send notification |
| 23 | External Vehicle Rental | Outsourcing Queue | Automatically receive requests when internal vehicles/quota exhausted |
| 24 | External Vehicle Rental | Record Information | Quick entry of external rental info (company, plate number, estimated cost) |
| 25 | External Vehicle Rental | Update Status | Notify User of external vehicle information |
| 26 | Communication & Integration System | PBX Gateway | Integrate voice service provider for outbound calls from system |
| 27 | Communication & Integration System | Auto-call Scenarios | Configure situations for system automatic calls |
| 28 | Communication & Integration System | Text-to-Speech | Convert text (driver name, plate number) to voice |
