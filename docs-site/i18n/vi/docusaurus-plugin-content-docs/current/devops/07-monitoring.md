---
id: 07-monitoring
title: Giám sát
sidebar_position: 8
---

# Monitoring & Logging

**Độ khó:** Trung bình
**Thời gian học:** 2 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md), [02-docker-compose.md](./02-docker-compose.md)

---

## Tại sao cần Monitoring?

Monitoring giúp bạn:
- Phát hiện vấn đề trước khi người dùng báo cáo
- Hiểu hiệu năng ứng dụng
- Debug issues nhanh chóng
- Đưa ra quyết định dựa trên dữ liệu

### Ba trụ cột của Observability

```
┌─────────────────────────────────────────────────────────────┐
│                     Observability                            │
├───────────────────┬───────────────────┬─────────────────────┤
│      Logs         │     Metrics       │      Traces         │
│                   │                   │                     │
│  Điều gì xảy ra?  │  Bao nhiêu?       │  Chỗ nào chậm?      │
│  Chi tiết lỗi     │  Nhanh như thế    │  Luồng request      │
│  Debug info       │  nào? Bao nhiêu?  │                     │
└───────────────────┴───────────────────┴─────────────────────┘
```

---

## Logging

### Docker Container Logs

```bash
# Xem logs
docker logs container_name

# Theo dõi logs thời gian thực
docker logs -f container_name

# 100 dòng cuối
docker logs --tail 100 container_name

# Từ thời điểm cụ thể
docker logs --since 1h container_name

# Với timestamps
docker logs -t container_name
```

### Docker Compose Logs

```bash
# Tất cả services
docker compose logs

# Theo dõi tất cả
docker compose logs -f

# Service cụ thể
docker compose logs -f api

# Nhiều services
docker compose logs -f api web

# 50 dòng cuối mỗi service
docker compose logs --tail 50
```

### Log Drivers

Cấu hình cách Docker xử lý logs:

```yaml
# docker-compose.yml
services:
  api:
    logging:
      driver: json-file
      options:
        max-size: "10m"    # Kích thước file tối đa
        max-file: "3"      # Giữ 3 files
```

Các drivers có sẵn:

| Driver | Mô tả |
|--------|-------------|
| `json-file` | Mặc định, định dạng JSON |
| `syslog` | System syslog |
| `journald` | systemd journal |
| `fluentd` | Fluentd collector |
| `awslogs` | AWS CloudWatch |

### Log Levels

| Level | Khi nào sử dụng |
|-------|-------------|
| `error` | Có gì đó thất bại, cần chú ý |
| `warn` | Vấn đề tiềm ẩn, service bị giảm |
| `info` | Hoạt động bình thường, sự kiện quan trọng |
| `debug` | Thông tin chi tiết để debugging |

---

## Health Checks

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/health || exit 1
```

| Option | Mô tả |
|--------|-------------|
| `--interval` | Thời gian giữa các lần kiểm tra |
| `--timeout` | Thời gian tối đa cho kiểm tra hoàn thành |
| `--start-period` | Thời gian grace khi khởi động |
| `--retries` | Số lần thất bại trước khi unhealthy |

### Kiểm tra Health Status

```bash
# Xem health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Thông tin health chi tiết
docker inspect --format='{{json .State.Health}}' container_name | jq
```

### API Health Endpoints

Implement health endpoints trong API của bạn:

```typescript
// Kiểm tra liveness đơn giản
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Kiểm tra readiness (bao gồm dependencies)
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
# Stats thời gian thực cho tất cả containers
docker stats

# Container cụ thể
docker stats container_name

# Không streaming (snapshot)
docker stats --no-stream

# Format tùy chỉnh
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

Các cột output:
| Cột | Mô tả |
|--------|-------------|
| CPU % | Sử dụng CPU |
| MEM USAGE/LIMIT | Memory sử dụng / giới hạn |
| NET I/O | Network in/out |
| BLOCK I/O | Disk read/write |

### Container Resource Limits

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'      # 50% của một CPU
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

---

## Database Monitoring

### PostgreSQL

```sql
-- Connections đang hoạt động
SELECT count(*) FROM pg_stat_activity;

-- Connection theo state
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Queries chậm
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '5 seconds';

-- Kích thước tables
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

### Redis

```bash
# Kết nối đến Redis
docker compose exec redis redis-cli

# Sử dụng memory
INFO memory

# Thống kê key
INFO keyspace

# Slow log
SLOWLOG GET 10

# Giám sát commands thời gian thực
MONITOR
```

---

## Debugging Tips

### Container không khởi động

```bash
# Kiểm tra logs
docker logs container_name

# Chạy tương tác
docker run -it image_name /bin/sh

# Kiểm tra exit code
docker inspect container_name --format='{{.State.ExitCode}}'
```

### Hiệu năng chậm

```bash
# Kiểm tra CPU/memory
docker stats container_name

# Profile bên trong container
docker exec container_name top
```

### Vấn đề Network

```bash
# Kiểm tra network
docker network ls
docker network inspect network_name

# Test connectivity
docker exec container_a ping container_b
```

---

## Tổng kết

### Các lệnh chính

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

| Endpoint | Mục đích |
|----------|---------|
| `/health/live` | Ứng dụng có đang chạy không? |
| `/health/ready` | Ứng dụng có sẵn sàng nhận traffic không? |

### Monitoring Checklist

- [ ] Đã cấu hình container health checks
- [ ] Đã bật log rotation
- [ ] Đã đặt resource limits
- [ ] Đã implement health endpoints
- [ ] Đã thiết lập alerting

---

**Tiếp theo:** Xem [Cheatsheet](./cheatsheet.md) để tham khảo nhanh tất cả các lệnh.
