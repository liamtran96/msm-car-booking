---
id: 09-prometheus-grafana
title: Prometheus & Grafana
sidebar_position: 9
---

# Prometheus & Grafana

**Difficulty:** Intermediate
**Time to Learn:** 3-4 hours
**Prerequisites:** [01-docker.md](./01-docker.md), [02-docker-compose.md](./02-docker-compose.md), [07-monitoring.md](./07-monitoring.md)

---

## Overview

Prometheus and Grafana form the industry-standard stack for metrics collection, storage, and visualization.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Monitoring Architecture                           │
│                                                                      │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │   App   │────▶│  Prometheus │────▶│   Grafana   │                │
│  │ /metrics│     │   (Store)   │     │ (Visualize) │                │
│  └─────────┘     └─────────────┘     └─────────────┘                │
│                         │                                            │
│                         ▼                                            │
│                  ┌─────────────┐                                     │
│                  │ Alertmanager│──▶ Slack/Email/PagerDuty           │
│                  └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### What Each Tool Does

| Tool | Purpose | Analogy |
|------|---------|---------|
| **Prometheus** | Collects & stores metrics | The data collector |
| **Grafana** | Visualizes metrics | The dashboard |
| **Alertmanager** | Sends alerts | The notification system |
| **Exporters** | Expose metrics from services | The translators |

### Pull vs Push Model

Prometheus uses a **pull model** - it scrapes metrics from your services:

```
┌──────────────┐          ┌──────────────┐
│  Prometheus  │──────────│  Your App   │
│              │  scrape  │  /metrics   │
│   (pulls)    │◀─────────│             │
└──────────────┘          └──────────────┘
```

Benefits:
- Prometheus controls the rate
- Easy to add/remove targets
- No need for services to know about Prometheus

---

## Quick Start

### Docker Compose Setup

Create `docker-compose.monitoring.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.50.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.3.0
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    restart: unless-stopped
    networks:
      - monitoring

  # Node Exporter - System metrics
  node-exporter:
    image: prom/node-exporter:v1.7.0
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
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  # cAdvisor - Container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
```

### Directory Structure

```bash
mkdir -p prometheus/rules grafana/provisioning/{dashboards,datasources} alertmanager
```

```
monitoring/
├── docker-compose.monitoring.yml
├── prometheus/
│   ├── prometheus.yml
│   └── rules/
│       └── alerts.yml
├── grafana/
│   └── provisioning/
│       ├── dashboards/
│       │   └── dashboard.yml
│       └── datasources/
│           └── datasource.yml
└── alertmanager/
    └── alertmanager.yml
```

### Understanding the Docker Compose File

Let's break down each service:

```yaml
prometheus:
  image: prom/prometheus:v2.50.0      # Official Prometheus image
  ports:
    - "9090:9090"                      # Prometheus web UI
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    # Maps your local config file into the container (read-only)

    - prometheus_data:/prometheus
    # Named volume for metric data persistence

  command:
    - '--config.file=/etc/prometheus/prometheus.yml'  # Config location
    - '--storage.tsdb.path=/prometheus'               # Where to store data
    - '--storage.tsdb.retention.time=15d'             # Keep 15 days of data
    - '--web.enable-lifecycle'                        # Enable config reload via API
```

```yaml
grafana:
  image: grafana/grafana:10.3.0
  ports:
    - "3001:3000"                      # Grafana web UI (3001 to avoid conflicts)
  environment:
    - GF_SECURITY_ADMIN_USER=admin     # Default username
    - GF_SECURITY_ADMIN_PASSWORD=admin123  # Default password
    - GF_USERS_ALLOW_SIGN_UP=false     # Disable public signups
  volumes:
    - ./grafana/provisioning:/etc/grafana/provisioning:ro
    # Pre-configured datasources and dashboards
```

```yaml
node-exporter:
  # Collects HOST machine metrics (CPU, memory, disk)
  volumes:
    - /proc:/host/proc:ro    # Linux process info
    - /sys:/host/sys:ro      # Linux system info
    - /:/rootfs:ro           # Root filesystem
  # These mounts let node-exporter read host system metrics
```

```yaml
cadvisor:
  # Collects CONTAINER metrics (per-container CPU, memory, network)
  volumes:
    - /var/lib/docker/:/var/lib/docker:ro  # Docker container data
  privileged: true   # Required for container introspection
```

---

## Hands-On Exercises

### Exercise 1: Start the Monitoring Stack

```bash
# 1. Create the directory structure
mkdir -p monitoring/{prometheus/rules,grafana/provisioning/{dashboards,datasources},alertmanager}
cd monitoring

# 2. Create docker-compose.monitoring.yml (copy from Quick Start section above)

# 3. Create minimal prometheus.yml
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# 4. Create Grafana datasource
cat > grafana/provisioning/datasources/datasource.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
EOF

# 5. Start the stack
docker compose -f docker-compose.monitoring.yml up -d

# 6. Check all services are running
docker compose -f docker-compose.monitoring.yml ps
```

**What happens:**
1. Docker pulls all images (first time takes a few minutes)
2. Creates a `monitoring` network for inter-container communication
3. Starts Prometheus, Grafana, and Node Exporter
4. Prometheus immediately starts scraping itself and node-exporter

**Verify:**
```bash
# Open Prometheus - should show targets as "UP"
open http://localhost:9090/targets

# Open Grafana - login with admin/admin123
open http://localhost:3001
```

---

### Exercise 2: Query Metrics in Prometheus

```bash
# 1. Open Prometheus UI
open http://localhost:9090

# 2. Try these queries in the "Expression" box:
```

| Query | What it shows |
|-------|---------------|
| `up` | Which targets are up (1) or down (0) |
| `node_memory_MemTotal_bytes` | Total memory on host |
| `node_cpu_seconds_total` | CPU time by mode (user, system, idle) |
| `rate(node_cpu_seconds_total{mode="idle"}[5m])` | Idle CPU rate over 5 minutes |

```bash
# 3. Calculate memory usage percentage
# Paste this in the expression box:
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# 4. Click "Execute" then switch to "Graph" tab to see over time
```

**What happens:**
- Prometheus evaluates the PromQL expression
- Returns current values (Table) or historical data (Graph)
- You can adjust time range with the time picker

---

### Exercise 3: Create Your First Grafana Dashboard

```bash
# 1. Open Grafana
open http://localhost:3001

# 2. Login with admin / admin123
# 3. Click "Dashboards" → "New" → "New Dashboard"
# 4. Click "Add visualization"
# 5. Select "Prometheus" as data source
```

**Create a CPU Usage Panel:**
```
# In the query field, paste:
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

| Setting | Value |
|---------|-------|
| Panel title | CPU Usage % |
| Visualization | Time series |
| Unit | Percent (0-100) |

**Create a Memory Usage Panel:**
```
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

**Save the dashboard:**
1. Click the save icon (top right)
2. Name it "My First Dashboard"
3. Click "Save"

---

### Exercise 4: Import a Pre-built Dashboard

```bash
# 1. In Grafana, go to Dashboards → New → Import
# 2. Enter dashboard ID: 1860
# 3. Click "Load"
# 4. Select "Prometheus" as the data source
# 5. Click "Import"
```

**What happens:**
- Grafana fetches the dashboard JSON from grafana.com
- Creates all panels automatically
- You get a complete Node Exporter dashboard with 30+ panels

**Popular Dashboard IDs to try:**
- `1860` - Node Exporter Full (best for system metrics)
- `893` - Docker and system monitoring
- `11074` - Node Exporter for Prometheus (simpler)

---

### Exercise 5: Set Up an Alert

```bash
# 1. Create alert rules file
cat > prometheus/rules/alerts.yml << 'EOF'
groups:
  - name: test
    rules:
      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.8
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80%"
EOF

# 2. Update prometheus.yml to include rules
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# 3. Reload Prometheus config (no restart needed!)
curl -X POST http://localhost:9090/-/reload

# 4. Check alerts page
open http://localhost:9090/alerts
```

**What happens:**
1. Prometheus loads the new rule file
2. Evaluates `HighMemoryUsage` expression every 15 seconds
3. If memory > 80% for 1 minute, alert becomes "firing"
4. You'll see it in the Alerts page

---

## Prometheus Configuration

### Basic Configuration

Create `prometheus/prometheus.yml`:

```yaml
# ===== GLOBAL SETTINGS =====
# These apply to all scrape jobs unless overridden
global:
  scrape_interval: 15s          # How often to scrape targets
  # Lower = more data points but more storage
  # Higher = less granular but less storage
  # 15s is a good balance for most use cases

  evaluation_interval: 15s       # How often to evaluate alerting rules
  # Should match or be multiple of scrape_interval

  external_labels:
    monitor: 'xtms-monitor'      # Added to all metrics (useful for federation)

# ===== ALERTMANAGER CONNECTION =====
# Tell Prometheus where to send alerts
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093    # Docker service name:port

# ===== RULE FILES =====
# Load alerting and recording rules from these files
rule_files:
  - /etc/prometheus/rules/*.yml  # Glob pattern for all YAML files

# ===== SCRAPE CONFIGURATIONS =====
# Define what endpoints to scrape and how
scrape_configs:
  # ----- Prometheus itself -----
  # Prometheus exposes its own metrics
  - job_name: 'prometheus'       # Unique name for this job
    static_configs:              # Manually defined targets
      - targets: ['localhost:9090']
        # 'localhost' because this runs inside Prometheus container

  # ----- Node Exporter -----
  # System metrics (CPU, memory, disk, network)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        # Docker service name, not localhost

  # ----- cAdvisor -----
  # Container metrics (per-container CPU, memory)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # ----- Your API Application -----
  # Custom application metrics
  - job_name: 'api'
    static_configs:
      - targets: ['api:3333']    # Your API container
    metrics_path: /metrics        # Endpoint that exposes metrics
    # Default is /metrics, only specify if different

  # ----- Database Exporters -----
  # These translate database internals to Prometheus format
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### How Scraping Works

```
Every 15 seconds:
┌────────────────┐     GET /metrics      ┌─────────────────┐
│   Prometheus   │─────────────────────▶│  node-exporter  │
│                │                       │    :9100        │
│                │◀─────────────────────│                 │
└────────────────┘     Text response     └─────────────────┘

Response format:
# HELP node_cpu_seconds_total CPU time spent in each mode
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 123456.78
node_cpu_seconds_total{cpu="0",mode="user"} 9876.54
```

**What happens on each scrape:**
1. Prometheus sends HTTP GET to target's `/metrics` endpoint
2. Target returns all current metric values in Prometheus text format
3. Prometheus parses and stores with current timestamp
4. If scrape fails, `up{job=".."}` becomes `0`

### Service Discovery

For dynamic environments, use service discovery instead of static configs:

```yaml
scrape_configs:
  # Docker Swarm
  - job_name: 'docker-swarm'
    dockerswarm_sd_configs:
      - host: unix:///var/run/docker.sock
        role: tasks

  # Kubernetes
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod

  # File-based (for flexibility)
  - job_name: 'file-based'
    file_sd_configs:
      - files:
          - /etc/prometheus/targets/*.json
        refresh_interval: 30s
```

### Relabeling

Filter and modify labels before storage:

```yaml
scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3333']
    relabel_configs:
      # Add environment label
      - source_labels: [__address__]
        regex: '.*:3333'
        target_label: environment
        replacement: 'production'

      # Drop specific metrics
      - source_labels: [__name__]
        regex: 'go_.*'
        action: drop
```

---

## Metrics Types

Prometheus supports four metric types:

### 1. Counter

Always increasing values (resets on restart):

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/users"} 1234
http_requests_total{method="POST",path="/api/orders"} 567
```

Use for: Request counts, error counts, bytes transferred

### 2. Gauge

Values that can go up and down:

```
# HELP active_connections Current active connections
# TYPE active_connections gauge
active_connections 42
```

Use for: Temperature, memory usage, queue size

### 3. Histogram

Distribution of values in buckets:

```
# HELP http_request_duration_seconds Request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 24054
http_request_duration_seconds_bucket{le="0.5"} 33444
http_request_duration_seconds_bucket{le="1"} 34535
http_request_duration_seconds_bucket{le="+Inf"} 34670
http_request_duration_seconds_sum 8953.332
http_request_duration_seconds_count 34670
```

Use for: Request latencies, response sizes

### 4. Summary

Similar to histogram but with quantiles:

```
# HELP http_request_duration_seconds Request duration
# TYPE http_request_duration_seconds summary
http_request_duration_seconds{quantile="0.5"} 0.042
http_request_duration_seconds{quantile="0.9"} 0.128
http_request_duration_seconds{quantile="0.99"} 0.256
```

Use for: When you need pre-calculated percentiles

---

## Instrumenting Your Application

### Node.js/Express Example

```bash
npm install prom-client
```

```typescript
// src/metrics.ts
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a registry
export const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});
```

```typescript
// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
}
```

```typescript
// src/app.ts
import express from 'express';
import { register } from './metrics';
import { metricsMiddleware } from './middleware/metrics';

const app = express();

// Apply metrics middleware
app.use(metricsMiddleware);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### NestJS Example

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
  ],
})
export class AppModule {}
```

---

## PromQL - Query Language

### Basic Queries

```promql
# Instant vector - current value
http_requests_total

# With label filter
http_requests_total{method="GET"}

# Regex match
http_requests_total{path=~"/api/.*"}

# Negative match
http_requests_total{status!="200"}
```

### Range Vectors

```promql
# Last 5 minutes of data
http_requests_total[5m]

# Last 1 hour
http_requests_total[1h]
```

### Rate and Increase

```promql
# Requests per second (rate over 5m)
rate(http_requests_total[5m])

# Total increase over 1 hour
increase(http_requests_total[1h])

# For counters that reset rarely, use irate
irate(http_requests_total[5m])
```

### Aggregations

```promql
# Sum across all instances
sum(rate(http_requests_total[5m]))

# Sum by specific label
sum by (method) (rate(http_requests_total[5m]))

# Average
avg(rate(http_requests_total[5m]))

# Max/Min
max(node_memory_MemFree_bytes)
min(node_memory_MemFree_bytes)

# Count of time series
count(up)

# Top 5
topk(5, rate(http_requests_total[5m]))
```

### Histogram Percentiles

```promql
# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile by path
histogram_quantile(0.99,
  sum by (path, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

### Useful Queries

```promql
# Error rate (5xx responses)
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m])) * 100

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU usage
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Disk usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Container memory usage
container_memory_usage_bytes{name=~".+"}

# Request latency SLI
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) < 0.5
```

---

## Alerting

### Alert Rules

Create `prometheus/rules/alerts.yml`:

```yaml
groups:
  - name: instance
    rules:
      # Instance down
      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 1 minute."

  - name: api
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Slow responses
      - alert: SlowResponses
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency is high"
          description: "P95 latency is {{ $value | humanizeDuration }}"

  - name: resources
    rules:
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}
          / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"})) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Disk usage is {{ $value | humanizePercentage }}"

  - name: containers
    rules:
      # Container restarting
      - alert: ContainerRestarting
        expr: increase(container_restart_count[1h]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.name }} restarting frequently"
          description: "Container has restarted {{ $value }} times in the last hour"
```

### Alertmanager Configuration

Create `alertmanager/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@yourcompany.com'
  smtp_auth_username: 'alerts@yourcompany.com'
  smtp_auth_password: 'your-app-password'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'

  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    # All alerts go to Slack
    - match_re:
        severity: warning|critical
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@yourcompany.com'

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx/yyy/zzz'
        channel: '#alerts'
        username: 'Prometheus'
        icon_emoji: ':prometheus:'
        send_resolved: true
        title: '{{ if eq .Status "firing" }}:fire:{{ else }}:white_check_mark:{{ end }} {{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'your-pagerduty-key'
        send_resolved: true

inhibit_rules:
  # If critical, suppress warning
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

---

## Grafana Setup

### Datasource Provisioning

Create `grafana/provisioning/datasources/datasource.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false

  - name: Alertmanager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    jsonData:
      implementation: prometheus
```

### Dashboard Provisioning

Create `grafana/provisioning/dashboards/dashboard.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /etc/grafana/provisioning/dashboards
```

### Popular Dashboard IDs

Import these from grafana.com:

| Dashboard | ID | Description |
|-----------|-----|-------------|
| Node Exporter Full | 1860 | System metrics |
| Docker Container | 893 | Container metrics |
| Nginx | 12708 | Nginx metrics |
| PostgreSQL | 9628 | Database metrics |
| Redis | 11835 | Redis metrics |

### Creating Custom Dashboards

```json
{
  "dashboard": {
    "title": "API Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method)",
            "legendFormat": "{{ method }}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      }
    ]
  }
}
```

---

## Common Exporters

### PostgreSQL Exporter

```yaml
# Add to docker-compose.monitoring.yml
postgres-exporter:
  image: prometheuscommunity/postgres-exporter:v0.15.0
  container_name: postgres-exporter
  ports:
    - "9187:9187"
  environment:
    DATA_SOURCE_NAME: "postgresql://postgres:password@db:5432/postgres?sslmode=disable"
  networks:
    - monitoring
```

### Redis Exporter

```yaml
redis-exporter:
  image: oliver006/redis_exporter:v1.57.0
  container_name: redis-exporter
  ports:
    - "9121:9121"
  environment:
    REDIS_ADDR: "redis://redis:6379"
  networks:
    - monitoring
```

### Nginx Exporter

```yaml
nginx-exporter:
  image: nginx/nginx-prometheus-exporter:1.1.0
  container_name: nginx-exporter
  ports:
    - "9113:9113"
  command:
    - '-nginx.scrape-uri=http://nginx:80/nginx_status'
  networks:
    - monitoring
```

Enable stub_status in Nginx:

```nginx
server {
    location /nginx_status {
        stub_status on;
        allow 172.0.0.0/8;  # Docker network
        deny all;
    }
}
```

---

## Best Practices

### Naming Conventions

```
# Format: <namespace>_<name>_<unit>

# Good
http_requests_total
http_request_duration_seconds
node_memory_bytes_total

# Bad
requests              # No namespace
httpRequestDuration   # camelCase
request_time_ms       # Inconsistent unit
```

### Label Best Practices

```promql
# Good - Low cardinality
http_requests_total{method="GET", status="200", path="/api/users"}

# Bad - High cardinality (user IDs, request IDs)
http_requests_total{user_id="12345", request_id="abc-123"}
```

### Cardinality Control

High cardinality = slow queries and high memory:

```yaml
# Limit labels in your metrics
relabel_configs:
  - source_labels: [path]
    regex: '/api/users/[0-9]+'
    target_label: path
    replacement: '/api/users/:id'
```

### Recording Rules

Pre-compute expensive queries:

```yaml
# prometheus/rules/recording.yml
groups:
  - name: api_rules
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))

      - record: job:http_request_duration:p95
        expr: histogram_quantile(0.95, sum by (job, le) (rate(http_request_duration_seconds_bucket[5m])))
```

### Retention and Storage

```yaml
# prometheus command args
command:
  - '--storage.tsdb.retention.time=30d'    # Keep 30 days
  - '--storage.tsdb.retention.size=10GB'   # Or max 10GB
```

---

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check config
curl http://localhost:9090/api/v1/status/config

# Reload config (if --web.enable-lifecycle)
curl -X POST http://localhost:9090/-/reload
```

### High Memory Usage

```bash
# Check cardinality
curl http://localhost:9090/api/v1/status/tsdb

# Find high-cardinality metrics
curl 'http://localhost:9090/api/v1/query?query=topk(10,count by (__name__)({__name__=~".+"}))'
```

### Grafana Can't Connect

```bash
# Test from Grafana container
docker exec grafana wget -qO- http://prometheus:9090/api/v1/query?query=up

# Check network
docker network inspect monitoring
```

---

## Summary

### Quick Commands

```bash
# Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload

# Check alerts
curl http://localhost:9090/api/v1/alerts | jq

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=up'
```

### Access URLs

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Prometheus | http://localhost:9090 | None |
| Grafana | http://localhost:3001 | admin / admin123 |
| Alertmanager | http://localhost:9093 | None |

### Essential Metrics

| Metric | Query |
|--------|-------|
| Request rate | `sum(rate(http_requests_total[5m]))` |
| Error rate | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| P95 latency | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` |
| Memory usage | `(1 - node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes) * 100` |
| CPU usage | `100 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100` |

---

## xTMS Project Setup

This section provides the specific configuration for the xTMS project.

### Current Project Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     xTMS Monitoring Architecture                     │
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   web       │    │     api     │    │  postgres   │              │
│  │   :8080     │    │   :3333     │    │   :5432     │              │
│  │   (React)   │    │  (NestJS)   │    │             │              │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘              │
│                            │                   │                     │
│                    /api/health          postgres-exporter            │
│                    /metrics                    │                     │
│                            │                   │                     │
│                    ┌───────▼───────────────────▼──────┐              │
│                    │          Prometheus              │              │
│                    │           :9090                  │              │
│                    └───────────────┬──────────────────┘              │
│                                    │                                 │
│                    ┌───────────────▼──────────────────┐              │
│                    │           Grafana                │              │
│                    │           :3001                  │              │
│                    └──────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 1: Create Monitoring Directory

```bash
# From project root
mkdir -p monitoring/{prometheus/rules,grafana/provisioning/{dashboards,datasources},alertmanager}
```

### Step 2: Create docker-compose.monitoring.yml

Create `monitoring/docker-compose.monitoring.yml`:

```yaml
# xTMS Monitoring Stack
# Run with: docker compose -f monitoring/docker-compose.monitoring.yml up -d

services:
  # ===== PROMETHEUS =====
  # Collects and stores metrics from all services
  prometheus:
    image: prom/prometheus:v2.50.0
    container_name: xtms-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    restart: unless-stopped
    networks:
      - xtms-network
    # What happens:
    # 1. Prometheus starts and reads prometheus.yml
    # 2. Every 15s, it scrapes /metrics from configured targets
    # 3. Data is stored in /prometheus volume
    # 4. Web UI available at http://localhost:9090

  # ===== GRAFANA =====
  # Visualizes metrics with dashboards
  grafana:
    image: grafana/grafana:10.3.0
    container_name: xtms-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    restart: unless-stopped
    networks:
      - xtms-network
    depends_on:
      - prometheus
    # What happens:
    # 1. Grafana starts with pre-configured Prometheus datasource
    # 2. Login at http://localhost:3001 with admin/admin123
    # 3. Import dashboards using IDs (1860, 9628, etc.)

  # ===== NODE EXPORTER =====
  # Exposes host machine metrics (CPU, memory, disk)
  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: xtms-node-exporter
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
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - xtms-network
    # What happens:
    # 1. Reads system info from /proc, /sys, /rootfs
    # 2. Exposes metrics at http://localhost:9100/metrics
    # 3. Prometheus scrapes these every 15s

  # ===== POSTGRES EXPORTER =====
  # Exposes PostgreSQL metrics
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: xtms-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://xtms:xlogistics_dev_password@host.docker.internal:5432/xtms?sslmode=disable"
    restart: unless-stopped
    networks:
      - xtms-network
    # What happens:
    # 1. Connects to PostgreSQL using DATA_SOURCE_NAME
    # 2. Queries pg_stat_* tables for metrics
    # 3. Exposes at http://localhost:9187/metrics

  # ===== REDIS EXPORTER =====
  # Exposes Redis metrics
  redis-exporter:
    image: oliver006/redis_exporter:v1.57.0
    container_name: xtms-redis-exporter
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: "redis://host.docker.internal:6379"
    restart: unless-stopped
    networks:
      - xtms-network
    # What happens:
    # 1. Connects to Redis
    # 2. Runs INFO command to get stats
    # 3. Exposes at http://localhost:9121/metrics

networks:
  xtms-network:
    external: true
    # Uses the same network as your main docker-compose.yml
    # This allows Prometheus to reach the API container

volumes:
  prometheus_data:
  grafana_data:
```

### Step 3: Create Prometheus Config for xTMS

Create `monitoring/prometheus/prometheus.yml`:

```yaml
# xTMS Prometheus Configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: 'development'
    project: 'xtms'

# Alert rules
rule_files:
  - /etc/prometheus/rules/*.yml

# Scrape targets
scrape_configs:
  # ----- Prometheus itself -----
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          service: 'prometheus'

  # ----- xTMS NestJS API -----
  # Your API already has @willsoto/nestjs-prometheus installed
  - job_name: 'xtms-saas-api'
    static_configs:
      - targets: ['host.docker.internal:3333']
        labels:
          service: 'api'
    metrics_path: /api/metrics
    # Note: You need to add PrometheusModule to your NestJS app
    # See "Add Prometheus to NestJS API" section below

  # ----- API Health Check -----
  # Monitors if the API is responding
  - job_name: 'xtms-saas-api-health'
    static_configs:
      - targets: ['host.docker.internal:3333']
    metrics_path: /api/health
    # This hits your existing health endpoint

  # ----- Node Exporter (Host metrics) -----
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          service: 'host'

  # ----- PostgreSQL -----
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
        labels:
          service: 'database'

  # ----- Redis -----
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
        labels:
          service: 'cache'
```

### Step 4: Add Prometheus to Your NestJS API

Your `package.json` already has `@willsoto/nestjs-prometheus`. Add it to your app:

**Create `src/metrics/metrics.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',           // Endpoint: /api/metrics
      defaultMetrics: {
        enabled: true,            // Collect Node.js default metrics
      },
    }),
  ],
  providers: [
    // Custom metrics for xLogistics
    makeCounterProvider({
      name: 'xlogistics_orders_total',
      help: 'Total number of orders created',
      labelNames: ['status'],
    }),
    makeCounterProvider({
      name: 'xlogistics_trips_total',
      help: 'Total number of trips',
      labelNames: ['status', 'handler_type'],
    }),
    makeHistogramProvider({
      name: 'xlogistics_api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
```

**Update `src/app.module.ts`:**

```typescript
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    MetricsModule,  // Add this line
    AuthModule,
    TenantModule,
    // ... other modules
  ],
  // ...
})
export class AppModule {}
```

### Step 5: Create Grafana Datasource

Create `monitoring/grafana/provisioning/datasources/datasource.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

### Step 6: Create Alert Rules for xTMS

Create `monitoring/prometheus/rules/xtms-alerts.yml`:

```yaml
groups:
  - name: xtms-saas-api
    rules:
      # API is down
      - alert: XLogisticsAPIDown
        expr: up{job="xtms-saas-api"} == 0
        for: 1m
        labels:
          severity: critical
          service: api
        annotations:
          summary: "xTMS API is down"
          description: "The API has been unreachable for more than 1 minute"

      # High API error rate
      - alert: HighAPIErrorRate
        expr: |
          sum(rate(xlogistics_api_request_duration_seconds_count{status_code=~"5.."}[5m]))
          / sum(rate(xlogistics_api_request_duration_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
          service: api
        annotations:
          summary: "High API error rate"
          description: "More than 5% of requests are failing"

  - name: xtms-database
    rules:
      # PostgreSQL is down
      - alert: PostgreSQLDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL exporter is not responding"

      # Too many database connections
      - alert: HighDatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "High database connection count"
          description: "More than 80 active connections"

  - name: xtms-redis
    rules:
      # Redis is down
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
          service: cache
        annotations:
          summary: "Redis is down"
          description: "Redis exporter is not responding"

  - name: xtms-host
    rules:
      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      # High disk usage
      - alert: HighDiskUsage
        expr: (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage"
          description: "Disk usage is above 85%"
```

### Step 7: Start Monitoring Stack

```bash
# 1. Make sure main services are running
docker compose up -d

# 2. Start monitoring stack
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d

# 3. Verify all services are running
docker ps | grep xtms

# 4. Check Prometheus targets
open http://localhost:9090/targets

# 5. Access Grafana
open http://localhost:3001
# Login: admin / admin123

# 6. Import dashboards
# - Go to Dashboards → Import
# - Enter ID: 1860 (Node Exporter Full)
# - Enter ID: 9628 (PostgreSQL)
# - Enter ID: 11835 (Redis)
```

### Useful PromQL Queries for xTMS

```promql
# API request rate
sum(rate(xlogistics_api_request_duration_seconds_count[5m]))

# API error rate
sum(rate(xlogistics_api_request_duration_seconds_count{status_code=~"5.."}[5m]))
/ sum(rate(xlogistics_api_request_duration_seconds_count[5m])) * 100

# P95 API latency
histogram_quantile(0.95, sum(rate(xlogistics_api_request_duration_seconds_bucket[5m])) by (le))

# Total orders created
sum(xlogistics_orders_total)

# Trips by status
sum by (status) (xlogistics_trips_total)

# PostgreSQL active connections
pg_stat_activity_count

# Redis memory usage
redis_memory_used_bytes

# Host CPU usage
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Host memory usage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100
```

### Quick Start Commands

```bash
# Start everything
docker compose up -d
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d

# Stop monitoring
cd monitoring && docker compose -f docker-compose.monitoring.yml down

# View Prometheus logs
docker logs -f xtms-prometheus

# Reload Prometheus config (no restart needed)
curl -X POST http://localhost:9090/-/reload

# Check if API metrics are working
curl http://localhost:3333/api/metrics

# Check if API health is working
curl http://localhost:3333/api/health
```

---

**Next:** Return to [07-monitoring.md](./07-monitoring.md) for logging and debugging, or check the [Cheatsheet](./cheatsheet.md) for quick reference.
