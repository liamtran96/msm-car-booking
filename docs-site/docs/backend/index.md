# Backend Documentation

NestJS-based backend API for the MSM Car Booking system.

## Architecture

- **Framework:** NestJS 10 with TypeScript
- **Database:** PostgreSQL 18 with TypeORM
- **Authentication:** JWT with Passport.js
- **API Documentation:** Swagger/OpenAPI
- **Architecture Pattern:** Modular, domain-driven

## Documentation Index

### Security

- **[Security Features](./security.md)** - Authentication, rate limiting, CORS, HTTP headers, and WebSocket security

### Database

- **[Database Setup & Migrations](./database-setup.md)** - Development and production database initialization, migration workflow, and best practices

### Algorithms

- **[Vehicle Matching Algorithm](./vehicle-matching-algorithm.md)** - Automated vehicle-driver assignment with weighted scoring

## Quick Links

### Development

```bash
# Start development server
cd backend
pnpm start:dev

# Generate migration
pnpm migration:generate src/database/migrations/MigrationName

# Run tests
pnpm test

# Build for production
pnpm build
```

### Key Modules

| Module | Description | Path |
|--------|-------------|------|
| **Auth** | JWT authentication, login, SSO | `src/modules/auth/` |
| **Users** | User management, RBAC, driver shifts | `src/modules/users/` |
| **Departments** | Organizational units | `src/modules/departments/` |
| **Vehicles** | Fleet management, GPS tracking | `src/modules/vehicles/` |
| **Bookings** | Trip reservations, multi-stop | `src/modules/bookings/` |
| **Notifications** | Multi-channel alerts | `src/modules/notifications/` |

## Related Documentation

- [DevOps & Deployment](../devops/index.md)
- [Business Flows](../business-flows.md)
- [System Workflows](../system-workflows.md)
