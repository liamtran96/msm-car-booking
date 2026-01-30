---
id: 06-deployment
title: Deployment
sidebar_position: 7
---

# Deployment Strategies

**Difficulty:** Advanced
**Time to Learn:** 2-3 hours
**Prerequisites:** [01-docker.md](./01-docker.md), [05-cicd-jenkins.md](./05-cicd-jenkins.md)

---

## What is Deployment?

Deployment is the process of making your application available to users. A good deployment strategy minimizes downtime and risk.

### Deployment Goals

| Goal | Description |
|------|-------------|
| **Zero Downtime** | Users never see errors during deploy |
| **Fast Rollback** | Quickly revert if something breaks |
| **Gradual Rollout** | Test with small traffic before full deploy |
| **Consistency** | Same process every time |

---

## Deployment Strategies Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Deployment Strategies                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Recreate        Simple, but has downtime                   │
│  ████████ → ░░░░░░░░ → ████████                             │
│  v1 stops    downtime   v2 starts                           │
│                                                              │
│  Rolling         Zero downtime, gradual                      │
│  ████████ → ██████░░ → ████░░░░ → ░░░░████ → ████████       │
│  v1          v1+v2      v1+v2      v1+v2      v2             │
│                                                              │
│  Blue-Green      Instant switch, easy rollback              │
│  ████████ (blue) ───────────────────────┐                   │
│          ░░░░░░░░ (green, standby) ─────┤ switch            │
│                                         ▼                    │
│          ████████ (green, active)                           │
│                                                              │
│  Canary          Risk reduction, gradual                    │
│  ████████ v1 (90%) ─────────────────────┐                   │
│  ░░ v2 (10%) ───────────────────────────┤ gradually         │
│  ░░░░░░░░ v2 (100%)                     ▼ increase          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Recreate Deployment

Stop old version, start new version. Simple but causes downtime.

### When to Use
- Development/staging environments
- Stateful applications that can't run multiple versions
- Scheduled maintenance windows

### Implementation

```bash
# Stop current version
docker compose down

# Pull new version
docker compose pull

# Start new version
docker compose up -d
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Simple | Downtime |
| No version conflicts | All-or-nothing |
| Clear state | No gradual rollout |

---

## 2. Rolling Deployment

Replace instances one at a time. Zero downtime but takes longer.

### When to Use
- Production environments
- Stateless applications
- When you can run mixed versions temporarily

### Implementation with Docker Compose

```yaml
# docker-compose.yml
services:
  api:
    image: xtms-saas-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1        # Update one at a time
        delay: 10s            # Wait between updates
        failure_action: rollback
        order: start-first    # Start new before stopping old
```

```bash
# Rolling update
docker compose up -d --no-deps api
```

### Implementation with Script

```bash
#!/bin/bash
# rolling-deploy.sh

REPLICAS=(api-1 api-2 api-3)

for replica in "${REPLICAS[@]}"; do
    echo "Updating $replica..."

    # Stop old instance
    docker stop $replica

    # Remove old instance
    docker rm $replica

    # Start new instance
    docker run -d --name $replica \
        --network xtms \
        xtms-saas-api:new

    # Wait for health check
    until docker exec $replica curl -f http://localhost:3333/health; do
        sleep 2
    done

    echo "$replica updated and healthy"
    sleep 10  # Wait before next update
done
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Zero downtime | Slower deployment |
| Gradual rollout | Mixed versions temporarily |
| Automatic rollback | More complex |

---

## 3. Blue-Green Deployment

Run two identical environments. Switch traffic instantly.

### When to Use
- Critical production systems
- When you need instant rollback
- Database migrations (with care)

### Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │     (Nginx)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │   Blue (v1.0)   │           │  Green (v1.1)   │
    │   Port 3333     │           │   Port 3334     │
    │   [ACTIVE]      │           │   [STANDBY]     │
    └─────────────────┘           └─────────────────┘
```

### Implementation

```yaml
# docker-compose.blue-green.yml
version: '3.8'

services:
  api-blue:
    image: xtms-saas-api:${BLUE_VERSION:-latest}
    container_name: api-blue
    ports:
      - "3333:3333"
    networks:
      - xtms

  api-green:
    image: xtms-saas-api:${GREEN_VERSION:-latest}
    container_name: api-green
    ports:
      - "3334:3333"
    networks:
      - xtms

networks:
  xtms:
```

```nginx
# nginx.conf - Switch by changing upstream
upstream api {
    # Active environment (switch this line)
    server 127.0.0.1:3333;    # Blue
    # server 127.0.0.1:3334;  # Green
}

server {
    listen 80;
    location /api {
        proxy_pass http://api;
    }
}
```

### Deployment Script

```bash
#!/bin/bash
# blue-green-deploy.sh

NEW_VERSION=$1
CURRENT=$(docker ps --filter "name=api-blue" --format "{{.Names}}" | grep -q "blue" && echo "blue" || echo "green")
NEW=$([ "$CURRENT" == "blue" ] && echo "green" || echo "blue")

echo "Current: $CURRENT, Deploying to: $NEW"

# Deploy to inactive environment
if [ "$NEW" == "green" ]; then
    export GREEN_VERSION=$NEW_VERSION
else
    export BLUE_VERSION=$NEW_VERSION
fi

docker compose -f docker-compose.blue-green.yml up -d api-$NEW

# Wait for health
echo "Waiting for $NEW to be healthy..."
until curl -f http://localhost:$([ "$NEW" == "blue" ] && echo "3333" || echo "3334")/health; do
    sleep 2
done

# Switch traffic in Nginx
echo "Switching traffic to $NEW..."
sed -i "s/server 127.0.0.1:$([ "$NEW" == "blue" ] && echo "3334" || echo "3333");/# &/" /etc/nginx/nginx.conf
sed -i "s/# server 127.0.0.1:$([ "$NEW" == "blue" ] && echo "3333" || echo "3334");/server 127.0.0.1:$([ "$NEW" == "blue" ] && echo "3333" || echo "3334");/" /etc/nginx/nginx.conf
nginx -s reload

echo "Deployment complete! Rollback with: $0 rollback"
```

### Rollback

```bash
# Instant rollback - just switch Nginx back
sed -i 's/server 127.0.0.1:3334;/# server 127.0.0.1:3334;/' /etc/nginx/nginx.conf
sed -i 's/# server 127.0.0.1:3333;/server 127.0.0.1:3333;/' /etc/nginx/nginx.conf
nginx -s reload
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Instant switch | Double resources |
| Instant rollback | Database schema challenges |
| Full testing before switch | More infrastructure cost |

---

## 4. Canary Deployment

Route small percentage of traffic to new version. Gradually increase.

### When to Use
- High-risk changes
- A/B testing
- Gradual feature rollouts

### Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │     (Nginx)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼ (90%)                       ▼ (10%)
    ┌─────────────────┐           ┌─────────────────┐
    │  Stable (v1.0)  │           │  Canary (v1.1)  │
    │   weight=9      │           │   weight=1      │
    └─────────────────┘           └─────────────────┘
```

### Implementation with Nginx

```nginx
# nginx.conf
upstream api {
    # Stable version (90%)
    server 127.0.0.1:3333 weight=9;

    # Canary version (10%)
    server 127.0.0.1:3334 weight=1;
}

server {
    listen 80;
    location /api {
        proxy_pass http://api;
    }
}
```

### Canary Deployment Script

```bash
#!/bin/bash
# canary-deploy.sh

NEW_VERSION=$1
CANARY_PERCENT=${2:-10}  # Default 10%

echo "Deploying canary with ${CANARY_PERCENT}% traffic"

# Deploy canary
docker run -d --name api-canary \
    -p 3334:3333 \
    xtms-saas-api:$NEW_VERSION

# Wait for health
until curl -f http://localhost:3334/health; do sleep 2; done

# Calculate weights
STABLE_WEIGHT=$((100 - CANARY_PERCENT))
CANARY_WEIGHT=$CANARY_PERCENT

# Update Nginx
cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream api {
    server 127.0.0.1:3333 weight=${STABLE_WEIGHT};
    server 127.0.0.1:3334 weight=${CANARY_WEIGHT};
}
EOF

nginx -s reload
echo "Canary deployed with ${CANARY_PERCENT}% traffic"
```

### Promote Canary

```bash
#!/bin/bash
# promote-canary.sh

PERCENT=${1:-25}

echo "Increasing canary to ${PERCENT}%"

STABLE_WEIGHT=$((100 - PERCENT))

cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream api {
    server 127.0.0.1:3333 weight=${STABLE_WEIGHT};
    server 127.0.0.1:3334 weight=${PERCENT};
}
EOF

nginx -s reload

# If 100%, replace stable with canary
if [ "$PERCENT" -eq 100 ]; then
    echo "Canary is now stable. Removing old version..."
    docker stop api-stable
    docker rm api-stable
    docker rename api-canary api-stable
fi
```

### Rollback Canary

```bash
#!/bin/bash
# rollback-canary.sh

echo "Rolling back canary..."

# Remove canary from rotation
cat > /etc/nginx/conf.d/upstream.conf << EOF
upstream api {
    server 127.0.0.1:3333;
}
EOF

nginx -s reload

# Stop canary
docker stop api-canary
docker rm api-canary

echo "Rollback complete"
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Low risk | More complex monitoring |
| Real user testing | Slower full rollout |
| Gradual rollout | Session affinity issues |

---

## Deployment Checklist

### Before Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Monitoring in place
- [ ] Team notified

### During Deployment

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Watch logs for errors
- [ ] Verify key features work

### After Deployment

- [ ] Smoke test critical paths
- [ ] Monitor for 15-30 minutes
- [ ] Update deployment log
- [ ] Notify team of completion

---

## Database Migrations

### The Challenge

Database schema changes must be compatible with both old and new code during deployment.

### Strategy: Expand and Contract

```
Phase 1: Add new column (nullable)
Phase 2: Deploy code that writes to both
Phase 3: Backfill data
Phase 4: Deploy code that reads from new
Phase 5: Remove old column
```

### Example: Rename Column

```sql
-- Wrong: Breaks old code instantly
ALTER TABLE users RENAME COLUMN name TO full_name;

-- Right: Gradual migration
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Step 2: Copy data
UPDATE users SET full_name = name;

-- Step 3: Deploy code that uses full_name

-- Step 4: Remove old column (after all code updated)
ALTER TABLE users DROP COLUMN name;
```

---

## Rollback Strategies

### Docker Tag Rollback

```bash
# Current version
docker compose up -d

# Rollback to previous version
export IMAGE_TAG=v1.0.0
docker compose up -d
```

### Git-based Rollback

```bash
# Revert to last known good commit
git revert HEAD

# Trigger new build/deploy
git push
```

### Database Rollback

Always have backward-compatible migrations:

```bash
# Apply migration
npm run migrate:up

# Rollback migration
npm run migrate:down
```

---

## VPS Deployment Script

Complete deployment script for VPS:

```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

# Configuration
APP_NAME="xtms"
DOCKER_REGISTRY="registry.gitlab.com/your-org"
DEPLOY_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups/$APP_NAME"

# Arguments
VERSION=${1:-latest}
ENVIRONMENT=${2:-staging}

echo "Deploying $APP_NAME:$VERSION to $ENVIRONMENT"

# Create backup
echo "Creating backup..."
mkdir -p $BACKUP_DIR
docker compose -f $DEPLOY_DIR/docker-compose.yml exec -T postgres pg_dump -U postgres > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql

# Pull new images
echo "Pulling new images..."
docker pull $DOCKER_REGISTRY/api:$VERSION
docker pull $DOCKER_REGISTRY/web:$VERSION

# Update docker-compose with new version
cd $DEPLOY_DIR
sed -i "s|image: $DOCKER_REGISTRY/api:.*|image: $DOCKER_REGISTRY/api:$VERSION|" docker-compose.yml
sed -i "s|image: $DOCKER_REGISTRY/web:.*|image: $DOCKER_REGISTRY/web:$VERSION|" docker-compose.yml

# Run migrations
echo "Running migrations..."
docker compose run --rm api npm run migrate

# Rolling update
echo "Updating services..."
docker compose up -d --no-deps api
sleep 10
docker compose up -d --no-deps web

# Health check
echo "Checking health..."
for i in {1..30}; do
    if curl -sf http://localhost:3333/health > /dev/null; then
        echo "Deployment successful!"
        exit 0
    fi
    echo "Waiting for health check... ($i/30)"
    sleep 2
done

echo "Health check failed! Rolling back..."
docker compose down
git checkout docker-compose.yml
docker compose up -d
exit 1
```

---

## Summary

| Strategy | Downtime | Rollback | Risk | Complexity |
|----------|----------|----------|------|------------|
| Recreate | Yes | Manual | High | Low |
| Rolling | No | Slow | Medium | Medium |
| Blue-Green | No | Instant | Low | High |
| Canary | No | Fast | Low | High |

### When to Use What

```
Development/Staging → Recreate
Small apps → Rolling
Critical systems → Blue-Green
High-risk changes → Canary
```

---

**Next:** Learn [Monitoring & Logging](./07-monitoring.md) to keep your deployment healthy.
