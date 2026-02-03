---
id: environment-variables
title: Environment Variables Reference
sidebar_position: 10
---

# Environment Variables Reference

Complete reference for all environment variables used in the MSM Car Booking system.

## Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Production** | `dev-secret-key...` | JWT signing secret |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |
| `NODE_ENV` | No | `development` | Environment mode |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `DB_HOST` | Alternative | `localhost` | Database host |
| `DB_PORT` | Alternative | `5432` | Database port |
| `DB_USERNAME` | Alternative | `postgres` | Database user |
| `DB_PASSWORD` | Alternative | - | Database password |
| `DB_NAME` | Alternative | `msm_car_booking` | Database name |

---

## Required Variables

### JWT_SECRET

**Critical security variable for JWT token signing.**

| Property | Value |
|----------|-------|
| Required | **Yes** (Production) |
| Type | String |
| Min Length | 32 characters (64+ recommended) |

**Behavior:**

| Environment | If Missing |
|-------------|------------|
| `production` | Application **fails to start** |
| `development` | Uses insecure default |
| `test` | Uses insecure default |

**Generate a secure secret:**

```bash
# Using OpenSSL (recommended)
openssl rand -base64 64

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Example:**
```env
JWT_SECRET=K7gNs2Pf9Wx4QmZ6Yd8Bv3Hj5Lt0Ru1Ec7Ia9Ow2Up4Sf6Tg8Jk0Ml3Cn5Xr1Dh7Fq9Iy2Ez4Av6Bw8Nx0Po3Qm5Rs7Ut9Vl1Wc3Ye
```

---

### DATABASE_URL

**PostgreSQL connection string (preferred method).**

| Property | Value |
|----------|-------|
| Required | Yes (or use individual DB_* vars) |
| Type | String (PostgreSQL connection URI) |
| Format | `postgresql://user:password@host:port/database` |

**Example:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/msm_car_booking
```

**Production Example:**
```env
DATABASE_URL=postgresql://msm_user:StrongP@ssw0rd@db.example.com:5432/msm_production?sslmode=require
```

---

### Individual Database Variables

**Alternative to DATABASE_URL (use one method, not both).**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `localhost` | Database server hostname |
| `DB_PORT` | No | `5432` | Database port |
| `DB_USERNAME` | Yes | `postgres` | Database username |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_NAME` | Yes | `msm_car_booking` | Database name |

**Example:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=msm_car_booking
```

---

## Optional Variables

### NODE_ENV

**Application environment mode.**

| Property | Value |
|----------|-------|
| Required | No |
| Default | `development` |
| Values | `development`, `production`, `test` |

**Effects by environment:**

| Feature | development | production | test |
|---------|-------------|------------|------|
| JWT_SECRET required | No | **Yes** | No |
| Detailed error messages | Yes | No | Yes |
| Swagger UI | Yes | No | No |
| Logger level | debug | info | warn |

**Example:**
```env
NODE_ENV=production
```

---

### CORS_ORIGIN

**Allowed origin for Cross-Origin Resource Sharing.**

| Property | Value |
|----------|-------|
| Required | No |
| Default | `http://localhost:3000` |
| Type | String (URL) |

**Used by:**
- REST API CORS middleware
- WebSocket gateway CORS configuration

**Examples:**
```env
# Development
CORS_ORIGIN=http://localhost:3000

# Production (single origin)
CORS_ORIGIN=https://app.msm.com

# Production (with port)
CORS_ORIGIN=https://app.msm.com:8443
```

**Security Notes:**
- Never use `*` wildcard in production
- Must match your frontend domain exactly
- Include protocol (http/https)

---

### PORT

**Application server port.**

| Property | Value |
|----------|-------|
| Required | No |
| Default | `3001` |
| Type | Number |

**Example:**
```env
PORT=3001
```

---

## Environment File Templates

### Development (.env.development)

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=msm_car_booking

# Security (development only - not secure!)
JWT_SECRET=dev-secret-key-not-for-production

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Production (.env.production)

```env
# Application
NODE_ENV=production
PORT=3001

# Database (use strong password!)
DATABASE_URL=postgresql://msm_user:STRONG_PASSWORD@db.example.com:5432/msm_production?sslmode=require

# Security (generate unique secret!)
JWT_SECRET=YOUR_64_CHARACTER_MINIMUM_RANDOM_SECRET_HERE_GENERATE_WITH_OPENSSL

# CORS (your frontend domain)
CORS_ORIGIN=https://app.msm.com
```

### Docker Compose (.env)

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=msm_car_booking

# Backend
NODE_ENV=development
JWT_SECRET=dev-secret-key-not-for-production
CORS_ORIGIN=http://localhost:3000

# Ports
BACKEND_PORT=3001
POSTGRES_PORT=5432
```

---

## Validation

### Startup Checks

The application validates critical environment variables at startup:

```
✓ JWT_SECRET configured (production mode)
✓ Database connection established
✓ CORS origin set to: https://app.msm.com
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `JWT_SECRET environment variable must be set in production` | Missing JWT_SECRET in production | Set JWT_SECRET env var |
| `Unable to connect to database` | Invalid DATABASE_URL or DB_* vars | Check database credentials |
| `CORS blocked` | CORS_ORIGIN doesn't match request | Update CORS_ORIGIN |

---

## Security Best Practices

1. **Never commit `.env` files to git**
   ```gitignore
   # .gitignore
   .env
   .env.*
   !.env.example
   ```

2. **Use different secrets per environment**
   - Development, staging, and production should have unique JWT_SECRET values

3. **Rotate secrets regularly**
   - Change JWT_SECRET periodically in production
   - Existing tokens will be invalidated

4. **Use secret management in production**
   - Consider AWS Secrets Manager, HashiCorp Vault, or similar
   - Don't store secrets in plain text on servers

5. **Validate environment on deployment**
   ```bash
   # Check required variables before starting
   if [ -z "$JWT_SECRET" ] && [ "$NODE_ENV" = "production" ]; then
     echo "ERROR: JWT_SECRET is required in production"
     exit 1
   fi
   ```

---

## Related Documentation

- [Backend Security](../backend/security)
- [Deployment Guide](./06-deployment)
- [VPS Deployment Guide](./08-vps-deployment-guide)
- [Docker Compose](./02-docker-compose)
