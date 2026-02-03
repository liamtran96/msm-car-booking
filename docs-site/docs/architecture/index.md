---
id: index
title: System Architecture
sidebar_label: System Architecture
slug: /architecture
---

# System Architecture

This document provides a comprehensive overview of the MSM Car Booking system architecture, including component diagrams, deployment topology, and design decisions.

## System Overview

MSM Car Booking is an **enterprise vehicle management system** designed for corporate fleet booking and dispatching. The system follows a **monolithic architecture with feature-based module organization**, optimized for deployment on resource-constrained VPS environments (4GB RAM).

### Architecture Principles

1. **Monolithic with Modular Design** - Single deployable unit with well-separated feature modules
2. **API-First** - RESTful APIs with WebSocket for real-time features
3. **Multi-Tenant Ready** - Tenant isolation built into the data model
4. **Resource Optimized** - Tuned for 4GB VPS deployment
5. **Security by Default** - JWT authentication, role-based access control

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript | 19.x |
| **Build Tool** | Vite | 6.x |
| **UI Framework** | Tailwind CSS + Shadcn UI | 4.x |
| **Backend** | NestJS + TypeScript | 11.x |
| **ORM** | TypeORM | 0.3.x |
| **Database** | PostgreSQL | 18.x |
| **Authentication** | Passport.js + JWT | - |
| **Real-time** | Socket.io | 4.x |
| **Containerization** | Docker + Docker Compose | - |
| **Reverse Proxy** | Nginx | Alpine |
| **Package Manager** | pnpm | 9.x |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Web Admin     │   Employee App  │   Driver App    │   External Systems    │
│   (React SPA)   │  (React Native) │  (React Native) │   (GPS Devices)       │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         │    HTTPS/WSS    │    HTTPS/WSS    │    HTTPS/WSS       │  HTTPS
         │                 │                 │                    │
┌────────▼─────────────────▼─────────────────▼────────────────────▼───────────┐
│                           NGINX REVERSE PROXY                                │
│                    (SSL Termination, Rate Limiting, Compression)             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
┌────────▼────────────┐                    ┌───────────────▼───────────────────┐
│   STATIC FILES      │                    │         NESTJS BACKEND            │
│   (React Build)     │                    │                                   │
│   /                 │                    │  ┌─────────────────────────────┐  │
│   /assets/*         │                    │  │     REST API Controllers    │  │
│                     │                    │  │     /api/v1/*               │  │
└─────────────────────┘                    │  └─────────────────────────────┘  │
                                           │                                   │
                                           │  ┌─────────────────────────────┐  │
                                           │  │    WebSocket Gateway        │  │
                                           │  │    /chat (Socket.io)        │  │
                                           │  └─────────────────────────────┘  │
                                           │                                   │
                                           │  ┌─────────────────────────────┐  │
                                           │  │    Business Services        │  │
                                           │  │    (Auth, Booking, etc.)    │  │
                                           │  └─────────────────────────────┘  │
                                           └───────────────┬───────────────────┘
                                                           │
                                           ┌───────────────▼───────────────────┐
                                           │         POSTGRESQL 18             │
                                           │    (Optimized for 4GB VPS)        │
                                           │                                   │
                                           │    shared_buffers: 512MB          │
                                           │    effective_cache: 1536MB        │
                                           │    max_connections: 50            │
                                           └───────────────────────────────────┘
```

---

## Deployment Architecture

### Container Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Host (4GB VPS)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    docker-compose.yml                    │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   nginx     │  │   backend   │  │  postgres   │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │  Port: 80   │  │ Port: 3001  │  │ Port: 5432  │     │   │
│  │  │  Mem: 128MB │  │ Mem: 640MB  │  │ Mem: 1GB    │     │   │
│  │  │             │  │             │  │             │     │   │
│  │  │  - Reverse  │  │  - REST API │  │  - Data     │     │   │
│  │  │    Proxy    │  │  - WebSocket│  │  - Indexes  │     │   │
│  │  │  - Static   │  │  - Services │  │  - Triggers │     │   │
│  │  │    Files    │  │             │  │             │     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  │         │                │                │             │   │
│  │         └────────────────┼────────────────┘             │   │
│  │                          │                              │   │
│  │              ┌───────────▼───────────┐                  │   │
│  │              │    Internal Network   │                  │   │
│  │              │    msm_network        │                  │   │
│  │              └───────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Memory Allocation:                                             │
│  ├── PostgreSQL:  1024MB (limit) / 512MB (reservation)         │
│  ├── Backend:      640MB (limit) / 384MB (reservation)         │
│  ├── Nginx:        128MB (limit) /  64MB (reservation)         │
│  └── System:      ~500MB (buffer)                              │
│  Total:           ~2.3GB reserved, ~1.7GB available            │
└─────────────────────────────────────────────────────────────────┘
```

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Nginx | 80 | 80/443 | HTTP/HTTPS |
| Backend | 3001 | - | HTTP/WS |
| PostgreSQL | 5432 | 5432* | TCP |
| Vite (Dev) | 5173 | 3000 | HTTP |

*PostgreSQL external port only in development

---

## Backend Module Architecture

The backend follows **NestJS module organization** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         AppModule                                │
│                    (Root Application Module)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼───────┐         ┌───────▼───────┐         ┌───────▼───────┐
│  Core Modules │         │Feature Modules│         │ Infrastructure│
├───────────────┤         ├───────────────┤         ├───────────────┤
│ • ConfigModule│         │ • AuthModule  │         │ • TypeOrmMod. │
│ • CommonModule│         │ • UsersModule │         │ • PassportMod.│
│               │         │ • BookingsMod.│         │               │
│               │         │ • VehiclesMod.│         │               │
│               │         │ • ApprovalMod.│         │               │
│               │         │ • ChatModule  │         │               │
│               │         │ • GpsModule   │         │               │
│               │         │ • NotifyModule│         │               │
│               │         │ • Departments │         │               │
│               │         │ • Locations   │         │               │
│               │         │ • SystemMod.  │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
```

### Module Details

| Module | Responsibility | Key Components |
|--------|---------------|----------------|
| **Auth** | Authentication & Authorization | JWT Strategy, Login, Guards |
| **Users** | User Management & Driver Shifts | CRUD, Shifts, Manager Hierarchy |
| **Bookings** | Booking Lifecycle & Dispatch | Create, Assign, Status Workflow |
| **Vehicles** | Fleet & KM Quota Management | Vehicles, Quotas, Maintenance |
| **Approvals** | Approval Workflow | Manager Approval, Auto-Approve |
| **Chat** | Real-time Messaging | WebSocket Gateway, Rooms |
| **GPS** | Location Tracking | Position Recording, History |
| **Notifications** | Multi-channel Alerts | Push, SMS, Auto-Call |
| **Departments** | Organization Structure | Cost Centers |
| **Locations** | Pickup Points | Fixed & Flexible Locations |
| **System** | Configuration & Audit | Config, Audit Logs |

---

## Module Structure Pattern

Each feature module follows a consistent structure:

```
modules/
└── bookings/
    ├── bookings.module.ts      # Module definition & imports
    ├── bookings.controller.ts  # REST API endpoints
    ├── bookings.service.ts     # Business logic
    ├── bookings.service.spec.ts# Unit tests
    ├── dto/
    │   ├── create-booking.dto.ts
    │   ├── update-booking.dto.ts
    │   └── booking-filter.dto.ts
    └── entities/
        └── booking.entity.ts   # TypeORM entity
```

---

## Data Flow Diagrams

### Booking Creation Flow

```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Employee │     │  Nginx  │     │ Backend  │     │ Service  │     │ Database │
│   App    │     │         │     │Controller│     │          │     │          │
└────┬─────┘     └────┬────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │               │               │               │
     │  POST /bookings│               │               │               │
     │───────────────>│               │               │               │
     │                │  Forward      │               │               │
     │                │──────────────>│               │               │
     │                │               │               │               │
     │                │               │ Validate DTO  │               │
     │                │               │──────────────>│               │
     │                │               │               │               │
     │                │               │               │ Check Quota   │
     │                │               │               │──────────────>│
     │                │               │               │<──────────────│
     │                │               │               │               │
     │                │               │               │ Determine     │
     │                │               │               │ Approval Type │
     │                │               │               │               │
     │                │               │               │ Create Booking│
     │                │               │               │──────────────>│
     │                │               │               │<──────────────│
     │                │               │               │               │
     │                │               │               │ Create        │
     │                │               │               │ Approval      │
     │                │               │               │──────────────>│
     │                │               │               │<──────────────│
     │                │               │               │               │
     │                │               │<──────────────│               │
     │                │<──────────────│               │               │
     │<───────────────│               │               │               │
     │  201 Created   │               │               │               │
```

### Real-time Chat Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Employee │     │  Chat    │     │  Chat    │     │  Driver  │
│   App    │     │ Gateway  │     │ Service  │     │   App    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │               │               │
     │  WS Connect    │               │               │
     │  (JWT Token)   │               │               │
     │───────────────>│               │               │
     │                │ Validate JWT  │               │
     │                │──────────────>│               │
     │                │               │               │
     │  joinRoom      │               │               │
     │───────────────>│               │               │
     │                │ Add to Room   │               │
     │                │──────────────>│               │
     │                │               │               │  WS Connect
     │                │               │               │<─────────────
     │                │               │               │  joinRoom
     │                │               │               │<─────────────
     │                │               │               │
     │  sendMessage   │               │               │
     │───────────────>│               │               │
     │                │ Save Message  │               │
     │                │──────────────>│               │
     │                │               │               │
     │                │────── Broadcast to Room ──────│
     │                │               │               │
     │                │               │  newMessage   │
     │                │               │──────────────>│
     │                │               │               │
```

---

## Security Architecture

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Authentication Flow                          │
└──────────────────────────────────────────────────────────────────┘

┌─────────┐                                           ┌─────────────┐
│  Client │                                           │   Backend   │
└────┬────┘                                           └──────┬──────┘
     │                                                       │
     │  POST /auth/login {email, password}                  │
     │──────────────────────────────────────────────────────>│
     │                                                       │
     │                    ┌──────────────────────────────────┤
     │                    │ 1. Find user by email            │
     │                    │ 2. bcrypt.compare(password)      │
     │                    │ 3. Generate JWT                  │
     │                    │    - sub: userId                 │
     │                    │    - email: user.email           │
     │                    │    - role: user.role             │
     │                    │    - exp: 7 days                 │
     │                    └──────────────────────────────────┤
     │                                                       │
     │  {accessToken: "eyJ..."}                              │
     │<──────────────────────────────────────────────────────│
     │                                                       │
     │  GET /api/* (Authorization: Bearer <token>)          │
     │──────────────────────────────────────────────────────>│
     │                                                       │
     │                    ┌──────────────────────────────────┤
     │                    │ JwtAuthGuard validates token     │
     │                    │ RolesGuard checks permissions    │
     │                    └──────────────────────────────────┤
     │                                                       │
     │  Protected Resource                                   │
     │<──────────────────────────────────────────────────────│
```

### Authorization Layers

The system implements defense-in-depth with multiple security layers:

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Request Pipeline                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────┐  ┌──────┐│
│  │ Nginx  │─>│ Helmet │─>│Throttler │─>│JWT Auth│─>│ Roles│─>│ Ctrl ││
│  │  Rate  │  │Headers │  │  Guard   │  │ Guard  │  │ Guard│  │      ││
│  │ Limit  │  │        │  │          │  │        │  │      │  │      ││
│  └────────┘  └────────┘  └──────────┘  └────────┘  └──────┘  └──────┘│
│      │           │            │            │           │         │    │
│      ▼           ▼            ▼            ▼           ▼         ▼    │
│  10 req/s    CSP, XSS,   100 req/min   Validates   Checks    Business│
│  per IP      HSTS, etc.  per IP        JWT token   @Roles()  Logic + │
│                                                    decorator Resource │
│                                                              Auth     │
└───────────────────────────────────────────────────────────────────────┘
```

**Security Layers:**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Nginx Rate Limit** | nginx `limit_req` | Stops DDoS before reaching app |
| **Helmet Headers** | `helmet` middleware | Prevents XSS, clickjacking, MIME sniffing |
| **Throttler Guard** | `@nestjs/throttler` | Application-level rate limiting |
| **JWT Auth Guard** | Passport.js | Validates authentication tokens |
| **Roles Guard** | Custom NestJS guard | Enforces role-based access |
| **Resource Auth** | Controller logic | Checks resource ownership |

> **Note:** See [Backend Security Documentation](../backend/security.md) for implementation details.

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access, user management, configuration |
| **PIC** | Dispatch operations, monitoring, booking management |
| **GA** | External vehicle rental management |
| **DRIVER** | Trip execution, odometer, expense tracking |
| **EMPLOYEE** | Create bookings, view history |

---

## External Integrations

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    MSM Car Booking System                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Backend Services                      │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │   GPS    │  │  Notif.  │  │ External │              │   │
│  │  │ Service  │  │ Service  │  │ Dispatch │              │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘              │   │
│  └───────┼─────────────┼─────────────┼──────────────────────┘   │
│          │             │             │                          │
└──────────┼─────────────┼─────────────┼──────────────────────────┘
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────────┐
    │   GPS    │  │  Push    │  │ External Providers│
    │ Devices  │  │ Service  │  │                  │
    │          │  │          │  │ • Grab           │
    │ • Record │  │ • APP    │  │ • Gojek          │
    │   Position│  │ • SMS    │  │ • Be             │
    │ • Send   │  │ • Call   │  │ • Mai Linh Taxi  │
    │   to API │  │          │  │ • Vinasun Taxi   │
    └──────────┘  └──────────┘  └──────────────────┘
```

### GPS Data Flow

```
┌──────────┐          ┌──────────┐          ┌──────────┐
│   GPS    │   HTTP   │  Backend │   SQL    │ Database │
│  Device  │─────────>│   API    │─────────>│          │
└──────────┘          └──────────┘          └──────────┘
                           │
                           │ POST /gps/record
                           │ {vehicleId, lat, lng,
                           │  speed, heading, timestamp}
                           │
                           ▼
                    ┌──────────────┐
                    │ gps_locations│
                    │ (partitioned │
                    │  by month)   │
                    └──────────────┘
```

---

## Real-time Communication

### WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Architecture                        │
└─────────────────────────────────────────────────────────────────┘

       Client A                                      Client B
     (Employee)                                      (Driver)
         │                                              │
         │  WS: /chat?token=xxx                        │
         ├─────────────────────────┐                   │
         │                         ▼                   │
         │              ┌────────────────────┐         │
         │              │   Chat Gateway     │         │
         │              │   (Socket.io)      │         │
         │              │                    │         │
         │              │  ┌──────────────┐  │         │
         │              │  │ User Socket  │  │         │
         │              │  │    Map       │  │         │
         │              │  │              │  │         │
         │              │  │ userA: [s1]  │  │         │
         │              │  │ userB: [s2]  │  │         │
         │              │  └──────────────┘  │         │
         │              │                    │         │
         │              │  ┌──────────────┐  │         │
         │              │  │    Rooms     │  │         │
         │              │  │              │  │         │
         │              │  │room:{id}:[A,B]│  │         │
         │              │  └──────────────┘  │         │
         │              └────────────────────┘         │
         │                         │                   │
         │  sendMessage            │                   │
         ├────────────────────────>│                   │
         │                         │   newMessage      │
         │                         ├──────────────────>│
         │                         │                   │
```

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client → Server | Initial WebSocket connection with JWT |
| `joinRoom` | Client → Server | Join a chat room |
| `leaveRoom` | Client → Server | Leave a chat room |
| `sendMessage` | Client → Server | Send a chat message |
| `newMessage` | Server → Client | Broadcast new message to room |
| `markRead` | Client → Server | Mark messages as read |
| `messagesRead` | Server → Client | Notify read status update |
| `typing` | Client → Server | Typing indicator |
| `userTyping` | Server → Client | Broadcast typing status |

---

## Database Architecture

### Schema Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│                    msm_car_booking                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   User Domain    │  │  Booking Domain  │  │ Fleet Domain │  │
│  │                  │  │                  │  │              │  │
│  │  • users         │  │  • bookings      │  │  • vehicles  │  │
│  │  • departments   │  │  • trip_stops    │  │  • km_quotas │  │
│  │  • driver_shifts │  │  • trip_events   │  │  • odometer  │  │
│  │                  │  │  • trip_expenses │  │  • maintenance│  │
│  │                  │  │  • external_disp │  │              │  │
│  │                  │  │  • approvals     │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Chat Domain    │  │ Tracking Domain  │  │System Domain │  │
│  │                  │  │                  │  │              │  │
│  │  • chat_rooms    │  │  • gps_locations │  │  • configs   │  │
│  │  • chat_messages │  │  • notifications │  │  • audit_logs│  │
│  │                  │  │  • pickup_points │  │  • sequences │  │
│  │                  │  │  • trip_reports  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **UUID Primary Keys** | Distributed system support, no enumeration attacks |
| **Soft Deletes** | Maintain referential integrity, audit trails |
| **JSONB for Config** | Flexible key-value storage, schema evolution |
| **GPS Partitioning** | Monthly partitions for high-volume time-series data |
| **Booking Sequences** | Race condition prevention for code generation |
| **Status Triggers** | Database-level validation of state transitions |

---

## Performance Optimizations

### Database Tuning (4GB VPS)

```sql
-- PostgreSQL Configuration
shared_buffers = 512MB           -- 25% of available RAM
effective_cache_size = 1536MB    -- 75% of available RAM
work_mem = 16MB                  -- Per-operation memory
max_connections = 50             -- Connection pool limit
wal_buffers = 16MB               -- Write-ahead log buffer
```

### Indexing Strategy

```sql
-- Composite indexes with tenant_id first (multi-tenant ready)
CREATE INDEX idx_bookings_tenant_status ON bookings(tenant_id, status);
CREATE INDEX idx_vehicles_tenant_status ON vehicles(tenant_id, status);

-- Partial indexes for active records
CREATE INDEX idx_users_active ON users(email) WHERE is_active = true;

-- GPS time-series optimization
CREATE INDEX idx_gps_vehicle_time ON gps_locations(vehicle_id, recorded_at DESC);
```

### Nginx Optimizations

```nginx
# Compression
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# Rate Limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn:10m;

# Connection limits
limit_conn conn 20;
```

---

## Scalability Considerations

### Current Limitations (Single Node)

- WebSocket connections stored in memory
- No horizontal scaling for backend
- Single PostgreSQL instance

### Future Scaling Path

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scaled Architecture                           │
│                                                                 │
│  ┌─────────┐                                                    │
│  │  Load   │                                                    │
│  │Balancer │                                                    │
│  └────┬────┘                                                    │
│       │                                                         │
│  ┌────┴────────────────────────────────┐                       │
│  │                                      │                       │
│  ▼                                      ▼                       │
│ ┌──────────┐                      ┌──────────┐                 │
│ │ Backend 1│◄────────────────────►│ Backend 2│                 │
│ └────┬─────┘      Redis           └────┬─────┘                 │
│      │         (Session Store,         │                        │
│      │         Socket Adapter)         │                        │
│      │                                 │                        │
│      └────────────────┬────────────────┘                        │
│                       │                                         │
│                  ┌────▼────┐                                    │
│                  │ Primary │◄─── Streaming Replication          │
│                  │   DB    │                                    │
│                  └────┬────┘                                    │
│                       │                                         │
│                  ┌────▼────┐                                    │
│                  │ Replica │ (Read queries)                     │
│                  │   DB    │                                    │
│                  └─────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Scaling Recommendations

1. **Redis Adapter** - For Socket.io multi-node support
2. **Read Replicas** - For reporting and analytics queries
3. **Connection Pooling** - PgBouncer for connection management
4. **Caching Layer** - Redis for session and query caching
5. **CDN** - For static assets and frontend distribution

---

## Monitoring & Observability

### Current Setup

- **Application Logs** - Structured JSON logging
- **Database Metrics** - pg_stat_statements
- **Container Metrics** - Docker stats

### Recommended Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    Observability Stack                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Prometheus  │  │   Grafana    │  │   Loki       │          │
│  │              │  │              │  │              │          │
│  │  Metrics     │  │  Dashboards  │  │  Log         │          │
│  │  Collection  │──│  Alerting    │──│  Aggregation │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ▲                                    ▲                  │
│         │                                    │                  │
│  ┌──────┴──────────────────────────────────┴──────┐            │
│  │              Application Containers            │            │
│  │                                                │            │
│  │  • NestJS metrics endpoint                    │            │
│  │  • PostgreSQL exporter                        │            │
│  │  • Nginx metrics                              │            │
│  └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [Database Models](/docs/database-models) - Complete schema documentation
- [Business Flows](/docs/business-flows) - Business process documentation
- [System Workflows](/docs/system-workflows) - Visual workflow diagrams
- [DevOps Guide](/docs/devops) - Deployment and operations
- [Vehicle Matching Algorithm](/docs/backend/vehicle-matching-algorithm) - Dispatch algorithm details
