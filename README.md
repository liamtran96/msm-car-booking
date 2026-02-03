# MSM Car Booking

Enterprise vehicle management system for corporate fleet booking and dispatching.

## Overview

MSM Car Booking automates vehicle allocation with dispatching, KM quota management, and external provider integration (Grab/Taxi) when internal vehicles are unavailable. It supports multi-stop bookings, block schedules, and role-based access for Admin, PIC, GA, Drivers, and Employees.

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript | 19.x |
| **Build Tool** | Vite | 7.x |
| **UI Framework** | Tailwind CSS 4 + Shadcn UI | 4.x |
| **State** | Zustand + TanStack Query v5 | 5.x |
| **Forms** | React Hook Form + Zod v4 | 7.x / 4.x |
| **Backend** | NestJS + TypeScript | 10.x |
| **ORM** | TypeORM | 0.3.x |
| **Database** | PostgreSQL | 16.x |
| **Auth** | Passport.js + JWT (httpOnly cookies) | - |
| **Real-time** | Socket.io | 4.x |
| **Testing** | Jest (unit/integration/E2E) + Playwright (frontend E2E) | - |
| **Containers** | Docker + Docker Compose | - |
| **Reverse Proxy** | Nginx | Alpine |

## Project Structure

```
msm-car-booking/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── common/          # Shared guards, decorators, enums, pipes
│   │   ├── config/          # Configuration module
│   │   ├── database/        # Migrations, seeds, entities
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # JWT authentication
│   │   │   ├── users/       # User management + driver shifts
│   │   │   ├── bookings/    # Booking lifecycle + trip entities
│   │   │   ├── vehicles/    # Fleet + KM quotas + maintenance
│   │   │   ├── approvals/   # Approval workflow
│   │   │   ├── chat/        # WebSocket real-time messaging
│   │   │   ├── gps/         # GPS tracking
│   │   │   ├── notifications/ # Multi-channel alerts
│   │   │   ├── departments/ # Organization structure
│   │   │   ├── locations/   # Pickup points
│   │   │   └── system/      # Configuration + audit logs
│   │   └── test/            # Test factories, mocks, utilities
│   └── test/                # E2E + integration tests
│
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Shared UI components (shadcn/ui)
│   │   ├── config/          # Routes, query client
│   │   ├── constants/       # Roles, status styles
│   │   ├── features/        # Feature modules (auth, bookings, users, dashboard)
│   │   ├── lib/             # Axios, formatters, utils
│   │   └── types/           # Enums, interfaces
│   └── e2e/                 # Playwright E2E tests
│
├── docs-site/               # Docusaurus documentation
│   └── docs/                # Business flows, architecture, backend, frontend, devops
│
├── plans/                   # Implementation plans
└── .claude/                 # Workflow definitions, agent configs, skills
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)

### Quick Start

```bash
# Clone and install
git clone <repository-url>
cd msm-car-booking

# Backend
cd backend
pnpm install
cp .env.example .env       # Configure environment variables

# Start database
docker compose up -d postgres

# Run migrations and seed data
pnpm typeorm migration:run
pnpm seed:run

# Start backend
pnpm start:dev             # http://localhost:3001

# Frontend (new terminal)
cd ../frontend
pnpm install
pnpm dev                   # http://localhost:5173
```

### Docker (Full Stack)

```bash
docker compose up -d       # Starts nginx, backend, postgres
```

## Development Commands

### Backend

```bash
cd backend
pnpm start:dev              # Watch mode
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm test                   # Unit tests
pnpm test:e2e               # E2E tests (requires Docker)
pnpm test:integration       # Integration tests (requires Docker)
pnpm test:all               # All tests
pnpm typeorm migration:generate src/database/migrations/Name
pnpm typeorm migration:run
pnpm db:reset               # Reset and reseed database
```

### Frontend

```bash
cd frontend
pnpm dev                    # Vite dev server
pnpm build                  # Production build
pnpm lint                   # ESLint
pnpm test:e2e               # Playwright E2E tests
```

### Documentation

```bash
cd docs-site
pnpm start                  # Local docs server
pnpm build                  # Build static docs
```

## Implementation Status

See [Implementation Status](docs-site/docs/implementation-status.md) for detailed tracking of what's built vs what's remaining.

### Summary

| Area | Status |
|------|--------|
| Authentication (JWT + httpOnly cookies) | **Done** |
| RBAC (5 roles, guards, decorators) | **Done** |
| User Management (backend) | **Done** (11 endpoints) |
| Driver Shift Management (backend) | **Done** (13 endpoints) |
| Approval Workflow (backend) | **Done** (7 endpoints) |
| Chat System (backend + WebSocket) | **Done** (8 endpoints + WS) |
| Booking Management (backend) | Partial (read-only, create/update endpoints missing) |
| Vehicle Management (backend) | Partial (read-only, CRUD endpoints missing) |
| Frontend Pages | Login done, others are placeholders |
| GPS Tracking | Backend read-only, no map UI |
| Reporting | Not started |
| Notifications (push/SMS) | Entity only, no sending mechanism |
| Vehicle Matching Algorithm | Design doc only, no code |

## Documentation

- **[Business Flows](docs-site/docs/business-flows.md)** - Functional requirements and business rules
- **[System Workflows](docs-site/docs/system-workflows.md)** - Visual flowcharts (Mermaid)
- **[Database Models](docs-site/docs/database-models.mdx)** - Schema documentation with ERD
- **[Architecture](docs-site/docs/architecture/index.md)** - System architecture and deployment
- **[Backend](docs-site/docs/backend/index.md)** - API endpoint inventory and module reference
- **[Frontend](docs-site/docs/frontend/index.md)** - React architecture and design system
- **[DevOps](docs-site/docs/devops/index.md)** - Docker, deployment, monitoring

## Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full system access, configuration, user management |
| **PIC** | Dispatch operations, monitoring, booking management |
| **GA** | External vehicle rental management |
| **DRIVER** | Trip execution, odometer, expense tracking |
| **EMPLOYEE** | Vehicle booking requests |

## License

Proprietary - MSM Internal Use Only
