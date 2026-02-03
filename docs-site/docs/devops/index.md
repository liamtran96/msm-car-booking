---
id: index
title: DevOps Overview
sidebar_position: 1
---

# DevOps Documentation

Welcome to the MSM-CAR-BOOKING DevOps documentation. This guide covers all the DevOps technologies used in this project.

## Learning Path

Follow this order to learn DevOps from basics to advanced:

```
1. Docker Basics          → Understand containers
         ↓
2. Docker Compose         → Multi-container apps
         ↓
3. Nginx                  → Web server & proxy
         ↓
4. Git Workflow           → Version control
         ↓
5. CI/CD with Jenkins     → Automation
         ↓
6. Deployment             → Going to production
         ↓
7. Monitoring             → Keep it running
         ↓
8. Prometheus & Grafana   → Metrics & dashboards
```

## Documentation Index

### Core Technologies

| Document | Description | Difficulty |
|----------|-------------|------------|
| [Docker](./01-docker) | Container basics, commands, Dockerfile | Beginner |
| [Docker Compose](./02-docker-compose) | Multi-container orchestration | Beginner |
| [Nginx](./03-nginx) | Web server, reverse proxy, SSL | Intermediate |
| [Git Workflow](./04-git-workflow) | Branching, commits, collaboration | Beginner |
| [CI/CD with Jenkins](./05-cicd-jenkins) | Automated builds and deployments | Intermediate |
| [Deployment](./06-deployment) | Production deployment strategies | Advanced |
| [Monitoring](./07-monitoring) | Logging, health checks, debugging | Intermediate |
| [VPS Deployment Guide](./08-vps-deployment-guide) | Backend-only VPS deployment | Intermediate |
| [Prometheus & Grafana](./09-prometheus-grafana) | Metrics, dashboards, alerting | Intermediate |

### Configuration

| Document | Description |
|----------|-------------|
| [Environment Variables](./environment-variables) | Complete reference for all environment variables |

### Quick Reference

| Document | Description |
|----------|-------------|
| [Cheatsheet](./cheatsheet) | All commands in one place |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer (Dev)                       │
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
│  │  Repository: MSM-CAR-BOOKING                                    │    │
│  │  Branches: main, develop, feature/*                  │    │
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

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Containerization** | Docker | Package apps with dependencies |
| **Orchestration** | Docker Compose | Run multiple containers |
| **Web Server** | Nginx | Serve files, proxy requests, SSL |
| **Version Control** | Git | Track code changes |
| **CI/CD** | Jenkins | Automate build & deploy |
| **Database** | PostgreSQL | Store data |
| **Cache** | Redis | Fast data access |
| **Metrics** | Prometheus | Collect & store metrics |
| **Dashboards** | Grafana | Visualize metrics & alerts |

## Getting Started

### Prerequisites

Before starting, install these tools:

```bash
# macOS
brew install git
brew install --cask docker
brew install --cask visual-studio-code

# Ubuntu
sudo apt install git
# Docker: see Docker documentation
```

### Quick Start

```bash
# Clone the project
git clone https://github.com/MSM-CAR-BOOKING/MSM-CAR-BOOKING.git
cd MSM-CAR-BOOKING

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Open in browser
open http://localhost:8080
```
