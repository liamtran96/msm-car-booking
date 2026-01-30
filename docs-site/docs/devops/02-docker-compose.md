---
id: 02-docker-compose
title: Docker Compose
sidebar_position: 3
---

# Docker Compose - Multi-Container Applications

**Difficulty:** Beginner
**Time to Learn:** 1-2 hours
**Prerequisites:** [01-docker.md](./01-docker.md)

---

## What is Docker Compose?

Docker Compose is a tool for defining and running **multi-container** Docker applications. Instead of running multiple `docker run` commands, you define everything in one YAML file.

### The Problem It Solves

**Without Docker Compose:**
```bash
# Start database
docker run -d --name db \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  --network mynet \
  postgres:15-alpine

# Start Redis
docker run -d --name redis \
  --network mynet \
  redis:7-alpine

# Start API
docker run -d --name api \
  -e DATABASE_URL=postgres://... \
  -p 3333:3333 \
  --network mynet \
  myapi:latest

# Start Web
docker run -d --name web \
  -p 8080:80 \
  --network mynet \
  myweb:latest
```

**With Docker Compose:**
```bash
docker compose up -d
```

One command starts everything!

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Service** | A container configuration (image, ports, volumes, etc.) |
| **Network** | Virtual network connecting services |
| **Volume** | Named persistent storage |
| **Project** | All services defined in a compose file |

---

## Installing Docker Compose

Docker Compose is included with Docker Desktop (macOS/Windows).

For Linux:
```bash
# Already installed with docker-ce-cli
docker compose version

# If not installed
sudo apt install docker-compose-plugin
```

💡 **Note:** Use `docker compose` (with space) not `docker-compose` (with hyphen). The hyphen version is legacy.

---

## Your First docker-compose.yml

### 🔧 Exercise 1: Simple Web Server

Create a file named `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

Run it:
```bash
# Start services
docker compose up -d

# View running services
docker compose ps

# Open in browser
open http://localhost:8080

# Stop services
docker compose down
```

---

## Understanding docker-compose.yml

Let's break down each section of our project's compose file:

### Basic Structure

```yaml
version: '3.8'       # Compose file format version

services:            # Container definitions
  service1:
    ...
  service2:
    ...

volumes:             # Named volumes
  volume1:
  volume2:

networks:            # Custom networks
  network1:
```

### Service Configuration

```yaml
services:
  api:
    # === IMAGE ===
    image: myapp:latest              # Use existing image
    # OR
    build:                           # Build from Dockerfile
      context: ./api                 # Build context path
      dockerfile: Dockerfile         # Dockerfile location

    # === CONTAINER NAME ===
    container_name: myapp-api        # Custom container name

    # === PORTS ===
    ports:
      - "3333:3333"                  # host:container
      - "3000-3005:3000-3005"        # Port range

    # === ENVIRONMENT ===
    environment:                     # Inline variables
      NODE_ENV: production
      DB_HOST: postgres
    # OR
    env_file:                        # From file
      - .env
      - .env.local

    # === VOLUMES ===
    volumes:
      - ./src:/app/src               # Bind mount (development)
      - node_modules:/app/node_modules  # Named volume
      - /app/temp                    # Anonymous volume

    # === NETWORKING ===
    networks:
      - frontend
      - backend

    # === DEPENDENCIES ===
    depends_on:                      # Start order
      - postgres
      - redis
    # OR with health check
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

    # === RESTART POLICY ===
    restart: unless-stopped          # Restart on failure

    # === HEALTH CHECK ===
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # === RESOURCE LIMITS ===
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

    # === CUSTOM COMMAND ===
    command: npm run start:prod      # Override CMD

    # === WORKING DIRECTORY ===
    working_dir: /app

    # === USER ===
    user: "1000:1000"                # Run as specific user

    # === LOGGING ===
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Our Project's docker-compose.yml Explained

```yaml
version: '3.8'

services:
  # ===== DATABASE =====
  postgres:
    image: postgres:15-alpine
    container_name: xtms-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-xtms}      # Use env var or default
      POSTGRES_USER: ${DB_USER:-xtms}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-xtms_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist database
    ports:
      - "5432:5432"                             # Expose for local tools
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-xtms}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - xtms-network

  # ===== CACHE =====
  redis:
    image: redis:7-alpine
    container_name: xtms-redis
    command: redis-server --appendonly yes     # Enable persistence
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - xtms-network

  # ===== API =====
  api:
    image: xtms-saas-api:latest
    container_name: xtms-saas-api
    ports:
      - "3333:3333"
    environment:
      NODE_ENV: production
      PORT: 3333
      DB_HOST: postgres                        # Use service name as hostname
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-xtms}
      DB_USER: ${DB_USER:-xtms}
      DB_PASSWORD: ${DB_PASSWORD:-xtms_dev_password}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET:-dev_jwt_secret}
    depends_on:
      postgres:
        condition: service_healthy             # Wait for DB to be ready
      redis:
        condition: service_healthy
    networks:
      - xtms-network

  # ===== WEB FRONTEND =====
  web:
    image: xtms-web:latest
    container_name: xtms-web
    ports:
      - "8080:80"
    depends_on:
      - api                                    # API must start first
    networks:
      - xtms-network

# ===== PERSISTENT STORAGE =====
volumes:
  postgres_data:     # Database files
  redis_data:        # Redis AOF files

# ===== NETWORKING =====
networks:
  xtms-network:
    driver: bridge   # Default network driver
```

### How Services Communicate

```
┌─────────────────────────────────────────────────────────────┐
│                   xtms-network                         │
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │   web   │───▶│   api   │───▶│postgres │    │  redis  │  │
│  │ :8080   │    │ :3333   │    │ :5432   │    │ :6379   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                      │              ▲              ▲        │
│                      └──────────────┴──────────────┘        │
│                        (connects by service name)           │
└─────────────────────────────────────────────────────────────┘
```

Inside the network, services reach each other by **name**:
- API connects to `postgres:5432` (not `localhost:5432`)
- API connects to `redis:6379`
- Web proxies to `api:3333`

---

## Docker Compose Commands

### Starting Services

```bash
# Start all services in foreground
docker compose up

# Start in background (detached)
docker compose up -d

# Start specific service(s)
docker compose up -d postgres redis

# Recreate containers (even if unchanged)
docker compose up -d --force-recreate

# Rebuild images before starting
docker compose up -d --build
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data!)
docker compose down -v

# Stop and remove everything including images
docker compose down --rmi all -v

# Stop specific service
docker compose stop api

# Remove stopped containers
docker compose rm
```

### Viewing Status

```bash
# List running services
docker compose ps

# List all services (including stopped)
docker compose ps -a

# View logs
docker compose logs

# Follow logs
docker compose logs -f

# Logs for specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail 100 api
```

### Managing Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart api

# Scale service (multiple instances)
docker compose up -d --scale api=3

# Execute command in service
docker compose exec api bash

# Run one-off command
docker compose run --rm api npm test
```

### Building Images

```bash
# Build all images
docker compose build

# Build specific service
docker compose build api

# Build without cache
docker compose build --no-cache

# Pull latest images
docker compose pull
```

---

## Environment Variables

### Using .env File

Create `.env` in the same directory as `docker-compose.yml`:

```bash
# .env
DB_NAME=xtms
DB_USER=xtms
DB_PASSWORD=super_secret_password
JWT_SECRET=my_jwt_secret
NODE_ENV=production
```

Variables are automatically loaded and available as `${VARIABLE}`:

```yaml
services:
  api:
    environment:
      DB_PASSWORD: ${DB_PASSWORD}
```

### Default Values

```yaml
# Use default if variable not set
DB_NAME: ${DB_NAME:-xtms}

# Error if variable not set
DB_PASSWORD: ${DB_PASSWORD:?Database password required}
```

### Multiple Environment Files

```yaml
services:
  api:
    env_file:
      - .env           # Base config
      - .env.local     # Local overrides (git-ignored)
```

### 💡 Security Tip

Never commit secrets to git! Use `.env.example` as a template:

```bash
# .env.example (committed to git)
DB_PASSWORD=change_me
JWT_SECRET=change_me

# .env (git-ignored, actual values)
DB_PASSWORD=super_secret_123
JWT_SECRET=real_secret_456
```

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## Development vs Production

### Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    build:
      context: ./xtms-saas-api
      dockerfile: docker/Dockerfile.dev
    volumes:
      - ./xtms-saas-api/src:/app/src        # Hot reload
      - /app/node_modules                    # Don't override node_modules
    environment:
      NODE_ENV: development
    command: pnpm run start:dev

  web:
    build: ./xtms-web
    volumes:
      - ./xtms-web/src:/app/src
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: pnpm run dev
    ports:
      - "5173:5173"                          # Vite dev server
```

Run development:
```bash
docker compose -f docker-compose.dev.yml up
```

### Production Setup

```yaml
# docker-compose.yml (production)
version: '3.8'

services:
  api:
    image: registry.com/xtms-saas-api:v1.0.0  # Pre-built image
    restart: unless-stopped
    environment:
      NODE_ENV: production
    # No volumes for source code

  web:
    image: registry.com/xtms-web:v1.0.0
    restart: unless-stopped
```

### Using Multiple Compose Files

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up

# Or set default
export COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml
docker compose up
```

---

## 🔧 Hands-On Exercises

### Exercise 2: Build and Run xTMS

```bash
# 1. Build images
cd xtms-saas-api
docker build -f docker/Dockerfile -t xtms-saas-api:latest .

cd ../xtms-web
docker build -t xtms-web:latest .

# 2. Start all services
cd ..
docker compose up -d

# 3. Check status
docker compose ps

# 4. View logs
docker compose logs -f api

# 5. Open in browser
open http://localhost:8080

# 6. Connect to database
docker compose exec postgres psql -U xtms

# 7. Stop everything
docker compose down
```

### Exercise 3: Development with Hot Reload

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./xtms-saas-api
      dockerfile: docker/Dockerfile.dev
    volumes:
      - ./xtms-saas-api:/app
      - /app/node_modules
    ports:
      - "3333:3333"
      - "9229:9229"    # Debug port
    command: pnpm run start:debug
    environment:
      NODE_ENV: development

  web:
    build: ./xtms-web
    volumes:
      - ./xtms-web:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    command: pnpm run dev
```

Run:
```bash
docker compose -f docker-compose.dev.yml up
```

Now when you edit files, changes reflect immediately!

---

## Health Checks and Dependencies

### Why Health Checks Matter

Without health checks, `depends_on` only waits for container to **start**, not for the application to be **ready**.

```yaml
# ❌ Bad - API might start before DB is ready
services:
  api:
    depends_on:
      - postgres

# ✅ Good - API waits for DB to be healthy
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    depends_on:
      postgres:
        condition: service_healthy
```

### Health Check Options

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3333/health"]
  interval: 30s       # Check every 30 seconds
  timeout: 10s        # Wait 10 seconds for response
  retries: 3          # Fail after 3 failed checks
  start_period: 40s   # Grace period after start
```

### Check Health Status

```bash
# View health status
docker compose ps

# Detailed health info
docker inspect xtms-saas-api --format='{{.State.Health.Status}}'
```

---

## Networking Deep Dive

### Default Network

Docker Compose creates a default network named `{project}_default`:

```bash
docker network ls
# xtms_default
```

### Custom Networks

```yaml
services:
  web:
    networks:
      - frontend

  api:
    networks:
      - frontend
      - backend

  postgres:
    networks:
      - backend

networks:
  frontend:
  backend:
```

This creates isolation:
- `web` can only reach `api`
- `postgres` can only be reached by `api`
- `web` cannot directly access `postgres`

### External Networks

Connect to existing networks:

```yaml
networks:
  existing:
    external: true
    name: my-existing-network
```

---

## Volume Deep Dive

### Named Volumes vs Bind Mounts

```yaml
volumes:
  # Named volume - Docker manages location
  - postgres_data:/var/lib/postgresql/data

  # Bind mount - you specify host path
  - ./src:/app/src

  # Anonymous volume - temporary
  - /app/temp
```

### When to Use Each

| Type | Use Case | Persists? |
|------|----------|-----------|
| Named Volume | Database data, persistent app data | Yes |
| Bind Mount | Development (hot reload), config files | Yes |
| Anonymous Volume | Temp files, cache | No |

### Volume Permissions

```yaml
services:
  api:
    user: "1000:1000"  # Run as specific user
    volumes:
      - ./data:/app/data
```

---

## Best Practices

### 1. Use Specific Image Tags

```yaml
# ❌ Bad
image: postgres:latest

# ✅ Good
image: postgres:15-alpine
```

### 2. Set Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

### 3. Use Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
```

### 4. Don't Store Secrets in Compose File

```yaml
# ❌ Bad
environment:
  DB_PASSWORD: my_secret_password

# ✅ Good
environment:
  DB_PASSWORD: ${DB_PASSWORD}
```

### 5. Use .dockerignore

Exclude unnecessary files from build context.

### 6. Order Services by Dependency

```yaml
services:
  postgres:    # No dependencies
  redis:       # No dependencies
  api:         # Depends on postgres, redis
  web:         # Depends on api
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs api

# Run in foreground to see errors
docker compose up api
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3333

# Use different port in compose file
ports:
  - "3334:3333"
```

### Volume Permission Issues

```bash
# Check ownership inside container
docker compose exec api ls -la /app

# Fix permissions
docker compose exec -u root api chown -R 1000:1000 /app
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect xtms_default

# Recreate network
docker compose down
docker compose up -d
```

### Clean Restart

```bash
# Nuclear option - reset everything
docker compose down -v --rmi all
docker compose up -d --build
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| `docker-compose.yml` | Define multi-container app |
| `services` | Container configurations |
| `volumes` | Persistent storage |
| `networks` | Container communication |
| `depends_on` | Start order |
| `healthcheck` | Readiness monitoring |

### Key Commands

```bash
docker compose up -d       # Start all
docker compose down        # Stop all
docker compose ps          # List services
docker compose logs -f     # Follow logs
docker compose exec api sh # Shell access
docker compose restart     # Restart all
docker compose build       # Rebuild images
```

---

**Next:** Learn [Nginx](./03-nginx.md) to serve your app and handle SSL.
