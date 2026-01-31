---
id: prometheus-grafana-setup
title: Hướng dẫn cài đặt Prometheus & Grafana
sidebar_position: 10
---

# Hướng dẫn cài đặt Prometheus & Grafana cho MSM-CAR-BOOKING

**Phiên bản tài liệu:** 1.0
**Cập nhật lần cuối:** 2026-01-25

---

## Tổng quan

Hướng dẫn này giúp thiết lập monitoring stack hoàn chỉnh cho MSM-CAR-BOOKING sử dụng Prometheus và Grafana.

### Thành phần

| Thành phần | Mục đích |
|-----------|---------|
| Prometheus | Thu thập và lưu trữ metrics |
| Grafana | Visualization và dashboards |
| Alertmanager | Quản lý và gửi alerts |
| Node Exporter | Server metrics |

---

## Bước 1: File docker-compose.monitoring.yml

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:10.2.0
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:v1.6.1
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

---

## Bước 2: Cấu hình Prometheus

Tạo file `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - alert_rules.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:3333']
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

---

## Bước 3: Alert Rules

Tạo file `monitoring/alert_rules.yml`:

```yaml
groups:
  - name: service_alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} không phản hồi"

      - alert: HighCPU
        expr: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage cao"
          description: "CPU usage trên 80% trong 5 phút"

      - alert: HighMemory
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Memory usage cao"
          description: "Memory usage trên 90%"

      - alert: DiskSpaceLow
        expr: (1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Disk space thấp"
          description: "Disk usage trên 85%"
```

---

## Bước 4: Alertmanager

Tạo file `monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

  routes:
    - receiver: 'slack-critical'
      match:
        severity: critical

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR_WEBHOOK'
        channel: '#monitoring'
        title: "{{ .GroupLabels.alertname }}"
        text: "{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}"

  - name: 'slack-critical'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR_WEBHOOK'
        channel: '#alerts-critical'
```

---

## Bước 5: Khởi động

```bash
# Tạo thư mục
mkdir -p monitoring/grafana/provisioning/datasources

# Khởi động
docker compose -f docker-compose.monitoring.yml up -d

# Kiểm tra
docker compose -f docker-compose.monitoring.yml ps
```

---

## Bước 6: Cấu hình Grafana

### Truy cập

1. Mở http://localhost:3001
2. Login: admin / admin123

### Thêm Prometheus Data Source

1. Configuration → Data Sources → Add
2. Chọn Prometheus
3. URL: http://prometheus:9090
4. Save & Test

### Import Dashboards

1. Create → Import
2. Nhập Dashboard ID
3. Chọn Prometheus data source
4. Import

**Dashboards khuyến nghị:**
- 1860: Node Exporter Full
- 893: Docker monitoring

---

## Tổng kết

### Truy cập URLs

| Service | URL | Đăng nhập |
|---------|-----|-----------|
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin/admin123 |
| Alertmanager | http://localhost:9093 | - |

### Commands hữu ích

```bash
# Khởi động
docker compose -f docker-compose.monitoring.yml up -d

# Dừng
docker compose -f docker-compose.monitoring.yml down

# Logs
docker compose -f docker-compose.monitoring.yml logs -f

# Reload Prometheus
curl -X POST http://localhost:9090/-/reload

# Kiểm tra alerts
curl http://localhost:9090/api/v1/alerts | jq
```
