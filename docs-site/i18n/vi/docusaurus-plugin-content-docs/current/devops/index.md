---
id: index
title: Tổng quan DevOps
sidebar_position: 1
---

# Tài liệu DevOps

Chào mừng bạn đến với tài liệu DevOps của MSM-CAR-BOOKING. Hướng dẫn này bao gồm tất cả các công nghệ DevOps được sử dụng trong dự án.

## Lộ trình học tập

Theo thứ tự này để học DevOps từ cơ bản đến nâng cao:

```
1. Docker Basics          → Hiểu về containers
         ↓
2. Docker Compose         → Ứng dụng nhiều container
         ↓
3. Nginx                  → Web server & proxy
         ↓
4. Git Workflow           → Quản lý phiên bản
         ↓
5. CI/CD với Jenkins      → Tự động hóa
         ↓
6. Deployment             → Triển khai production
         ↓
7. Monitoring             → Duy trì hoạt động
         ↓
8. Prometheus & Grafana   → Metrics & dashboards
```

## Mục lục tài liệu

### Công nghệ lõi

| Tài liệu | Mô tả | Độ khó |
|----------|-------|--------|
| [Docker](./01-docker) | Cơ bản về container, lệnh, Dockerfile | Cơ bản |
| [Docker Compose](./02-docker-compose) | Điều phối nhiều container | Cơ bản |
| [Nginx](./03-nginx) | Web server, reverse proxy, SSL | Trung bình |
| [Git Workflow](./04-git-workflow) | Branching, commits, cộng tác | Cơ bản |
| [CI/CD với Jenkins](./05-cicd-jenkins) | Builds và deployments tự động | Trung bình |
| [Deployment](./06-deployment) | Chiến lược triển khai production | Nâng cao |
| [Monitoring](./07-monitoring) | Logging, health checks, debugging | Trung bình |
| [Prometheus & Grafana](./09-prometheus-grafana) | Metrics, dashboards, alerting | Trung bình |

### Tham khảo nhanh

| Tài liệu | Mô tả |
|----------|-------|
| [Cheatsheet](./cheatsheet) | Tất cả lệnh trong một nơi |

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    Máy tính của bạn (Dev)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ VS Code │  │ Docker  │  │  Git    │  │ Browser │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
        │              │            │
        │              ▼            │
        │     ┌─────────────┐       │
        │     │   Docker    │       │
        │     │  Compose    │       │
        │     │ (Local Dev) │       │
        │     └─────────────┘       │
        │                           │
        │     git push              │
        └───────────┬───────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub / GitLab                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Repository: MSM-CAR-BOOKING                        │    │
│  │  Branches: main, develop, feature/*                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ Webhook trigger
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Jenkins (CI/CD)                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Build  │→ │  Test   │→ │ Docker  │→ │ Deploy  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                    │
                    │ docker push / ssh deploy
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Production)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Nginx  │→ │   Web   │  │   API   │→ │Database │        │
│  │ (Proxy) │  │ (React) │  │(NestJS) │  │(Postgres)│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Tóm tắt công nghệ

| Tầng | Công nghệ | Mục đích |
|------|-----------|----------|
| **Containerization** | Docker | Đóng gói ứng dụng với dependencies |
| **Orchestration** | Docker Compose | Chạy nhiều containers |
| **Web Server** | Nginx | Phục vụ files, proxy requests, SSL |
| **Version Control** | Git | Theo dõi thay đổi code |
| **CI/CD** | Jenkins | Tự động hóa build & deploy |
| **Database** | PostgreSQL | Lưu trữ dữ liệu |
| **Cache** | Redis | Truy cập dữ liệu nhanh |
| **Metrics** | Prometheus | Thu thập & lưu trữ metrics |
| **Dashboards** | Grafana | Trực quan hóa metrics & alerts |

## Bắt đầu

### Yêu cầu tiên quyết

Trước khi bắt đầu, cài đặt các công cụ sau:

```bash
# macOS
brew install git
brew install --cask docker
brew install --cask visual-studio-code

# Ubuntu
sudo apt install git
# Docker: xem tài liệu Docker
```

### Khởi động nhanh

```bash
# Clone dự án
git clone https://github.com/MSM-CAR-BOOKING/MSM-CAR-BOOKING.git
cd MSM-CAR-BOOKING

# Khởi động tất cả services
docker compose up -d

# Xem logs
docker compose logs -f

# Mở trong browser
open http://localhost:8080
```
