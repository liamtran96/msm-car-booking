---
id: 09-prometheus-grafana
title: Prometheus & Grafana
sidebar_position: 9
---

# Prometheus & Grafana

**Độ khó:** Trung bình
**Thời gian học:** 3-4 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md), [07-monitoring.md](./07-monitoring.md)

---

## Tổng quan

### Prometheus là gì?

Prometheus là hệ thống monitoring và alerting mã nguồn mở. Nó thu thập và lưu trữ metrics dưới dạng time series data.

### Grafana là gì?

Grafana là nền tảng visualization cho phép bạn query, visualize, và alert trên metrics data.

```
┌──────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                          │
│                                                               │
│  Applications → Prometheus (thu thập) → Grafana (hiển thị)   │
│                        ↓                                      │
│              Alertmanager (cảnh báo)                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Các khái niệm chính

### Prometheus Concepts

| Khái niệm | Mô tả |
|-----------|-------|
| **Metric** | Đo lường được đặt tên (ví dụ: http_requests_total) |
| **Label** | Key-value pairs để lọc metrics |
| **Scrape** | Thu thập metrics từ targets |
| **Target** | Endpoint để scrape metrics |
| **PromQL** | Ngôn ngữ query của Prometheus |

### Metric Types

| Type | Mô tả | Ví dụ |
|------|-------|-------|
| **Counter** | Chỉ tăng | http_requests_total |
| **Gauge** | Có thể tăng/giảm | cpu_usage_percent |
| **Histogram** | Đo phân phối | request_duration_seconds |
| **Summary** | Giống histogram, tính quantile | request_duration_summary |

---

## Cài đặt nhanh

### Docker Compose

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

### prometheus.yml cơ bản

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3333']
```

---

## PromQL Queries

### Cơ bản

```promql
# Metric hiện tại
up

# Lọc theo label
up{job="api"}

# Rate của counter trong 5 phút
rate(http_requests_total[5m])
```

### Phổ biến

```promql
# Request rate
sum(rate(http_requests_total[5m]))

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) /
sum(rate(http_requests_total[5m])) * 100

# 95th percentile latency
histogram_quantile(0.95, sum(rate(http_request_duration_bucket[5m])) by (le))

# CPU usage
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

---

## Grafana Dashboards

### Tạo Dashboard

1. Mở Grafana: http://localhost:3001
2. Login: admin / admin123
3. Add data source: Prometheus (http://prometheus:9090)
4. Create Dashboard → Add Panel
5. Viết PromQL query
6. Configure visualization
7. Save

### Dashboard phổ biến (Import by ID)

| ID | Tên | Mô tả |
|----|-----|-------|
| 1860 | Node Exporter Full | Server metrics |
| 893 | Docker monitoring | Container metrics |
| 9628 | PostgreSQL | Database metrics |
| 11835 | Redis | Cache metrics |

---

## Alerting

### Prometheus Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

### Alertmanager

```yaml
# alertmanager.yml
route:
  receiver: 'slack'
  group_wait: 30s

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
        channel: '#alerts'
```

---

## Tổng kết

### URLs

| Service | URL |
|---------|-----|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| Alertmanager | http://localhost:9093 |

### Commands

```bash
# Khởi động stack
docker compose -f docker-compose.monitoring.yml up -d

# Kiểm tra targets
curl http://localhost:9090/api/v1/targets

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

---

**Tiếp theo:** Xem [Prometheus & Grafana Setup](./prometheus-grafana-setup.md) để cấu hình chi tiết.
