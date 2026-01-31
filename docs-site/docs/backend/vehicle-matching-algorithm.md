# Vehicle Matching Algorithm Implementation Plan

## Overview

Implement a **Weighted Scoring with Batch Optimization** algorithm for auto-assigning vehicles to booking requests.

**Why this approach:**
- O(B×V) complexity - fast enough for 50 bookings × 50 vehicles in `<100ms`
- Easy to tune weights based on business priorities
- Explainable - each assignment shows why a vehicle was chosen
- Simpler than Hungarian algorithm while still effective

---

## Algorithm Design

### Processing Flow

```
Pending Bookings → Hard Constraint Filter → Score Feasible Pairs → Greedy Assign → Persist
```

### 1. Hard Constraints (Must NEVER violate)

| Constraint | Check |
|------------|-------|
| HC1: Capacity | `vehicle.capacity >= booking.passenger_count` |
| HC2: KM Quota | `remaining_quota >= booking.estimated_km` |
| HC3: Driver Shift | Driver has SCHEDULED/ACTIVE shift during booking time |
| HC4: Maintenance | `vehicle.status != MAINTENANCE/INACTIVE` |
| HC5: Time Overlap | No conflicting bookings for same vehicle |

### 2. Scoring Formula (0-100 scale)

```
TOTAL = W1×S_quota + W2×S_distance + W3×S_utilization + W4×S_fit
```

| Factor | Weight | Formula |
|--------|--------|---------|
| KM Quota Balance | 30% | `(remaining_km - estimated_km) / max_remaining × 100` |
| Proximity | 35% | `100 - (distance_km / 50) × 100` |
| Even Utilization | 15% | `100 - (over_ratio - 1) × 50` |
| Vehicle Type Fit | 20% | `100 - (vehicleRank - minViableRank) × 25` |

### 3. Edge Case Handling

- **No feasible vehicle** → Create `external_dispatches` record, notify user
- **Competing bookings** → Priority sort: BLOCK_SCHEDULE > MULTI_STOP > SINGLE_TRIP, then by time
- **All vehicles assigned** → Lower-priority bookings go to external dispatch

---

## Implementation Tasks

### Task 1: Create Vehicle Matching Module

**Files to create:**
```
backend/src/modules/vehicle-matching/
├── vehicle-matching.module.ts
├── vehicle-matching.service.ts
├── vehicle-matching.scheduler.ts
├── vehicle-matching.controller.ts
├── interfaces/
│   ├── booking-request.interface.ts
│   ├── vehicle-candidate.interface.ts
│   └── scoring-weights.interface.ts
├── dto/
│   └── assignment-result.dto.ts
└── utils/
    └── haversine.util.ts
```

### Task 2: Implement Core Algorithm (vehicle-matching.service.ts)

**Key methods:**
1. `runBatchOptimization()` - Main entry point
2. `collectPendingBookings()` - Fetch PENDING/CONFIRMED bookings with pickup coords
3. `collectAvailableVehicles()` - Fetch AVAILABLE vehicles with GPS, quota, trips
4. `buildFeasibilityMatrix()` - Check hard constraints for all pairs
5. `scoreFeasiblePairs()` - Calculate weighted scores
6. `greedyAssign()` - Priority-sorted assignment with conflict resolution
7. `persistAssignments()` - Update bookings, create external dispatches, notify

### Task 3: Implement Scheduler (vehicle-matching.scheduler.ts)

- Cron job: `@Cron('0 */5 * * * *')` - Every 5 minutes
- Distributed lock to prevent concurrent runs
- Manual trigger endpoint for on-demand optimization

### Task 4: Add API Endpoints (vehicle-matching.controller.ts)

| Endpoint | Description |
|----------|-------------|
| `POST /vehicle-matching/optimize` | Trigger immediate batch optimization |
| `GET /vehicle-matching/preview/:bookingId` | Preview matching scores for a booking |
| `GET /vehicle-matching/config` | Get current weight configuration |
| `PATCH /vehicle-matching/config` | Update weights (admin only) |

### Task 5: Add Configuration

**Environment variables:**
```env
MATCHING_INTERVAL_MINUTES=5
WEIGHT_QUOTA=0.30
WEIGHT_DISTANCE=0.35
WEIGHT_UTILIZATION=0.15
WEIGHT_FIT=0.20
MAX_DISTANCE_KM=50
DEFAULT_TRIP_DURATION_MINUTES=120
```

### Task 6: Install Dependencies

```bash
npm install @nestjs/schedule  # For cron jobs
```

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `backend/src/app.module.ts` | Import VehicleMatchingModule |
| `backend/src/modules/bookings/bookings.service.ts` | Add query for pending bookings with trip stops |
| `backend/src/modules/vehicles/vehicles.service.ts` | Add query for available vehicles with GPS/quota |
| `backend/.env.example` | Add matching configuration variables |

---

## Verification Steps

1. **Unit tests:**
   - Test scoring calculations with known inputs
   - Test hard constraint filtering
   - Test priority sorting logic

2. **Integration tests:**
   - Create test bookings in PENDING status
   - Run batch optimization
   - Verify assignments match expected vehicles
   - Verify external dispatch for no-vehicle scenarios

3. **Manual verification:**
   ```bash
   # Start backend
   cd backend && npm run start:dev

   # Trigger optimization
   curl -X POST http://localhost:3001/api/v1/vehicle-matching/optimize

   # Check bookings were assigned
   curl http://localhost:3001/api/v1/bookings?status=ASSIGNED
   ```

---

## Database Queries (Reference)

### Collect Pending Bookings with Pickup
```sql
SELECT b.*, ts.latitude, ts.longitude
FROM bookings b
LEFT JOIN trip_stops ts ON ts.booking_id = b.id AND ts.stop_order = 0
WHERE b.status IN ('PENDING', 'CONFIRMED')
  AND b.scheduled_date >= CURRENT_DATE;
```

### Collect Available Vehicles with GPS and Quota
```sql
SELECT v.*,
       gps.latitude, gps.longitude,
       kq.quota_km, kq.tolerance_km, kq.used_km
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT latitude, longitude FROM gps_locations
    WHERE vehicle_id = v.id ORDER BY recorded_at DESC LIMIT 1
) gps ON true
LEFT JOIN km_quotas kq ON kq.vehicle_id = v.id
    AND kq.month = DATE_TRUNC('month', CURRENT_DATE)
WHERE v.status = 'AVAILABLE' AND v.is_active = true;
```

---

## Estimated Scope

- **New files:** ~10 files
- **Modified files:** ~4 files
- **Main logic:** ~500 lines TypeScript
