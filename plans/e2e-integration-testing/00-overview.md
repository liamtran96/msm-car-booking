# E2E and Integration Testing Implementation Plan

**Document ID:** PLAN-20260202-E2E-TESTING
**Status:** Active
**Created:** 2026-02-02
**Last Updated:** 2026-02-02

## Overview

This plan provides a comprehensive implementation guide for adding E2E (End-to-End) and integration tests to the MSM Car Booking backend. The goal is to establish a robust testing infrastructure that enables testing of complete user flows, service interactions, and database operations against a real PostgreSQL instance.

## Current State Analysis

### Existing Test Infrastructure
- **21 unit test files** with good coverage using Jest
- **Jest configuration** for unit tests in `package.json`
- **E2E configuration** exists at `test/jest-e2e.json` but only contains a placeholder test
- **Comprehensive factories** for test data generation:
  - `src/test/factories/user.factory.ts`
  - `src/test/factories/booking.factory.ts`
  - `src/test/factories/vehicle.factory.ts`
  - `src/test/factories/department.factory.ts`
  - `src/test/factories/notification.factory.ts`
  - `src/test/factories/gps-location.factory.ts`
  - `src/test/factories/driver-shift.factory.ts`
- **Mock utilities** in `src/test/mocks/repository.mock.ts`
- **Test helpers** in `src/test/utils/test-helper.ts`

### Modules to Test
| Module | Controller | Service | Gateway | Priority |
|--------|------------|---------|---------|----------|
| Auth | `auth.controller.ts` | `auth.service.ts` | - | P0 |
| Bookings | `bookings.controller.ts` | `bookings.service.ts` | - | P0 |
| Approvals | `approvals.controller.ts` | `approvals.service.ts` | - | P0 |
| Users | `users.controller.ts` | `users.service.ts` | - | P1 |
| Vehicles | `vehicles.controller.ts` | `vehicles.service.ts` | - | P1 |
| Chat | `chat.controller.ts` | `chat.service.ts` | `chat.gateway.ts` | P1 |
| Departments | `departments.controller.ts` | `departments.service.ts` | - | P2 |
| GPS | `gps.controller.ts` | `gps.service.ts` | - | P2 |
| Notifications | `notifications.controller.ts` | `notifications.service.ts` | - | P2 |

## Architecture

### Test Types

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ╱╲                                     │
│                     ╱  ╲                                    │
│                    ╱ E2E╲        (Few, Slow, High Value)    │
│                   ╱──────╲                                  │
│                  ╱        ╲                                 │
│                 ╱Integration╲    (Medium, Database Tests)   │
│                ╱────────────╲                               │
│               ╱              ╲                              │
│              ╱  Unit Tests    ╲  (Many, Fast, Isolated)     │
│             ╱──────────────────╲                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### E2E Tests
- Test complete HTTP request/response cycles
- Use real database (testcontainers PostgreSQL)
- Test authentication and authorization flows
- Validate entire API contracts

### Integration Tests
- Test service-to-service interactions
- Test repository operations with real database
- Test event-driven workflows (booking → approval → notification)
- Test WebSocket gateway interactions

## Directory Structure

```
backend/
├── test/
│   ├── jest-e2e.json                    # E2E Jest config
│   ├── jest-integration.json            # Integration Jest config
│   ├── app.e2e-spec.ts                  # Root E2E test (placeholder)
│   ├── setup/
│   │   ├── test-database.ts             # Testcontainers setup
│   │   ├── global-setup.ts              # Jest global setup
│   │   ├── global-teardown.ts           # Jest global teardown
│   │   └── test-app.factory.ts          # NestJS test app factory
│   ├── fixtures/
│   │   ├── seed-data.ts                 # Test data seeding
│   │   └── auth-tokens.ts               # Pre-generated JWT tokens
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── bookings.e2e-spec.ts
│   │   ├── approvals.e2e-spec.ts
│   │   ├── users.e2e-spec.ts
│   │   ├── vehicles.e2e-spec.ts
│   │   ├── departments.e2e-spec.ts
│   │   ├── gps.e2e-spec.ts
│   │   ├── notifications.e2e-spec.ts
│   │   └── chat.e2e-spec.ts
│   └── integration/
│       ├── booking-flow.integration-spec.ts
│       ├── approval-workflow.integration-spec.ts
│       ├── chat-messaging.integration-spec.ts
│       ├── vehicle-assignment.integration-spec.ts
│       └── multi-tenant.integration-spec.ts
└── src/test/
    ├── factories/                        # Existing factories
    ├── mocks/                           # Existing mocks
    └── utils/
        ├── test-helper.ts               # Existing helpers
        ├── e2e-test-helper.ts           # E2E-specific helpers (NEW)
        └── database-seeder.ts           # Database seeding utility (NEW)
```

## Key Scenarios to Test

### 1. Complete Booking Flow
```
Create Booking → Approval (if required) → Confirm → Assign Vehicle/Driver → 
Start Trip → Complete Trip → Generate Report
```

### 2. Approval Workflow Based on User Type/Position
| User Type | Segment | Position | Approval Type |
|-----------|---------|----------|---------------|
| SIC Employee (business trip) | DAILY | STAFF | CC_ONLY |
| Other Employee | SOMETIMES | STAFF | MANAGER_APPROVAL |
| Management | ANY | MGR+ | AUTO_APPROVED |

### 3. Chat Messaging for Block Schedules
- Create BLOCK_SCHEDULE booking
- Verify chat room creation
- Test real-time messaging via WebSocket
- Test schedule change notifications

### 4. Role-Based Access Control
| Endpoint | ADMIN | PIC | GA | DRIVER | EMPLOYEE |
|----------|-------|-----|----|---------| ---------|
| GET /users | ✓ | ✓ | ✗ | ✗ | ✗ |
| POST /users | ✓ | ✗ | ✗ | ✗ | ✗ |
| GET /bookings | ✓ | ✓ | ✓ | ✓ (own) | ✓ (own) |
| POST /approvals/:id/approve | ✓ | ✓ | ✗ | ✗ | ✗ |

### 5. Multi-Tenant Isolation
- Verify users can only access data within their tenant
- Test cross-tenant access prevention
- Validate tenant-scoped queries

## Dependencies to Install

```json
{
  "devDependencies": {
    "@testcontainers/postgresql": "^10.18.0",
    "testcontainers": "^10.18.0",
    "socket.io-client": "^4.8.3"
  }
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup (01-infrastructure-setup.md)
- [ ] Install testcontainers dependencies
- [ ] Create test database setup utilities
- [ ] Configure Jest for E2E and integration tests
- [ ] Create global setup/teardown scripts
- [ ] Create test application factory

### Phase 2: E2E Tests (02-e2e-tests.md)
- [ ] Auth module E2E tests
- [ ] Bookings module E2E tests
- [ ] Approvals module E2E tests
- [ ] Users module E2E tests
- [ ] Vehicles module E2E tests
- [ ] Chat module E2E tests
- [ ] Other modules E2E tests

### Phase 3: Integration Tests (03-integration-tests.md)
- [ ] Complete booking flow integration test
- [ ] Approval workflow integration test
- [ ] Chat messaging integration test
- [ ] Vehicle assignment integration test
- [ ] Multi-tenant isolation integration test

### Phase 4: Documentation (04-claude-md-update.md)
- [ ] Update CLAUDE.md with new testing commands
- [ ] Add testing guidelines to documentation
- [ ] Document test data seeding

## Success Criteria

1. **Test Coverage**
   - All controller endpoints have E2E tests
   - Critical business flows have integration tests
   - WebSocket gateway has integration tests

2. **Test Reliability**
   - Tests run in isolation (testcontainers)
   - No test pollution between runs
   - Consistent results across environments

3. **Test Performance**
   - E2E suite completes in < 5 minutes
   - Integration suite completes in < 3 minutes
   - Parallel test execution where possible

4. **Developer Experience**
   - Clear test naming conventions
   - Easy to add new tests
   - Comprehensive error messages

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Testcontainers slow startup | Medium | Use container reuse, singleton pattern |
| Flaky tests due to timing | High | Use proper async/await, retry mechanisms |
| Test data pollution | High | Database cleanup between tests |
| WebSocket test complexity | Medium | Use socket.io-client, mock timeouts |

## Related Documents

- [Business Flows](/docs-site/docs/business-flows.md)
- [System Workflows](/docs-site/docs/system-workflows.md)
- [Backend Patterns](/docs-site/docs/backend/)

