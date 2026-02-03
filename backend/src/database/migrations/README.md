# TypeORM Migrations

This directory contains TypeORM-managed database migrations for the MSM Car Booking System.

## Migration Files

### 1738394400000-AddUserModuleIndexesAndConstraints.ts

**Purpose:** Add critical performance indexes and data integrity constraints for the Core User Module.

**What it does:**
- ✅ Adds performance indexes for `users` table (role, is_active, full-text search)
- ✅ Adds performance indexes for `driver_shifts` table (date, status, availability)
- ✅ Fixes `users.department_id` foreign key to use `ON DELETE SET NULL`
- ✅ Adds time validation constraint for driver shifts
- ✅ Adds status transition trigger for shift state machine enforcement
- ✅ Enables `pg_trgm` extension for full-text search
- ✅ Adds automatic `updated_at` triggers

**Performance Impact:**
- **Before:** Sequential scans on filtered queries (slow)
- **After:** Index scans on all major query patterns (fast)

**Data Integrity:**
- Status transitions enforced at database level (prevents invalid states)
- Time validation ensures `end_time > start_time`
- Foreign key cascades properly configured

## How to Apply Migrations

### First Time Setup

If tables don't exist yet, you have two options:

**Option 1: Use TypeORM Schema Sync (Development Only)**
```bash
cd backend
pnpm schema:sync
```
This creates tables from entities and applies all migrations.

### Applying New Migrations

When new migration files are added:

```bash
cd backend

# Check migration status
pnpm migration:show

# Run pending migrations
pnpm migration:run
```

### Rolling Back Migrations

If you need to revert the last migration:

```bash
pnpm migration:revert
```

## Verifying Migrations

After running migrations, verify they were applied:

```bash
# Check migration history
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "SELECT * FROM typeorm_migrations ORDER BY id DESC;"

# Check indexes were created
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('users', 'driver_shifts') ORDER BY tablename, indexname;"

# Check triggers were created
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "\df validate_shift_status_transition"
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "\df update_updated_at_column"
```

## Testing Query Performance

After applying the migration, test query performance:

```bash
# Test user search with EXPLAIN ANALYZE
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "
EXPLAIN ANALYZE
SELECT * FROM users
WHERE (full_name ILIKE '%john%' OR email ILIKE '%john%')
  AND role = 'DRIVER'
  AND is_active = true;
"

# Test driver availability query
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "
EXPLAIN ANALYZE
SELECT * FROM driver_shifts
WHERE shift_date = CURRENT_DATE
  AND start_time <= '14:00'
  AND end_time >= '14:00'
  AND status IN ('SCHEDULED', 'ACTIVE');
"
```

Look for:
- ✅ "Index Scan" or "Index Only Scan" (good)
- ❌ "Seq Scan" (bad - indicates missing index)

## Creating New Migrations

### Auto-generate from Entity Changes

When you modify entities, generate a migration:

```bash
pnpm migration:generate src/database/migrations/DescriptiveName
```

TypeORM will detect changes and create a migration file.

### Create Empty Migration

For manual SQL changes:

```bash
pnpm migration:create src/database/migrations/DescriptiveName
```

Then edit the generated file to add your custom SQL.

## Migration Naming Convention

Format: `{timestamp}-{DescriptiveName}.ts`

Examples:
- `1738394400000-AddUserModuleIndexesAndConstraints.ts`
- `1738480000000-AddBookingModule.ts`
- `1738566400000-FixVehicleQuotaCalculation.ts`

Timestamps are auto-generated (Unix timestamp in milliseconds).

## Best Practices

1. **Always test migrations on development first** before applying to production
2. **Include rollback logic** in the `down()` method
3. **Document what the migration does** in comments
4. **Keep migrations focused** - one logical change per migration
5. **Never modify existing migrations** that have been applied to production
6. **Back up database before running migrations** in production

## Troubleshooting

### Migration fails with "relation already exists"

The table might already exist from schema sync or legacy SQL. Options:
- Run `pnpm schema:drop` and start fresh (development only!)
- Modify migration to use `IF NOT EXISTS` clauses

### Migration fails with "constraint already exists"

Same as above - use `IF NOT EXISTS` in constraint creation.

### Want to reset everything

```bash
# DANGER: This drops all tables!
pnpm schema:drop

# Then re-run migrations
pnpm migration:run
```

## Related Documentation

- [TypeORM Migrations Guide](https://typeorm.io/migrations)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
