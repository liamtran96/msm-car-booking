---
id: 07-monitoring
title: Monitoring
sidebar_position: 8
---

# Monitoring & Logging

**Difficulty:** Intermediate
**Time to Learn:** 2 hours
**Prerequisites:** [01-docker.md](./01-docker.md), [02-docker-compose.md](./02-docker-compose.md)

---

## Why Monitoring?

Monitoring helps you:
- Detect problems before users report them
- Understand application performance
- Debug issues quickly
- Make data-driven decisions

### The Three Pillars of Observability

```
┌─────────────────────────────────────────────────────────────┐
│                     Observability                            │
├───────────────────┬───────────────────┬─────────────────────┤
│      Logs         │     Metrics       │      Traces         │
│                   │                   │                     │
│  What happened?   │  How much?        │  Where is the       │
│  Error details    │  How fast?        │  slowness?          │
│  Debug info       │  How many?        │  Request flow       │
│                   │                   │                     │
│  "Error: null     │  "95th percentile │  "Request spent     │
│   pointer at      │   latency: 120ms" │   400ms in DB,      │
│   user.getName()" │                   │   50ms in API"      │
└───────────────────┴───────────────────┴─────────────────────┘
```

---

## Logging

### Docker Container Logs

```bash
# View logs
docker logs container_name

# Follow logs in real-time
docker logs -f container_name

# Last 100 lines
docker logs --tail 100 container_name

# Since specific time
docker logs --since 1h container_name
docker logs --since 2024-01-20T10:00:00 container_name

# With timestamps
docker logs -t container_name
```

### Docker Compose Logs

```bash
# All services
docker compose logs

# Follow all
docker compose logs -f

# Specific service
docker compose logs -f api

# Multiple services
docker compose logs -f api web

# Last 50 lines per service
docker compose logs --tail 50
```

### Log Drivers

Configure how Docker handles logs:

```yaml
# docker-compose.yml
services:
  api:
    logging:
      driver: json-file
      options:
        max-size: "10m"    # Max file size
        max-file: "3"      # Keep 3 files
```

Available drivers:

| Driver | Description |
|--------|-------------|
| `json-file` | Default, JSON format |
| `syslog` | System syslog |
| `journald` | systemd journal |
| `fluentd` | Fluentd collector |
| `awslogs` | AWS CloudWatch |

### Application Logging Best Practices

```typescript
// Good logging
logger.info('User login successful', { userId: user.id, ip: request.ip });
logger.error('Payment failed', { orderId, error: error.message, stack: error.stack });

// Bad logging
console.log('User logged in');  // No context
logger.info(`User ${user.email} logged in`);  // PII in logs!
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `error` | Something failed, needs attention |
| `warn` | Potential problem, degraded service |
| `info` | Normal operations, key events |
| `debug` | Detailed info for debugging |

---

## Health Checks

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/health || exit 1
```

| Option | Description |
|--------|-------------|
| `--interval` | Time between checks |
| `--timeout` | Max time for check to complete |
| `--start-period` | Startup grace period |
| `--retries` | Failures before unhealthy |

### Check Health Status

```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health info
docker inspect --format='{{json .State.Health}}' container_name | jq
```

### API Health Endpoints

Implement health endpoints in your API:

```typescript
// Simple liveness check
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Readiness check (includes dependencies)
app.get('/health/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({
      status: 'ok',
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message
    });
  }
});
```

---

## Resource Monitoring

### Docker Stats

```bash
# Real-time stats for all containers
docker stats

# Specific container
docker stats container_name

# No streaming (snapshot)
docker stats --no-stream

# Custom format
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

Output columns:
| Column | Description |
|--------|-------------|
| CPU % | CPU usage |
| MEM USAGE/LIMIT | Memory used / limit |
| NET I/O | Network in/out |
| BLOCK I/O | Disk read/write |

### System Resources

```bash
# Disk usage by Docker
docker system df

# Detailed
docker system df -v

# Clean unused resources
docker system prune
```

### Container Resource Limits

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'      # 50% of one CPU
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Nginx Monitoring

### Access Logs

```nginx
# Custom log format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log main;
```

### Useful Log Analysis

```bash
# Top 10 IPs
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# Top 10 URLs
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -10

# 5xx errors
grep '" 5[0-9][0-9] ' access.log | tail -20

# Slow requests (>1s)
awk '$NF > 1' access.log | tail -20

# Requests per second
awk '{print $4}' access.log | cut -d: -f1-3 | uniq -c
```

### Status Page

```nginx
# Enable stub_status
location /nginx_status {
    stub_status on;
    allow 127.0.0.1;
    deny all;
}
```

```bash
curl http://localhost/nginx_status
# Active connections: 1
# server accepts handled requests
#  100 100 500
# Reading: 0 Writing: 1 Waiting: 0
```

---

## Database Monitoring

### PostgreSQL

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Connection by state
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Index usage
SELECT relname, idx_scan, seq_scan
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 10;
```

### Redis

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Memory usage
INFO memory

# Key statistics
INFO keyspace

# Slow log
SLOWLOG GET 10

# Monitor commands in real-time
MONITOR
```

---

## Quick Monitoring Setup

### Simple Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Basic monitoring script

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo -e "\n=== Disk Usage ==="
docker system df

echo -e "\n=== Health Checks ==="
for container in $(docker ps --format "{{.Names}}"); do
    health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no healthcheck")
    echo "$container: $health"
done

echo -e "\n=== Recent Errors (last 5 minutes) ==="
docker compose logs --since 5m 2>&1 | grep -i error | tail -10
```

### Cron-based Monitoring

```bash
# Add to crontab
# Check every 5 minutes
*/5 * * * * /opt/scripts/health-check.sh

# Daily report
0 9 * * * /opt/scripts/daily-report.sh
```

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:3333/health"
WEBHOOK_URL="https://hooks.slack.com/services/xxx"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$response" != "200" ]; then
    message="API health check failed! Status: $response"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        $WEBHOOK_URL
fi
```

---

## Debugging Tips

### Container Not Starting

```bash
# Check logs
docker logs container_name

# Run interactively
docker run -it image_name /bin/sh

# Check exit code
docker inspect container_name --format='{{.State.ExitCode}}'

# Check last 20 events
docker events --since 1h --filter container=container_name
```

### Slow Performance

```bash
# Check CPU/memory
docker stats container_name

# Check disk I/O
docker exec container_name iostat

# Check network
docker exec container_name netstat -an

# Profile inside container
docker exec container_name top
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect network_name

# Test connectivity
docker exec container_a ping container_b

# Check DNS
docker exec container_name nslookup other_container
```

### Database Connection Issues

```bash
# Test from container
docker exec api_container pg_isready -h postgres -U postgres

# Check connections
docker exec db_container psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check logs
docker logs db_container --tail 50
```

---

## Log Aggregation (Optional)

For production, consider centralized logging:

### Loki + Grafana (Lightweight)

```yaml
# docker-compose.monitoring.yml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro

volumes:
  loki_data:
  grafana_data:
```

---

## Summary

### Key Commands

```bash
# Container logs
docker logs -f container_name
docker compose logs -f service_name

# Resource usage
docker stats

# Health check
docker inspect --format='{{.State.Health.Status}}' container_name

# System overview
docker system df
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health/live` | Is the app running? |
| `/health/ready` | Is the app ready to accept traffic? |

### Monitoring Checklist

- [ ] Container health checks configured
- [ ] Log rotation enabled
- [ ] Resource limits set
- [ ] Health endpoints implemented
- [ ] Alerting set up

---

**Next:** Check the [Cheatsheet](./cheatsheet.md) for quick reference of all commands.
