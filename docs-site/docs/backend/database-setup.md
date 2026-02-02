# Database Setup & Migrations

This guide covers database initialization and migration management for both development and production environments.

## Overview

The MSM Car Booking system uses:
- **Database:** PostgreSQL 18
- **ORM:** TypeORM
- **Schema Management:** Entity-based with migrations

### Key Principles

| Environment | Schema Management | DB_SYNCHRONIZE | Safety |
|-------------|-------------------|----------------|--------|
| **Development** | Migrations | `false` | Safe, versioned, consistent with production |
| **Production** | Migrations only | `false` | Safe, versioned, reversible |

---

## Development Setup

### Quick Start

**1. Configure Environment**

Create `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false   # ← Use migrations for schema changes
DB_LOGGING=true        # ← See SQL queries in console
```

**2. Start PostgreSQL**

```bash
docker compose up -d postgres
```

**3. Run Migrations**

```bash
cd backend
pnpm migration:run
```

**4. Start Backend**

```bash
pnpm start:dev
```

✅ **Schema is managed through migrations!**

### How Migration-Based Development Works

When `DB_SYNCHRONIZE=false`:

1. Edit entity files to define desired schema
2. Generate migration from entity changes
3. Review generated SQL in migration file
4. Apply migration to update database schema
5. All environments use the same versioned migrations

**Benefits:**
- ✅ Consistent schema management across all environments
- ✅ Version-controlled database changes
- ✅ Reversible migrations with rollback support
- ✅ Safe, predictable schema updates
- ✅ No unexpected schema changes on restart

### Making Schema Changes

**1. Edit Entity Files:**

```typescript
// backend/src/modules/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // Add new field
  @Column({ nullable: true })
  phoneNumber: string;
}
```

**2. Generate Migration:**

```bash
pnpm migration:generate src/database/migrations/AddPhoneNumberToUser
```

**3. Review Generated Migration:**

```bash
cat src/database/migrations/TIMESTAMP-AddPhoneNumberToUser.ts
```

**4. Apply Migration:**

```bash
pnpm migration:run
```

✅ **Column added safely with versioned migration!**

---

## Production Setup

### Initial Database Setup

**1. Create Database and User**

:::note Platform-Specific
The command differs based on your operating system and PostgreSQL installation method.
:::

**Linux VPS (Production):**

```bash
sudo -u postgres psql << EOF
CREATE DATABASE msm_car_booking;
CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;
\c msm_car_booking
GRANT ALL ON SCHEMA public TO msm_app_user;
EOF
```

**macOS/Windows with Docker:**

Run these commands step-by-step:

```bash
# Step 1: Create the database
docker exec -i msm_postgres psql -U postgres -c "CREATE DATABASE msm_car_booking;"

# Step 2: Create the application user
docker exec -i msm_postgres psql -U postgres -c "CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';"

# Step 3: Grant database privileges
docker exec -i msm_postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;"

# Step 4: Grant schema privileges
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "GRANT ALL ON SCHEMA public TO msm_app_user;"

# Step 5: Grant default privileges for future tables
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO msm_app_user;"

# Step 6: Grant default privileges for sequences
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO msm_app_user;"
```

**2. Configure Environment**

Create `backend/.env.production`:

```env
# Application
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=msm_app_user
DB_PASSWORD=your_secure_password
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false   # ← CRITICAL: Must be false in production!
DB_LOGGING=false       # ← Don't log queries in production
```

**3. Apply Migrations**

```bash
cd backend
export $(cat .env.production | xargs)
pnpm migration:run
```

**4. Verify Tables**

```bash
psql -U msm_app_user -d msm_car_booking -c "\dt"
```

Expected: 19 tables created

---

## Migration Workflow

### Development Process

**1. Make Entity Changes**

```typescript
// Add new field to entity
@Column({ nullable: true })
newField: string;
```

**2. Generate Migration**

```bash
# Generate migration from entity changes
pnpm migration:generate src/database/migrations/AddNewFieldToUser

# Review generated SQL
cat src/database/migrations/TIMESTAMP-AddNewFieldToUser.ts
```

**3. Test Migration**

```bash
# Apply migration
pnpm migration:run

# Verify schema update
psql -d msm_car_booking -c "\d users"

# Test rollback if needed
pnpm migration:revert

# Re-apply
pnpm migration:run
```

**4. Update Seed Scripts**

If the migration affects seeded tables, update seed files in `src/database/seeds/` to include the new field.

**5. Test with Seeds**

```bash
# Reset database and run seeds
pnpm db:reset
```

**6. Commit Migration File**

```bash
git add src/database/migrations/ src/database/seeds/
git commit -m "feat: add new field to user entity"
```

### Production Deployment

**Before Deploying:**

1. ✅ Backup database
2. ✅ Test migration locally
3. ✅ Review generated SQL
4. ✅ Plan for rollback if needed

**Deploy Process:**

```bash
# SSH to production server
ssh user@production-server

cd /path/to/backend

# 1. Backup database
pg_dump -U msm_app_user msm_car_booking > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
pnpm install --prod

# 4. Run migrations
export $(cat .env.production | xargs)
pnpm migration:run

# 5. Build and restart
pnpm build
pm2 restart msm-backend
```

**Verify Migration:**

```bash
# Check migration was applied
psql -U msm_app_user -d msm_car_booking -c "
SELECT * FROM typeorm_migrations ORDER BY id DESC LIMIT 5;
"
```

---

## Current Migrations

### 1738394400000-AddUserModuleIndexesAndConstraints

**Status:** ✅ Applied
**Purpose:** Add performance indexes and data integrity constraints

**What it includes:**

#### Performance Indexes (13 total)

**Users table (8 indexes):**
- `idx_users_role` - Role filtering
- `idx_users_is_active` - Active/inactive filtering
- `idx_users_role_active` - Composite role + status
- `idx_users_user_segment` - User segment queries
- `idx_users_department_id` - Department filtering
- `idx_users_fullname_trgm` - Full-text search on name
- `idx_users_email_trgm` - Full-text search on email
- `idx_users_created_at_desc` - Pagination ordering

**Driver_shifts table (5 indexes):**
- `idx_driver_shifts_shift_date` - Date queries
- `idx_driver_shifts_status` - Status filtering
- `idx_driver_shifts_date_status` - Composite date + status
- `idx_driver_shifts_availability` - Optimized availability lookups
- `idx_driver_shifts_date_time_asc` - Chronological ordering

#### Data Integrity

**Foreign Key Fix:**
- `users.department_id` → `ON DELETE SET NULL`

**Constraints:**
- `chk_shift_time_valid` - Ensures end_time > start_time

**Triggers:**
- `trg_validate_shift_status_transition` - Status state machine
- `trg_users_updated_at` - Auto-update timestamp
- `trg_driver_shifts_updated_at` - Auto-update timestamp

**Performance Impact:**
- Before: Sequential scans on filtered queries
- After: Index scans (~40x faster)

---

## Database Schema

### Core Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| `departments` | Organizational units | Cost center tracking |
| `users` | System users | RBAC with 5 roles |
| `driver_shifts` | Driver schedules | Availability matching |
| `vehicles` | Fleet management | GPS tracking |
| `bookings` | Trip reservations | Multi-stop support |
| `trip_stops` | Booking waypoints | Pickup/drop points |
| `trip_expenses` | Driver expenses | Receipt uploads |
| `gps_locations` | Real-time tracking | Time-series data |
| `notifications` | Multi-channel alerts | APP_PUSH, SMS, CALL |

**Total:** 19 tables

### Entity Locations

Entities are the source of truth for schema:

```
backend/src/modules/
├── users/entities/
│   ├── user.entity.ts              → users table
│   └── driver-shift.entity.ts      → driver_shifts table
├── departments/entities/
│   └── department.entity.ts        → departments table
├── vehicles/entities/
│   ├── vehicle.entity.ts           → vehicles table
│   └── km-quota.entity.ts          → km_quotas table
└── bookings/entities/
    ├── booking.entity.ts           → bookings table
    └── trip-stop.entity.ts         → trip_stops table
```

---

## Migration Commands

### Common Operations

```bash
# Generate migration from entity changes
pnpm migration:generate src/database/migrations/MigrationName

# Create empty migration (for manual SQL)
pnpm migration:create src/database/migrations/MigrationName

# Apply pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Sync schema (development only)
pnpm schema:sync

# Drop all tables (DANGER!)
pnpm schema:drop

# Reset database (drop + run migrations)
pnpm db:reset
```

### Verification Commands

```bash
# List all tables
psql -d msm_car_booking -c "\dt"

# List indexes on specific table
psql -d msm_car_booking -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
"

# Check triggers
psql -d msm_car_booking -c "
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
"

# View migration history
psql -d msm_car_booking -c "
SELECT * FROM typeorm_migrations ORDER BY id DESC;
"
```

---

## Troubleshooting

### Migration Fails: "Column already exists"

**Cause:** Table created by auto-sync, migration tries to create it again.

**Fix:**

```bash
# Option 1: Mark migration as executed
psql -d msm_car_booking -c "
INSERT INTO typeorm_migrations (timestamp, name)
VALUES (1738394400000, 'MigrationName');
"

# Option 2: Drop and recreate (if no data)
psql -d msm_car_booking -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm migration:run
```

### Migration Not Applied

**Check:**

1. Migration file exists in `src/database/migrations/`
2. Migration hasn't been run yet (check `typeorm_migrations` table)
3. Database connection successful

**Debug:**

```bash
# Show migration status
pnpm migration:show

# Check migration history
psql -d msm_car_booking -c "SELECT * FROM typeorm_migrations ORDER BY id DESC;"

# Enable query logging
DB_LOGGING=true pnpm migration:run
```

### Database Connection Failed

**Common causes:**

1. PostgreSQL not running
2. Wrong credentials in `.env`
3. Port conflict (use different port)

**Check:**

```bash
# Test connection
psql -h localhost -U postgres -d msm_car_booking -c "SELECT 1;"

# Check PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres
```

---

## Best Practices

### Development

✅ **DO:**
- Use migrations for all schema changes
- Generate migrations after editing entities
- Test migrations with `run` and `revert`
- Update seed scripts when schema changes
- Keep entities as source of truth

❌ **DON'T:**
- Commit without generating migration
- Edit migration files after they've been applied
- Delete migration files
- Use `DB_SYNCHRONIZE=true` in any environment

### Production

✅ **DO:**
- Always backup before migrations
- Review generated SQL
- Test migrations in staging first
- Use `DB_SYNCHRONIZE=false`
- Monitor after deployment
- Run migrations in maintenance window

❌ **DON'T:**
- Run untested migrations
- Skip backups
- Modify migrations after deployment
- Bypass migration system
- Apply migrations without backup

---

## Performance Optimization

### Query Performance Testing

Test index usage with `EXPLAIN ANALYZE`:

```sql
-- Test user search
EXPLAIN ANALYZE
SELECT * FROM users
WHERE (full_name ILIKE '%john%' OR email ILIKE '%john%')
AND role = 'DRIVER'
AND is_active = true;
```

**Good output:** "Index Scan using idx_users_fullname_trgm"
**Bad output:** "Seq Scan on users"

### Index Guidelines

- Add indexes for frequently filtered columns
- Use composite indexes for multi-column filters
- Use partial indexes for conditional queries
- Monitor index usage with pg_stat_user_indexes

---

## Related Documentation

- [Backend Architecture](./index.md)
- [Vehicle Matching Algorithm](./vehicle-matching-algorithm.md)
- [Docker Setup](../devops/01-docker.md)
- [VPS Deployment Guide](../devops/08-vps-deployment-guide.md)

---

## Quick Reference

| Task | Development | Production |
|------|-------------|------------|
| **Schema Update** | Edit entity → generate migration → apply | Generate migration → deploy |
| **First Deploy** | `pnpm migration:run` | `pnpm migration:run` |
| **Rollback** | `pnpm migration:revert` | `pnpm migration:revert` |
| **Verify** | `SELECT * FROM typeorm_migrations` | `SELECT * FROM typeorm_migrations` |

**Remember:** Both environments use migrations for safe, versioned schema management
