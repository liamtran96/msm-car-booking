# Database Setup Guide

This guide provides step-by-step instructions for setting up the PostgreSQL database for MSM Car Booking system.

## Development Setup

### Quick Start

**1. Start PostgreSQL Container**

```bash
docker compose up -d postgres
```

**2. Database is Auto-Created**

With `DB_SYNCHRONIZE=true` in `.env`, NestJS automatically creates tables from entities when you start the backend:

```bash
cd backend
pnpm start:dev
```

✅ Database schema is automatically synchronized with your entities!

---

## Production Setup

### Option 1: Linux VPS (Direct PostgreSQL)

**Step 1: Create the database**

```bash
sudo -u postgres psql -c "CREATE DATABASE msm_car_booking;"
```

**Step 2: Create the application user**

```bash
sudo -u postgres psql -c "CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';"
```

**Step 3: Grant database privileges**

```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;"
```

**Step 4: Connect and grant schema privileges**

```bash
sudo -u postgres psql -d msm_car_booking -c "GRANT ALL ON SCHEMA public TO msm_app_user;"
```

**Step 5: Grant default privileges for future tables**

```bash
sudo -u postgres psql -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO msm_app_user;"
```

**Step 6: Grant default privileges for sequences**

```bash
sudo -u postgres psql -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO msm_app_user;"
```

### Option 2: Docker PostgreSQL

**Step 1: Create the database**

```bash
docker exec -i msm_postgres psql -U postgres -c "CREATE DATABASE msm_car_booking;"
```

**Step 2: Create the application user**

```bash
docker exec -i msm_postgres psql -U postgres -c "CREATE USER msm_app_user WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD';"
```

**Step 3: Grant database privileges**

```bash
docker exec -i msm_postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE msm_car_booking TO msm_app_user;"
```

**Step 4: Grant schema privileges**

```bash
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "GRANT ALL ON SCHEMA public TO msm_app_user;"
```

**Step 5: Grant default privileges for future tables**

```bash
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO msm_app_user;"
```

**Step 6: Grant default privileges for sequences**

```bash
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO msm_app_user;"
```

---

## Configure Environment

### Development (.env)

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=true    # Auto-sync enabled
DB_LOGGING=true        # See SQL queries
```

### Production (.env.production)

```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=msm_app_user
DB_PASSWORD=your_secure_password
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false   # CRITICAL: Must be false!
DB_LOGGING=false       # Don't log queries
```

---

## Apply Migrations (Production Only)

After database is created, run migrations to create tables:

```bash
cd backend
export $(cat .env.production | xargs)
pnpm migration:run
```

---

## Verify Setup

**Check tables were created:**

```bash
# Docker
docker exec -i msm_postgres psql -U msm_app_user -d msm_car_booking -c "\dt"

# Direct PostgreSQL
psql -U msm_app_user -d msm_car_booking -c "\dt"
```

Expected: 19 tables created

**Check migration history:**

```bash
# Docker
docker exec -i msm_postgres psql -U msm_app_user -d msm_car_booking -c "SELECT * FROM typeorm_migrations ORDER BY id DESC LIMIT 5;"

# Direct PostgreSQL
psql -U msm_app_user -d msm_car_booking -c "SELECT * FROM typeorm_migrations ORDER BY id DESC LIMIT 5;"
```

---

## Common Commands

### Development

```bash
# Reset database (drop + recreate + seed)
pnpm db:reset

# Run migrations manually
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Generate migration from entity changes
pnpm migration:generate src/database/migrations/MigrationName
```

### Production

```bash
# Backup database
pg_dump -U msm_app_user msm_car_booking > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore database
psql -U msm_app_user -d msm_car_booking < backup-20260201-120000.sql

# Run migrations
pnpm migration:run
```

---

## Troubleshooting

### Connection Failed

**Check PostgreSQL is running:**

```bash
docker compose ps postgres
```

**Test connection:**

```bash
psql -h localhost -p 5433 -U postgres -d msm_car_booking -c "SELECT 1;"
```

### Permission Denied

**Grant privileges again:**

```bash
docker exec -i msm_postgres psql -U postgres -d msm_car_booking -c "
GRANT ALL ON SCHEMA public TO msm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO msm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO msm_app_user;
"
```

### Tables Not Created

**Development:** Ensure `DB_SYNCHRONIZE=true` in `.env`

**Production:** Run migrations: `pnpm migration:run`

---

## Related Documentation

- [VPS Deployment Guide](../../docs-site/docs/devops/08-vps-deployment-guide.md)
- [Database Setup & Migrations (Docusaurus)](../../docs-site/docs/backend/database-setup.md)
- [Backend README](../README.md)
