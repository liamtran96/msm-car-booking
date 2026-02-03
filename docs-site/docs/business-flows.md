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
- **Approval Workflow**: Different approval flows based on user type and position level:
  - **SIC Employees (DAILY segment)**: Business trips only require CC notification to line manager - request goes directly to system without approval needed.
  - **Other Employees (SOMETIMES segment)**: Must go through department manager approval first. Only after manager approves ("Done") does the request proceed to the central system. System sets reminder/warning notifications for approvers if pending too long.
  - **Management Level (MGR and above)**: Just fill in trip information - system automatically accepts without requiring approval.
- **Multi-stop/Block Schedule**:
  - Supports employees traveling to multiple consecutive locations.
  - "Block schedule" feature: Reserve a vehicle for an extended period, reducing the need to create multiple separate trips for the same journey.
- **Pickup Points Management**: System allows defining and routing fixed or flexible pickup/drop-off points.

### 1.2. Fixed Route Communication

- **Schedule Change Notifications**: For fixed route shuttles (BLOCK_SCHEDULE bookings), when schedule changes occur:
  - When user will return late: System notifies driver of new return time.
  - When departure time changes (early or late): System notifies driver of schedule change.
- **In-App Chat**: System creates a chat window between employee and driver for direct communication about schedule changes.

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

### 2.2. Approval Workflow Rules

**User Position Levels:** STAFF → SENIOR → TEAM_LEAD → MGR → SR_MGR → DIRECTOR → VP → C_LEVEL

| User Type | Condition | Approval Flow |
|-----------|-----------|---------------|
| SIC Employees | `user_segment = DAILY` AND business trip | **No approval required** - CC (copy) notification to line manager only |
| Other Employees | `user_segment = SOMETIMES` OR non-business trip | **Manager approval required** first → then to system |
| Management Level | `position_level >= MGR` | **No approval required** - Auto-accept |

**Approval Expiration:** Pending approvals expire after 24 hours with automated reminders sent to approvers.

### 2.3. Approval Notifications

Notifications are automatically sent to line managers based on approval type:

| Approval Type | Notification | Message | Action Required |
|---------------|--------------|---------|-----------------|
| `CC_ONLY` (SIC + business trip) | `BOOKING_CC_NOTIFICATION` | "[Employee] has created a business trip booking. No action required." | No |
| `MANAGER_APPROVAL` | `APPROVAL_REQUIRED` | "[Employee] has requested your approval for booking. Please review and respond." | Yes |
| `AUTO_APPROVED` (MGR+) | None | - | No |

**Notification Flow for SIC Business Trip:**
```
Employee creates booking → System auto-approves → CC notification sent to manager
                                              → Booking ready for dispatch
```

### 2.4. Approval Authorization Rules

Access to approval records is restricted based on user role and relationship:

| User | Can View | Can Respond |
|------|----------|-------------|
| **Requester** | Own approval requests | No |
| **Approver** | Approvals assigned to them | Yes (approve/reject) |
| **Admin** | All approvals | No (unless also approver) |
| **Other Users** | None | No |

**API Endpoint Authorization:**
- `GET /approvals/:id` - Returns approval only if user is requester, approver, or admin
- `GET /approvals/booking/:bookingId` - Same authorization rules as above
- `POST /approvals/:id/respond` - Only the assigned approver can respond

### 2.5. Over-KM Handling Logic

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

| No. | Module | Feature Name | Detailed Description | FE (days) | BE (days) | Test (days) |
|----:|--------|--------------|---------------------|----------:|----------:|------------:|
| 1 | Integration Solution Analysis | Survey & Integration Design | Review existing system, analyze source code, database, existing business | 2 | 3 | 1 |
| 2 | Authentication | SSO | Integrate Single Sign-On (SSO) with company's current Web-portal | 2 | 3 | 2 |
| 3 | System Admin & Permissions | User Management | Manage employee profiles, drivers, Admin, PIC, GA, user groups | 3 | 2 | 2 |
| 4 | System Admin & Permissions | Authorization | Detailed permission allocation for each user group | 2 | 3 | 2 |
| 5 | System Admin & Permissions | Parameter Configuration | Set system parameters: KM warning thresholds, quotas, vehicle types... | 2 | 2 | 1 |
| 6 | Dashboard | Cost Summary Report | Statistics and visualization of operational costs (fuel, repairs, tolls, outsourcing) | 3 | 2 | 2 |
| 7 | Dashboard | Total KM Report | Summary of actual travel distance for each vehicle | 2 | 2 | 1 |
| 8 | Dashboard | Trip History Report | Retrieve detailed journey logs by vehicle/department/user (route, time, user) | 3 | 3 | 2 |
| 9 | Fleet Profile Management | Vehicle List | List vehicles by North-South region (display monthly km and quota for each vehicle) | 2 | 2 | 1 |
| 10 | Fleet Profile Management | Add/Edit/Delete Vehicle | Add, edit, delete vehicles by North-South region | 2 | 2 | 2 |
| 11 | Fleet Profile Management | Set Quota | Set maximum monthly km limit for each vehicle | 1 | 1 | 1 |
| 12 | Fleet Profile Management | Vehicle Status | Available / Booked / Under Repair (real-time) | 2 | 2 | 1 |
| 13 | GPS Journey Monitoring | View Current Location | Track vehicle location in real-time on digital map | 4 | 3 | 2 |
| 14 | GPS Journey Monitoring | View Route History | Retrieve past travel history | 3 | 2 | 2 |
| 15 | GPS Journey Monitoring | Pickup Point Management | Define and route fixed or flexible pickup/drop-off points | 3 | 3 | 2 |
| 16 | Smart Dispatch Center | Vehicle Schedule | Timeline/calendar interface based on booking form | 4 | 2 | 2 |
| 17 | Smart Dispatch Center | Vehicle Matching Algorithm | Automatically scan and assign the most suitable vehicle for requests | 2 | 5 | 3 |
| 18 | Smart Dispatch Center | Over-quota Warning | Automatically warn PIC when exceeding quota | 1 | 2 | 1 |
| 19 | Booking on Behalf | Booking Form | Date, time, pickup/drop-off points, assign requester | 3 | 2 | 2 |
| 20 | Booking on Behalf | Add Stops | Set up multi-point routes (waypoints/transfers) | 2 | 2 | 1 |
| 21 | Booking on Behalf | Block Schedule | Manually lock vehicle or driver schedule | 2 | 2 | 1 |
| 22 | Booking on Behalf | Cancel Booking | Cancel request, release vehicle/driver and send notification | 1 | 2 | 1 |
| 23 | External Vehicle Rental | Outsourcing Queue | Automatically receive requests when internal vehicles/quota exhausted | 2 | 3 | 2 |
| 24 | External Vehicle Rental | Record Information | Quick entry of external rental info (company, plate number, estimated cost) | 2 | 1 | 1 |
| 25 | External Vehicle Rental | Update Status | Notify User of external vehicle information | 1 | 2 | 1 |
| 26 | Communication & Integration System | PBX Gateway | Integrate voice service provider for outbound calls from system | 1 | 4 | 2 |
| 27 | Communication & Integration System | Auto-call Scenarios | Configure situations for system automatic calls | 2 | 3 | 2 |
| 28 | Communication & Integration System | Text-to-Speech | Convert text (driver name, plate number) to voice | 1 | 3 | 1 |
| | | **Total** | | **60** | **68** | **44** |

## Driver App Feature Matrix

| No. | Module | Feature Name | Detailed Description | FE (days) | BE (days) | Test (days) |
|----:|--------|--------------|---------------------|----------:|----------:|------------:|
| 1 | Authentication | Login | Login with assigned account | 1 | 1 | 1 |
| 2 | Schedule & Task Management | Trip List | Display list of assigned trips (waiting, in progress, completed) | 2 | 2 | 1 |
| 3 | | Trip Order Details | Display full information: Requester, phone number, pickup point, destination, time, special notes | 2 | 1 | 1 |
| 4 | | Confirm Task | Driver taps "accept trip" or "report busy" (with valid reason) to notify dispatch center | 1 | 2 | 1 |
| 5 | Trip Execution | Start/End Trip | Button to confirm trip start and end time | 1 | 2 | 1 |
| 6 | | Record Expenses | Record trip expenses | 2 | 2 | 1 |
| 7 | Odometer Recording | Enter Start/End Odometer | Enter km reading on vehicle odometer at trip start and end | 1 | 1 | 1 |
| 8 | | Validity Check | System automatically warns if end km < start km or difference too large compared to GPS (anti-fraud) | 1 | 2 | 2 |
| 9 | Notifications & Alerts | Push Notification | Vibrate/ring alert for new trips, schedule changes, or cancellations from admin/customer | 2 | 2 | 1 |
| 10 | | Schedule Reminder | Auto-remind before departure time (e.g., 15 minutes) for driver preparation | 1 | 2 | 1 |
| 11 | | Trigger Auto-call | When driver taps "arrived at pickup", system immediately makes auto-call to customer phone | 1 | 2 | 2 |
| 12 | History & Quota | Trip History | View list of completed trips by day/week/month | 2 | 2 | 1 |
| 13 | | KM Summary | View total km driven in month to self-monitor personal quota (if vehicle has quota assigned) | 1 | 2 | 1 |
| | | **Total** | | **18** | **23** | **15** |

## Employee App Feature Matrix

| No. | Module | Feature Name | Detailed Description | FE (days) | BE (days) | Test (days) |
|----:|--------|--------------|---------------------|----------:|----------:|------------:|
| 1 | Authentication | Login | Login with assigned account | 1 | 1 | 1 |
| 2 | Booking | Basic Booking | Book one-way or round-trip (select pickup/destination, time) | 2 | 2 | 2 |
| 3 | | Multi-stop Booking | Book with multiple stops in one trip | 2 | 2 | 1 |
| 4 | | Block Booking by Day | Reserve vehicle for extended period (e.g., 3 consecutive days) | 2 | 2 | 1 |
| 5 | | Cancel Booking | Change vehicle status from booked to available (enter cancel reason, must cancel 30 min before) | 1 | 2 | 1 |
| 6 | | Booking History List | History of past bookings | 2 | 1 | 1 |
| 7 | Booking Notifications | Instant Confirmation | Return booking success notification (if vehicle available), return no vehicle notification and forward request to GA for external booking (if all vehicles busy) | 1 | 2 | 2 |
| 8 | | Push Notification | Vibrate/ring alert when booking time approaches, external vehicle notification, or booking success | 2 | 2 | 1 |
| | | **Total** | | **13** | **14** | **10** |
