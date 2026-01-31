---
id: prometheus-grafana-setup
title: Prometheus & Grafana Setup
sidebar_position: 10
---

# Prometheus & Grafana Setup Guide for MSM-CAR-BOOKING

**Document Version:** 1.0
**Last Updated:** 2026-01-25
**Difficulty:** Intermediate
**Time Required:** 30-45 minutes

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Part 1: Understanding the Concepts](#part-1-understanding-the-concepts)
5. [Part 2: NestJS API Metrics Setup](#part-2-nestjs-api-metrics-setup)
6. [Part 3: Prometheus Setup](#part-3-prometheus-setup)
7. [Part 4: Grafana Setup](#part-4-grafana-setup)
8. [Part 5: Creating Custom Dashboards](#part-5-creating-custom-dashboards)
9. [Part 6: Alerting](#part-6-alerting)
10. [Troubleshooting](#troubleshooting)
11. [Quick Reference](#quick-reference)

---

## Overview

### What is Prometheus?

**Prometheus** is an open-source monitoring and alerting system. Think of it as a data collector that:

- **Scrapes** (pulls) metrics from your applications every few seconds
- **Stores** the metrics in a time-series database
- **Queries** the data using PromQL (Prometheus Query Language)
- **Alerts** when certain conditions are met

### What is Grafana?

**Grafana** is an open-source visualization platform. Think of it as:

- A **dashboard builder** that creates beautiful charts and graphs
- A **data explorer** that lets you query and analyze metrics
- An **alert manager** that can send notifications

### Why Use Them Together?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         How It Works                                     │
│                                                                          │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐         │
│   │   Your App  │  ────▶ │ Prometheus  │  ────▶ │   Grafana   │         │
│   │  /metrics   │ scrape │   (store)   │ query  │ (visualize) │         │
│   └─────────────┘        └─────────────┘        └─────────────┘         │
│                                                                          │
│   Your app exposes       Prometheus pulls       Grafana reads from      │
│   metrics at an          metrics every 15s     Prometheus and shows     │
│   HTTP endpoint          and stores them        beautiful dashboards    │
└─────────────────────────────────────────────────────────────────────────┘
```

| Tool | Role | Analogy |
|------|------|---------|
| **Your App** | Exposes metrics | The thermometer |
| **Prometheus** | Collects & stores | The weather station |
| **Grafana** | Visualizes | The weather app on your phone |

---

## Architecture

### MSM-CAR-BOOKING Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MSM-CAR-BOOKING Monitoring Stack                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Docker Network                            │    │
│  │                                                                  │    │
│  │   ┌─────────────┐                                               │    │
│  │   │  NestJS API │◀────────────┐                                 │    │
│  │   │   :3333     │             │                                 │    │
│  │   │  /api/metrics             │ scrape every 15s                │    │
│  │   └─────────────┘             │                                 │    │
│  │                               │                                 │    │
│  │   ┌─────────────┐        ┌────┴────────┐        ┌───────────┐  │    │
│  │   │  PostgreSQL │        │  Prometheus │        │  Grafana  │  │    │
│  │   │   :5432     │        │    :9090    │◀───────│   :3002   │  │    │
│  │   └─────────────┘        └─────────────┘        └───────────┘  │    │
│  │                                                                  │    │
│  │   ┌─────────────┐                                               │    │
│  │   │    Redis    │                                               │    │
│  │   │   :6379     │                                               │    │
│  │   └─────────────┘                                               │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Access URLs:                                                            │
│  • API:        http://localhost:3333                                     │
│  • Metrics:    http://localhost:3333/api/metrics                         │
│  • Prometheus: http://localhost:9090                                     │
│  • Grafana:    http://localhost:3002                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **NestJS API** exposes metrics at `/api/metrics`
2. **Prometheus** scrapes this endpoint every 15 seconds
3. **Prometheus** stores the data in its time-series database
4. **Grafana** queries Prometheus and displays dashboards

---

## Prerequisites

Before starting, ensure you have:

- [x] Docker and Docker Compose installed
- [x] MSM-CAR-BOOKING API running (`pnpm start:dev`)
- [x] Basic understanding of HTTP and REST APIs

### Verify Docker is Running

```bash
docker --version
docker compose version
```

---

## Part 1: Understanding the Concepts

### What are Metrics?

Metrics are numerical measurements collected over time. Examples:

| Metric | Type | Example Value | What It Tells You |
|--------|------|---------------|-------------------|
| `http_requests_total` | Counter | 12,345 | Total requests since start |
| `memory_usage_bytes` | Gauge | 134,217,728 | Current memory (128MB) |
| `request_duration_seconds` | Histogram | 0.05, 0.1, 0.5 | Response time distribution |

### Metric Types

#### 1. Counter (Always Goes Up)

```
# Example: Total HTTP requests
http_requests_total{method="GET", path="/api/users"} 1234

# Counters only increase (or reset to 0 on restart)
# Use rate() to get requests per second:
rate(http_requests_total[5m])  # requests/sec over last 5 minutes
```

**Use for:** Request counts, error counts, bytes transferred

#### 2. Gauge (Goes Up and Down)

```
# Example: Current active connections
active_connections 42

# Gauges can increase or decrease
# Use directly for current value
```

**Use for:** Temperature, memory usage, queue size, active users

#### 3. Histogram (Distribution of Values)

```
# Example: Request duration buckets
http_request_duration_seconds_bucket{le="0.1"} 24054   # 24054 requests under 0.1s
http_request_duration_seconds_bucket{le="0.5"} 33444   # 33444 requests under 0.5s
http_request_duration_seconds_bucket{le="1.0"} 34535   # 34535 requests under 1.0s
http_request_duration_seconds_sum 8953.332             # Total time of all requests
http_request_duration_seconds_count 34670              # Total number of requests
```

**Use for:** Response times, request sizes

### The Pull Model

Prometheus uses a **pull model** - it fetches metrics from your services:

```
┌──────────────┐          ┌──────────────┐
│  Prometheus  │──────────│  Your App   │
│              │  HTTP    │  /metrics   │
│   (pulls)    │  GET     │             │
│              │◀─────────│  (responds) │
└──────────────┘          └──────────────┘

Every 15 seconds:
1. Prometheus sends: GET /api/metrics
2. Your app responds with current metric values
3. Prometheus stores the values with timestamp
```

**Benefits:**
- Prometheus controls the scrape rate
- Easy to add/remove targets
- No need for apps to know about Prometheus
- Works even if monitoring is temporarily down

---

## Part 2: NestJS API Metrics Setup

### Step 1: Install Dependencies

The MSM-CAR-BOOKING project already has these installed:

```bash
pnpm add @willsoto/nestjs-prometheus prom-client
```

### Step 2: Create Metrics Module

**File:** `src/metrics/metrics.module.ts`

```typescript
import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,  // Use our custom controller
      defaultMetrics: {
        enabled: true,  // Collect Node.js default metrics
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    // ===== BUSINESS METRICS =====
    // Track business-specific data

    makeCounterProvider({
      name: 'xlogistics_orders_total',
      help: 'Total number of orders created',
      labelNames: ['status'],  // pending, completed, cancelled
    }),

    makeCounterProvider({
      name: 'xlogistics_trips_total',
      help: 'Total number of trips',
      labelNames: ['status', 'handler_type'],
    }),

    // ===== API METRICS =====
    // Track API performance

    makeHistogramProvider({
      name: 'xlogistics_api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],  // Response time buckets
    }),

    // ===== SYSTEM METRICS =====
    // Track system state

    makeGaugeProvider({
      name: 'xlogistics_active_users',
      help: 'Number of currently active users',
    }),

    makeGaugeProvider({
      name: 'xlogistics_pending_orders',
      help: 'Number of pending orders',
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
```

**Explanation:**

| Part | Purpose |
|------|---------|
| `PrometheusModule.register()` | Sets up the Prometheus metrics system |
| `defaultMetrics: { enabled: true }` | Collects Node.js metrics automatically (memory, CPU, event loop) |
| `makeCounterProvider()` | Creates a counter metric |
| `makeHistogramProvider()` | Creates a histogram metric |
| `makeGaugeProvider()` | Creates a gauge metric |
| `labelNames` | Dimensions to slice the metric by |

### Step 3: Create Metrics Controller

**File:** `src/metrics/metrics.controller.ts`

```typescript
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from '../common/decorators/public.decorator';

@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Public()  // Skip JWT authentication
  @Get()
  async index(@Res({ passthrough: true }) response: Response): Promise<string> {
    return super.index(response);
  }
}
```

**Explanation:**

| Part | Purpose |
|------|---------|
| `@Controller('metrics')` | Route: `/api/metrics` (with global prefix) |
| `extends PrometheusController` | Inherits the metrics rendering logic |
| `@Public()` | Bypasses JWT authentication (Prometheus needs unauthenticated access) |
| `super.index(response)` | Calls parent to render metrics in Prometheus format |

### Step 4: Import in AppModule

**File:** `src/app.module.ts`

```typescript
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    MetricsModule,  // Add this
    AuthModule,
    TenantModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 5: Exclude Metrics from Tenant Middleware

Since metrics should be accessible without tenant context, add to exclusions:

**File:** `src/modules/tenant/tenant.module.ts`

```typescript
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        // ... other exclusions
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'api/metrics', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
```

### Step 6: Verify Metrics Endpoint

```bash
# Test the endpoint
curl http://localhost:3333/api/metrics

# You should see output like:
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.212013
# ... more metrics
```

---

## Part 3: Prometheus Setup

### Step 1: Docker Compose Configuration

**File:** `docker-compose.yml` (relevant section)

```yaml
services:
  # ... other services

  # ===== PROMETHEUS =====
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: MSM-CAR-BOOKING-prometheus

    # Mount configuration and data
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

    # Prometheus startup options
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'  # Config location
      - '--storage.tsdb.path=/prometheus'               # Data storage
      - '--storage.tsdb.retention.time=15d'             # Keep 15 days
      - '--web.enable-lifecycle'                        # Allow config reload

    # Expose port
    ports:
      - "9090:9090"

    networks:
      - MSM-CAR-BOOKING-network

volumes:
  prometheus_data:  # Persistent storage for metrics
```

**Explanation:**

| Setting | Purpose |
|---------|---------|
| `image: prom/prometheus:v2.47.0` | Official Prometheus Docker image |
| `volumes: ./prometheus/prometheus.yml` | Your config file mounted into container |
| `prometheus_data:/prometheus` | Named volume for persistent data |
| `--storage.tsdb.retention.time=15d` | Keep metrics for 15 days |
| `--web.enable-lifecycle` | Allow reloading config without restart |

### Step 2: Prometheus Configuration

**File:** `prometheus/prometheus.yml`

```yaml
# ===== GLOBAL SETTINGS =====
# Apply to all scrape jobs unless overridden
global:
  scrape_interval: 15s      # How often to scrape targets
  evaluation_interval: 15s  # How often to evaluate rules

# ===== ALERTING (Optional) =====
alerting:
  alertmanagers:
    - static_configs:
        - targets: []  # No alertmanager configured yet

# ===== RULE FILES (Optional) =====
rule_files: []  # No alert rules yet

# ===== SCRAPE CONFIGURATIONS =====
# Define what to scrape and how
scrape_configs:

  # ----- Prometheus Self-Monitoring -----
  # Prometheus scrapes itself for its own metrics
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # ----- MSM-CAR-BOOKING NestJS API -----
  # Your main application
  - job_name: 'MSM-CAR-BOOKING-saas-api'
    static_configs:
      - targets: ['host.docker.internal:3333']
        # host.docker.internal = host machine from Docker
    metrics_path: /api/metrics   # Path to metrics endpoint
    scrape_interval: 10s         # Scrape more frequently
```

**Explanation:**

| Section | Purpose |
|---------|---------|
| `global.scrape_interval` | Default time between scrapes (15s = good balance) |
| `scrape_configs` | List of targets to scrape |
| `job_name` | Unique identifier for this scrape job |
| `static_configs.targets` | List of host:port to scrape |
| `metrics_path` | HTTP path to fetch metrics from |
| `host.docker.internal` | Special DNS to reach host from Docker container |

### Step 3: Start Prometheus

```bash
cd /path/to/MSM-CAR-BOOKING-saas-api

# Start Prometheus
docker compose up -d prometheus

# Check it's running
docker compose ps prometheus

# View logs
docker compose logs -f prometheus
```

### Step 4: Verify Prometheus

1. **Open Prometheus UI:** http://localhost:9090

2. **Check Targets:** http://localhost:9090/targets
   - All targets should show "UP" (green)
   - If "DOWN" (red), check the error message

3. **Try a Query:**
   - Go to http://localhost:9090/graph
   - Enter: `up`
   - Click "Execute"
   - You should see `up{job="MSM-CAR-BOOKING-saas-api"} 1`

### Step 5: Useful PromQL Queries

```promql
# Is the API up? (1 = yes, 0 = no)
up{job="MSM-CAR-BOOKING-saas-api"}

# Memory usage in MB
process_resident_memory_bytes / 1024 / 1024

# CPU usage (rate over 5 minutes)
rate(process_cpu_seconds_total[5m])

# Node.js event loop lag
nodejs_eventloop_lag_seconds

# Active handles in Node.js
nodejs_active_handles_total
```

---

## Part 4: Grafana Setup

### Step 1: Docker Compose Configuration

**File:** `docker-compose.yml` (relevant section)

```yaml
services:
  # ... other services

  # ===== GRAFANA =====
  grafana:
    image: grafana/grafana:10.1.0
    container_name: MSM-CAR-BOOKING-grafana

    # Persistent storage and provisioning
    volumes:
      - grafana_data:/var/lib/grafana
      - ./prometheus/grafana/provisioning:/etc/grafana/provisioning

    # Default admin credentials
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: false  # Disable public registration

    ports:
      - "3002:3000"  # Grafana runs on 3000 internally

    depends_on:
      - prometheus

    networks:
      - MSM-CAR-BOOKING-network

volumes:
  grafana_data:  # Persistent storage for dashboards
```

**Explanation:**

| Setting | Purpose |
|---------|---------|
| `grafana_data:/var/lib/grafana` | Persist dashboards, users, settings |
| `./prometheus/grafana/provisioning` | Auto-configure datasources and dashboards |
| `GF_SECURITY_ADMIN_USER` | Default admin username |
| `GF_SECURITY_ADMIN_PASSWORD` | Default admin password |
| `GF_USERS_ALLOW_SIGN_UP: false` | Prevent anyone from creating accounts |

### Step 2: Auto-Configure Prometheus Datasource

Create this file to auto-configure Prometheus as a data source:

**File:** `prometheus/grafana/provisioning/datasources/prometheus.yml`

```yaml
# Grafana Datasource Provisioning
# This file auto-configures data sources when Grafana starts

apiVersion: 1

datasources:
  # ----- Prometheus -----
  - name: Prometheus
    type: prometheus
    access: proxy           # Grafana proxies requests to Prometheus
    url: http://MSM-CAR-BOOKING-prometheus:9090  # Docker service name
    isDefault: true         # Use this for new panels by default
    editable: false         # Prevent changes via UI
```

**Explanation:**

| Field | Purpose |
|-------|---------|
| `name: Prometheus` | Display name in Grafana |
| `type: prometheus` | Grafana datasource plugin to use |
| `access: proxy` | Grafana backend makes requests (more secure) |
| `url` | Where Prometheus is running (Docker network) |
| `isDefault: true` | Auto-select for new visualizations |

### Step 3: Start Grafana

```bash
# Start Grafana
docker compose up -d grafana

# Check it's running
docker compose ps grafana

# View logs
docker compose logs -f grafana
```

### Step 4: Access Grafana

1. **Open:** http://localhost:3002

2. **Login:**
   - Username: `admin`
   - Password: `admin`

3. **Skip password change** (or set a new one)

### Step 5: Verify Prometheus Connection

1. Go to: **Connections** → **Data sources**
2. Click on **Prometheus**
3. Scroll down and click **Test**
4. You should see: ✅ "Data source is working"

### Step 6: Import a Dashboard

**Method 1: Via UI**

1. Go to: **Dashboards** → **New** → **Import**
2. Enter dashboard ID: `11159` (Node.js Application Dashboard)
3. Click **Load**
4. Select **Prometheus** as data source
5. Click **Import**

**Method 2: Via API (Command Line)**

```bash
# Download dashboard JSON
curl -s "https://grafana.com/api/dashboards/11159/revisions/1/download" \
  -o /tmp/dashboard.json

# Import to Grafana
curl -u admin:admin -X POST http://localhost:3002/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d "{
    \"dashboard\": $(cat /tmp/dashboard.json),
    \"folderId\": 0,
    \"overwrite\": true,
    \"inputs\": [{
      \"name\": \"DS_PROMETHEUS\",
      \"type\": \"datasource\",
      \"pluginId\": \"prometheus\",
      \"value\": \"Prometheus\"
    }]
  }"
```

### Step 7: Recommended Dashboards

| Dashboard Name | ID | Description |
|----------------|-----|-------------|
| Node.js Application | `11159` | Memory, CPU, Event Loop |
| Node Exporter Full | `1860` | System metrics (if using node-exporter) |
| Docker Containers | `893` | Container metrics |
| PostgreSQL | `9628` | Database metrics |
| Redis | `11835` | Cache metrics |

---

## Part 5: Creating Custom Dashboards

### Step 1: Create New Dashboard

1. Go to: **Dashboards** → **New** → **New Dashboard**
2. Click **Add visualization**
3. Select **Prometheus** as data source

### Step 2: Add Memory Usage Panel

**Query:**
```promql
process_resident_memory_bytes / 1024 / 1024
```

**Settings:**
| Field | Value |
|-------|-------|
| Panel Title | Memory Usage (MB) |
| Visualization | Time series |
| Unit | megabytes (MB) |

### Step 3: Add CPU Usage Panel

**Query:**
```promql
rate(process_cpu_seconds_total[1m]) * 100
```

**Settings:**
| Field | Value |
|-------|-------|
| Panel Title | CPU Usage (%) |
| Visualization | Gauge |
| Unit | percent (0-100) |
| Min | 0 |
| Max | 100 |

### Step 4: Add Event Loop Lag Panel

**Query:**
```promql
nodejs_eventloop_lag_seconds * 1000
```

**Settings:**
| Field | Value |
|-------|-------|
| Panel Title | Event Loop Lag (ms) |
| Visualization | Stat |
| Unit | milliseconds (ms) |
| Thresholds | 0=green, 50=yellow, 100=red |

### Step 5: Add Active Handles Panel

**Query:**
```promql
nodejs_active_handles_total
```

**Settings:**
| Field | Value |
|-------|-------|
| Panel Title | Active Handles |
| Visualization | Stat |

### Step 6: Save Dashboard

1. Click **Save** (disk icon, top right)
2. Enter name: "MSM-CAR-BOOKING API Overview"
3. Click **Save**

---

## Part 6: Alerting

### Setting Up Alerts in Grafana

1. **Edit a Panel** → **Alert** tab
2. **Create alert rule:**

**Example: High Memory Alert**

```
Rule name: High Memory Usage
Condition: WHEN avg() OF query(A, 5m, now) IS ABOVE 500000000
           (500MB in bytes)
Evaluate every: 1m
For: 5m
```

### Setting Up Alerts in Prometheus

**File:** `prometheus/rules/alerts.yml`

```yaml
groups:
  - name: MSM-CAR-BOOKING-api
    rules:
      # API is down
      - alert: APIDown
        expr: up{job="MSM-CAR-BOOKING-saas-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MSM-CAR-BOOKING API is down"
          description: "The API has been unreachable for 1 minute"

      # High memory usage
      - alert: HighMemory
        expr: process_resident_memory_bytes > 500000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 500MB"
```

**Update prometheus.yml:**

```yaml
rule_files:
  - /etc/prometheus/rules/*.yml
```

---

## Troubleshooting

### Problem: Metrics endpoint returns "Tenant not found"

**Solution:** Add metrics path to middleware exclusions

```typescript
// In TenantModule.configure()
.exclude(
  { path: 'metrics', method: RequestMethod.ALL },
  { path: 'api/metrics', method: RequestMethod.ALL },
)
```

### Problem: Prometheus target shows "DOWN"

**Check:**
1. Is the API running? `curl http://localhost:3333/api/metrics`
2. Can Prometheus reach it? Check Docker network
3. Is the path correct in prometheus.yml?

**Debug:**
```bash
# Check from Prometheus container
docker exec MSM-CAR-BOOKING-prometheus wget -qO- http://host.docker.internal:3333/api/metrics
```

### Problem: Grafana can't connect to Prometheus

**Check:**
1. Is Prometheus running? `curl http://localhost:9090`
2. Is the datasource URL correct? Use Docker service name: `http://MSM-CAR-BOOKING-prometheus:9090`

**Debug:**
```bash
# Check from Grafana container
docker exec MSM-CAR-BOOKING-grafana wget -qO- http://MSM-CAR-BOOKING-prometheus:9090/api/v1/query?query=up
```

### Problem: No data in dashboard

**Check:**
1. Is the time range correct? (top right)
2. Are metrics being collected? Check Prometheus directly
3. Is the query correct? Test in Prometheus UI first

---

## Quick Reference

### URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| API Metrics | http://localhost:3333/api/metrics | None |
| Prometheus | http://localhost:9090 | None |
| Grafana | http://localhost:3002 | admin / admin |

### Common Commands

```bash
# Start monitoring stack
docker compose up -d prometheus grafana

# Stop monitoring stack
docker compose down prometheus grafana

# View logs
docker compose logs -f prometheus grafana

# Reload Prometheus config (no restart)
curl -X POST http://localhost:9090/-/reload

# Test metrics endpoint
curl http://localhost:3333/api/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Import Grafana dashboard via CLI
curl -u admin:admin -X POST http://localhost:3002/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d '{"dashboard": {...}, "overwrite": true}'
```

### Useful PromQL Queries

```promql
# API up/down
up{job="MSM-CAR-BOOKING-saas-api"}

# Memory usage (bytes)
process_resident_memory_bytes

# Memory usage (MB)
process_resident_memory_bytes / 1024 / 1024

# CPU usage rate
rate(process_cpu_seconds_total[5m])

# Event loop lag
nodejs_eventloop_lag_seconds

# Active handles
nodejs_active_handles_total

# Heap used
nodejs_heap_size_used_bytes
```

### File Locations

```
MSM-CAR-BOOKING-saas-api/
├── src/
│   └── metrics/
│       ├── metrics.module.ts      # Metrics configuration
│       └── metrics.controller.ts  # Metrics endpoint
├── prometheus/
│   ├── prometheus.yml             # Prometheus config
│   └── grafana/
│       └── provisioning/
│           └── datasources/
│               └── prometheus.yml # Grafana datasource
└── docker-compose.yml             # Container definitions
```

---

## Summary

### What We Set Up

1. **NestJS Metrics Module** - Exposes metrics at `/api/metrics`
2. **Prometheus** - Scrapes and stores metrics
3. **Grafana** - Visualizes metrics in dashboards

### Key Concepts

- **Pull Model**: Prometheus fetches metrics from your app
- **Time Series**: Data points with timestamps
- **PromQL**: Query language for Prometheus
- **Dashboards**: Visual representations of metrics

### Next Steps

1. Add more custom metrics for your business logic
2. Set up alerting for critical conditions
3. Add more exporters (PostgreSQL, Redis, Node Exporter)
4. Create custom dashboards for your specific needs

---

## Part 7: Email Alerting Setup

This section covers setting up email notifications for both **Alertmanager** (Prometheus alerts) and **Grafana** (dashboard-based alerts).

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Email Alerting Architecture                           │
│                                                                              │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐            │
│   │  NestJS API │───────▶│ Prometheus  │───────▶│Alertmanager │            │
│   │  /metrics   │ scrape │ (evaluate   │ alert  │   (route    │──────────┐ │
│   └─────────────┘        │   rules)    │        │  & notify)  │          │ │
│                          └─────────────┘        └─────────────┘          │ │
│                                                                           │ │
│                          ┌─────────────┐                                  │ │
│                          │   Grafana   │                                  │ │
│                          │  (alerts &  │──────────────────────────────────┤ │
│                          │   SMTP)     │                                  │ │
│                          └─────────────┘                                  │ │
│                                                                           │ │
│                                                        ┌──────────────┐  │ │
│                                                        │  SMTP Server │◀─┘ │
│                                                        │  (Gmail/AWS) │    │
│                                                        └──────────────┘    │
│                                                               │            │
│                                                               ▼            │
│                                                        ┌──────────────┐    │
│                                                        │    Email     │    │
│                                                        │   Inbox      │    │
│                                                        └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Two Alerting Paths

| Path | Use Case | When Triggered |
|------|----------|----------------|
| **Prometheus → Alertmanager** | Infrastructure alerts | When PromQL rule condition is met |
| **Grafana SMTP** | Dashboard-based alerts | When panel query exceeds threshold |

---

### Option 1: Alertmanager (Prometheus-based Alerts)

Alertmanager handles alerts from Prometheus and routes them to email, Slack, PagerDuty, etc.

#### Step 1: Prerequisites - SMTP Credentials

**For Gmail (recommended for development):**

1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)" → "MSM-CAR-BOOKING Alertmanager"
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

**For AWS SES (production):**

1. Create SMTP credentials in AWS SES console
2. Verify your sender domain
3. Use the SMTP endpoint: `email-smtp.us-east-1.amazonaws.com:587`

#### Step 2: Create Alertmanager Configuration

**File:** `prometheus/alertmanager/alertmanager.yml`

```yaml
# Alertmanager Configuration for MSM-CAR-BOOKING
# Handles alert routing and email notifications

global:
  # SMTP Configuration - UPDATE THESE VALUES
  smtp_smarthost: 'smtp.gmail.com:587'          # Gmail SMTP
  smtp_from: 'alerts@your-domain.com'           # Sender email
  smtp_auth_username: 'your-email@gmail.com'    # SMTP username
  smtp_auth_password: 'your-app-password'       # Gmail App Password
  smtp_require_tls: true

  # How long to wait before sending "resolved" notification
  resolve_timeout: 5m

# Route tree - defines how alerts are grouped and routed
route:
  # Default receiver
  receiver: 'email-notifications'

  # Group alerts by these labels
  group_by: ['alertname', 'severity', 'job']

  # Timing
  group_wait: 30s        # Wait before sending first notification
  group_interval: 5m     # Wait before sending updates
  repeat_interval: 4h    # Wait before resending same alert

  # Child routes for specific handling
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'email-critical'
      group_wait: 10s
      repeat_interval: 1h

# Receivers define notification endpoints
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'devops@your-domain.com'
        send_resolved: true
        headers:
          subject: '[MSM-CAR-BOOKING Alert] {{ .GroupLabels.alertname }}'

  - name: 'email-critical'
    email_configs:
      - to: 'devops@your-domain.com, admin@your-domain.com'
        send_resolved: true
        headers:
          subject: '[MSM-CAR-BOOKING CRITICAL] {{ .GroupLabels.alertname }}'

# Inhibition rules
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'job']
```

**Explanation:**

| Section | Purpose |
|---------|---------|
| `global.smtp_*` | SMTP server configuration |
| `route` | How to group and route alerts |
| `group_by` | Combine similar alerts into one notification |
| `group_wait` | Batch alerts together before sending |
| `repeat_interval` | Don't spam - wait before resending |
| `receivers` | Where to send notifications |
| `inhibit_rules` | Suppress warnings when critical fires |

#### Step 3: Create Alert Rules

**File:** `prometheus/rules/alert-rules.yml`

```yaml
groups:
  # API Health Alerts
  - name: api-health
    interval: 30s
    rules:
      # API is down
      - alert: APIDown
        expr: up{job="MSM-CAR-BOOKING-saas-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MSM-CAR-BOOKING API is down"
          description: "The API has been unreachable for 1 minute."

      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{job="MSM-CAR-BOOKING-saas-api", status=~"5.."}[5m]))
          / sum(rate(http_requests_total{job="MSM-CAR-BOOKING-saas-api"}[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on MSM-CAR-BOOKING API"
          description: "Error rate is above 5% for 5 minutes."

  # Node/Process Alerts
  - name: node-health
    interval: 30s
    rules:
      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes{job="MSM-CAR-BOOKING-saas-api"} / 1024 / 1024 > 512
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on MSM-CAR-BOOKING API"
          description: "Memory usage is above 512MB for 5 minutes."
```

#### Step 4: Update Prometheus Configuration

**File:** `prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Connect to Alertmanager
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# Load alert rules
rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'MSM-CAR-BOOKING-saas-api'
    static_configs:
      - targets: ['host.docker.internal:3333']
    metrics_path: /api/metrics
    scrape_interval: 10s

  - job_name: 'alertmanager'
    static_configs:
      - targets: ['alertmanager:9093']
```

#### Step 5: Add Alertmanager to Docker Compose

Add this service to `docker-compose.yml`:

```yaml
services:
  # ... existing services

  # Alertmanager (Alert Handling & Email Notifications)
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: MSM-CAR-BOOKING-alertmanager
    volumes:
      - ./prometheus/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    ports:
      - "9093:9093"
    networks:
      - MSM-CAR-BOOKING-network

  # Update prometheus to depend on alertmanager
  prometheus:
    # ... existing config
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules  # Add rules volume
      - prometheus_data:/prometheus
    depends_on:
      - alertmanager

volumes:
  # ... existing volumes
  alertmanager_data:
```

#### Step 6: Start Services

```bash
# Start Alertmanager
docker compose up -d alertmanager

# Restart Prometheus to pick up new config
docker compose restart prometheus

# Verify Alertmanager is running
docker compose ps alertmanager

# Check logs
docker compose logs -f alertmanager
```

#### Step 7: Verify Setup

1. **Alertmanager UI:** http://localhost:9093
2. **Check status:** http://localhost:9093/#/status
3. **View alerts:** http://localhost:9093/#/alerts
4. **Prometheus alerts:** http://localhost:9090/alerts

#### Step 8: Test Email Notification

```bash
# Trigger a test alert by stopping the API
# (This will trigger the APIDown alert after 1 minute)

# Or use the Alertmanager API to send a test alert:
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "This is a test alert",
      "description": "Testing email notifications"
    }
  }]'
```

---

### Option 2: Grafana SMTP Alerting

Grafana can also send email alerts directly.

#### Step 1: Configure Grafana SMTP

Add these environment variables to Grafana in `docker-compose.yml`:

```yaml
grafana:
  environment:
    # ... existing vars
    GF_SMTP_ENABLED: true
    GF_SMTP_HOST: ${SMTP_HOST:-smtp.gmail.com:587}
    GF_SMTP_USER: ${SMTP_USER:-your-email@gmail.com}
    GF_SMTP_PASSWORD: ${SMTP_PASSWORD:-your-app-password}
    GF_SMTP_FROM_ADDRESS: ${SMTP_FROM:-alerts@your-domain.com}
    GF_SMTP_FROM_NAME: ${SMTP_FROM_NAME:-MSM-CAR-BOOKING Grafana}
```

#### Step 2: Add SMTP Variables to .env

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=alerts@your-domain.com
SMTP_FROM_NAME=MSM-CAR-BOOKING Alerts
```

#### Step 3: Restart Grafana

```bash
docker compose restart grafana
```

#### Step 4: Create Alert Contact Point

1. Go to Grafana: http://localhost:3002
2. Navigate to: **Alerting** → **Contact points**
3. Click **+ Add contact point**
4. Configure:
   - **Name:** `DevOps Email`
   - **Type:** `Email`
   - **Addresses:** `devops@your-domain.com`
5. Click **Test** to verify
6. Click **Save contact point**

#### Step 5: Create Notification Policy

1. Go to: **Alerting** → **Notification policies**
2. Click **Edit** on the default policy
3. Set **Default contact point:** `DevOps Email`
4. Click **Save**

#### Step 6: Create Alert Rule

1. Go to any dashboard panel
2. Click the panel title → **Edit**
3. Go to **Alert** tab
4. Click **Create alert rule from this panel**
5. Configure:
   - **Rule name:** `High Memory Usage`
   - **Condition:** When `avg()` of `query(A, 5m, now)` is above `500000000` (500MB)
   - **Evaluate every:** `1m`
   - **For:** `5m`
6. Click **Save rule and exit**

---

### Environment Variables Reference

Add these to your `.env` file:

```bash
# ======================
# SMTP Configuration
# ======================

# For Gmail:
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password  # Gmail App Password

# For AWS SES:
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com:587
# SMTP_USER=your-ses-smtp-username
# SMTP_PASSWORD=your-ses-smtp-password

# Common settings
SMTP_FROM=alerts@your-domain.com
SMTP_FROM_NAME=MSM-CAR-BOOKING Alerts
ALERT_EMAIL=devops@your-domain.com
```

---

### Common SMTP Providers

| Provider | SMTP Host | Port | Notes |
|----------|-----------|------|-------|
| Gmail | smtp.gmail.com | 587 | Requires App Password |
| AWS SES | email-smtp.\{region\}.amazonaws.com | 587 | Requires IAM credentials |
| SendGrid | smtp.sendgrid.net | 587 | Requires API key |
| Mailgun | smtp.mailgun.org | 587 | Requires API key |
| Office 365 | smtp.office365.com | 587 | Requires auth |

---

### Troubleshooting Email Alerts

#### Problem: Alertmanager not sending emails

**Check:**
1. SMTP credentials are correct
2. Gmail App Password (not regular password)
3. TLS is enabled

**Debug:**
```bash
# Check Alertmanager logs
docker compose logs alertmanager

# Test SMTP connection
docker exec MSM-CAR-BOOKING-alertmanager sh -c "nc -zv smtp.gmail.com 587"
```

#### Problem: Grafana SMTP test fails

**Check:**
1. Environment variables are set correctly
2. Restart Grafana after changing env vars
3. Check Grafana logs

**Debug:**
```bash
# Check Grafana logs
docker compose logs grafana | grep -i smtp

# Verify env vars
docker exec MSM-CAR-BOOKING-grafana env | grep GF_SMTP
```

#### Problem: Alerts not firing

**Check:**
1. Alert rules are loaded: http://localhost:9090/alerts
2. Condition is correct (test in Prometheus UI)
3. `for` duration has passed

**Debug:**
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules | jq

# Check Alertmanager alerts
curl http://localhost:9093/api/v1/alerts | jq
```

---

### Quick Reference: Email Alerting

| Service | URL | Purpose |
|---------|-----|---------|
| Alertmanager | http://localhost:9093 | Alert routing & notification |
| Alertmanager Status | http://localhost:9093/#/status | Config & connection status |
| Prometheus Alerts | http://localhost:9090/alerts | View firing alerts |
| Grafana Alerting | http://localhost:3002/alerting | Dashboard alerts |

### Commands

```bash
# Start alerting stack
docker compose up -d alertmanager prometheus grafana

# Reload Alertmanager config (no restart)
curl -X POST http://localhost:9093/-/reload

# Reload Prometheus config (no restart)
curl -X POST http://localhost:9090/-/reload

# Test Alertmanager notification
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert","severity":"info"},"annotations":{"summary":"Test"}}]'

# Check alert status
curl http://localhost:9093/api/v1/alerts | jq
```

---

**Document maintained by:** MSM-CAR-BOOKING DevOps Team
**Questions?** See [Troubleshooting](#troubleshooting) or check the logs
