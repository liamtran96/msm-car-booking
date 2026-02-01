---
id: 08-vps-deployment-guide
title: VPS Deployment Guide (Backend Only)
sidebar_position: 8
---

# VPS Deployment Guide (Backend Only)

**Difficulty:** Intermediate
**Time to Complete:** 1-2 hours
**Prerequisites:** Basic Linux knowledge, SSH access to VPS

---

## Overview

This guide walks you through deploying **only the backend services** of MSM Car Booking on a VPS. The frontend will be deployed separately to Vercel.

By the end, you'll have:

- Docker containerized services
- PostgreSQL database
- NestJS backend API with SSL

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VPS (Backend)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Docker Network                     │    │
│  │  ┌─────────────────┐        ┌─────────────────┐     │    │
│  │  │  Backend API    │   ←──  │   PostgreSQL    │     │    │
│  │  │  :3001 (HTTPS)  │        │   :5432         │     │    │
│  │  └─────────────────┘        └─────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
              │
              │ HTTPS API calls
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Frontend (CDN)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
        ┌───────────┐
        │   Users   │
        └───────────┘
```

---

## Prerequisites

### VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2GB | 3GB+ |
| CPU | 1 vCPU | 2 vCPU |
| Storage | 20GB SSD | 40GB SSD |
| OS | Ubuntu 22.04+, Fedora 40+ | Ubuntu 24.04 LTS, Fedora 43 |

### Before You Start

- [ ] VPS with SSH access (IP address and root password)
- [ ] Domain name (optional - can use Cloudflare Tunnel for free HTTPS)

---

## Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
# Example: ssh root@14.225.222.12
```

### 1.2 Update System Packages

**Ubuntu/Debian:**
```bash
apt update && apt upgrade -y
apt install -y curl wget git nano htop ufw
```

**Fedora/RHEL:**
```bash
dnf update -y
dnf install -y curl wget git nano htop firewalld
```

### 1.3 Create a Non-Root User (Recommended)

Running as root is risky. Create a deploy user:

```bash
# Create user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

### 1.4 Configure Firewall

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
sudo ufw status
```

**Fedora/RHEL (firewalld):**
```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

Expected ports open: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

### 1.5 Configure SSH Keys (Optional but Recommended)

On your **local machine**:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key to VPS
ssh-copy-id deploy@YOUR_VPS_IP
```

Now you can SSH without password:
```bash
ssh deploy@YOUR_VPS_IP
```

---

## Step 2: Install Docker

### 2.1 Install Docker Engine

**Ubuntu/Debian:**
```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Fedora/RHEL:**
```bash
# Install prerequisites
sudo dnf install -y dnf-plugins-core

# Add Docker repository
sudo dnf config-manager addrepo --from-repofile=https://download.docker.com/linux/fedora/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl enable --now docker
```

### 2.2 Configure Docker for Non-Root User

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker
```

### 2.3 Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker
docker run hello-world
```

Expected output:
```
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
Hello from Docker!
```

---

## Step 3: Setup Swap Space

For 3GB VPS, add swap to prevent out-of-memory issues.

### Standard Filesystem (ext4)

```bash
# Check current swap
free -h

# Create 2GB swap file
sudo fallocate -l 2G /swapfile

# Set permissions
sudo chmod 600 /swapfile

# Setup swap
sudo mkswap /swapfile
sudo swapon /swapfile

# Make persistent (survives reboot)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Btrfs Filesystem (Fedora Cloud)

Btrfs requires special handling for swap files:

```bash
# Check filesystem type
df -Th /

# If btrfs, use these commands:
sudo truncate -s 0 /swapfile
sudo chattr +C /swapfile
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make persistent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

Expected output:
```
              total        used        free      shared  buff/cache   available
Mem:          2.9Gi       xxx         xxx        xxx         xxx         xxx
Swap:         2.0Gi         0B        2.0Gi
```

### Configure Swappiness

```bash
# Set swappiness (lower = use less swap)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Step 4: Clone the Repository

### 4.1 Clone MSM Car Booking

```bash
# Go to home directory
cd ~

# Clone the repository
git clone https://github.com/YOUR_ORG/msm-car-booking.git

# Enter project directory
cd msm-car-booking
```

### 4.2 Project Structure Overview

```
msm-car-booking/
├── backend/              # NestJS API (we deploy this)
├── frontend/             # React app (deployed to Vercel)
├── database/             # Database init scripts
├── scripts/              # Deployment scripts
├── docker-compose.yml    # Main compose file
└── .env.example          # Environment template
```

---

## Step 5: Configure Environment

### 5.1 Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 5.2 Configure Production Settings

Update the `.env` file with your values:

```bash
# =============================================================================
# MSM Car Booking - Backend Production Environment
# =============================================================================

# Application
NODE_ENV=production
BUILD_TARGET=production

# Ports
BACKEND_PORT=3001
DB_PORT=5432

# Database - CHANGE THESE!
DB_USERNAME=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE   # Generate: openssl rand -base64 32
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT - CHANGE THIS!
JWT_SECRET=YOUR_32_CHAR_MIN_SECRET_KEY  # Generate: openssl rand -base64 48
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api/v1

# CORS - Your Vercel frontend URL
CORS_ORIGIN=https://your-app.vercel.app
```

### 5.3 Generate Secure Passwords

```bash
# Generate secure database password
openssl rand -base64 32

# Generate secure JWT secret
openssl rand -base64 48
```

Copy these generated values into your `.env` file.

---

## Step 6: Create Backend-Only Docker Compose

Create a new file for backend-only deployment:

```bash
nano docker-compose.backend.yml
```

Add this content:

```yaml
version: '3.8'

services:
  # PostgreSQL 18 - Optimized for 3GB VPS
  postgres:
    image: postgres:18-alpine
    container_name: msm_postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-msm_car_booking}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    command: >
      postgres
      -c shared_buffers=256MB
      -c effective_cache_size=512MB
      -c maintenance_work_mem=64MB
      -c work_mem=16MB
      -c max_connections=50
      -c checkpoint_completion_target=0.9
      -c wal_buffers=8MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-msm_car_booking}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 768M
        reservations:
          memory: 512M
    networks:
      - msm_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # NestJS Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: msm_backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: ${BACKEND_PORT:-3001}
      API_PREFIX: ${API_PREFIX:-api/v1}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_NAME: ${DB_NAME:-msm_car_booking}
      DB_SYNCHRONIZE: "false"
      DB_LOGGING: "false"
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
      NODE_OPTIONS: "--max-old-space-size=512"
    ports:
      - "${BACKEND_PORT:-3001}:3001"
    depends_on:
      postgres:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 640M
        reservations:
          memory: 384M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - msm_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    driver: local

networks:
  msm_network:
    driver: bridge
```

---

## Step 7: Deploy Backend

### 7.1 Build and Start Services

```bash
# Build the backend image
docker compose -f docker-compose.backend.yml build

# Start services
docker compose -f docker-compose.backend.yml up -d

# Check status
docker compose -f docker-compose.backend.yml ps
```

### 7.2 Run Database Migrations

```bash
# Run migrations
docker compose -f docker-compose.backend.yml exec backend pnpm migration:run

# Seed initial data (optional)
docker compose -f docker-compose.backend.yml exec backend pnpm seed:run
```

### 7.3 Verify Backend is Running

```bash
# Check health endpoint
curl http://localhost:3001/api/v1/health

# Check logs
docker compose -f docker-compose.backend.yml logs -f backend
```

Expected output:
```json
{"status":"ok"}
```

---

## Step 8: Setup HTTPS (Choose One Option)

### Option A: Cloudflare Tunnel (Quick, No Domain Required)

Best for: Quick setup, testing, no domain needed.

#### A.1 Install cloudflared

**Ubuntu/Debian:**
```bash
curl -L -o /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared
```

**Fedora/RHEL:**
```bash
curl -L -o /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared
```

#### A.2 Start Tunnel (Foreground)

```bash
cloudflared tunnel --url http://localhost:3001
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

#### A.3 Run as Background Service

```bash
nohup cloudflared tunnel --url http://localhost:3001 > /root/cloudflared.log 2>&1 &
```

Check your URL:
```bash
cat /root/cloudflared.log | grep trycloudflare
```

#### A.4 Create Systemd Service (Persistent)

**Method 1: Using nano (Recommended)**

```bash
nano /etc/systemd/system/cloudflared.service
```

Paste this content:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3001
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

**Method 2: Using heredoc**

```bash
cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3001
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

#### A.5 Enable and Start Service

```bash
systemctl daemon-reload
```

```bash
systemctl enable cloudflared
```

```bash
systemctl start cloudflared
```

#### A.6 Verify and Get URL

Check status:
```bash
systemctl status cloudflared
```

Get your HTTPS URL:
```bash
journalctl -u cloudflared | grep trycloudflare
```

> **Note:** Quick tunnels generate a new URL each restart. For a permanent URL, create a free Cloudflare account and set up a [named tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/).

---

### Option B: Nginx + Let's Encrypt (Domain Required)

Best for: Production, permanent domain.

#### B.1 Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

**Fedora/RHEL:**
```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

#### B.2 Configure Nginx for API

Create Nginx config:

**Ubuntu/Debian:**
```bash
sudo nano /etc/nginx/sites-available/msm-api
```

**Fedora/RHEL:**
```bash
sudo nano /etc/nginx/conf.d/msm-api.conf
```

Add this content (replace `api.your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

#### B.3 Enable the Site (Ubuntu/Debian only)

```bash
sudo ln -s /etc/nginx/sites-available/msm-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### B.4 Obtain SSL Certificate

```bash
sudo certbot --nginx -d api.your-domain.com
```

Certbot will:
1. Verify domain ownership
2. Obtain certificate
3. Update Nginx config automatically
4. Set up auto-renewal

#### B.5 Verify SSL

```bash
curl https://api.your-domain.com/api/v1/
```

---

## Step 9: Configure CORS for Vercel Frontend

Update your `.env` file with your Vercel domain:

```bash
nano .env
```

Update CORS_ORIGIN:

```bash
# Single domain
CORS_ORIGIN=https://your-app.vercel.app

# Or multiple domains (comma-separated)
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com
```

Restart the backend:

```bash
docker compose -f docker-compose.backend.yml restart backend
```

---

## Step 10: Vercel Frontend Setup

On your **local machine**, configure the frontend for Vercel:

### 10.1 Create Vercel Environment Variables

In your Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.your-domain.com/api/v1` |
| `VITE_APP_NAME` | `MSM Car Booking` |

### 10.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

---

## Maintenance

### Common Commands

```bash
# Check status
docker compose -f docker-compose.backend.yml ps

# View logs
docker compose -f docker-compose.backend.yml logs -f backend
docker compose -f docker-compose.backend.yml logs -f postgres

# Restart services
docker compose -f docker-compose.backend.yml restart

# Stop services
docker compose -f docker-compose.backend.yml down

# Start services
docker compose -f docker-compose.backend.yml up -d
```

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.backend.yml exec -T postgres \
  pg_dump -U postgres msm_car_booking > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.backend.yml build backend
docker compose -f docker-compose.backend.yml up -d backend

# Run new migrations if any
docker compose -f docker-compose.backend.yml exec backend pnpm migration:run
```

### Monitor Resources

```bash
# Docker resource usage
docker stats

# Memory usage
free -h

# Disk usage
df -h
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker compose -f docker-compose.backend.yml logs backend

# Check if port is in use
sudo lsof -i :3001
```

### Database Connection Issues

```bash
# Check postgres status
docker compose -f docker-compose.backend.yml ps postgres

# Connect directly to database
docker exec -it msm_postgres psql -U postgres -d msm_car_booking
```

### CORS Errors from Vercel

1. Check `CORS_ORIGIN` in `.env` matches your Vercel URL
2. Restart backend after changes
3. Check browser console for exact error

### SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew
```

---

## Security Checklist

- [ ] Changed default database password
- [ ] Generated strong JWT secret
- [ ] Configured UFW firewall
- [ ] Using non-root user for deployment
- [ ] SSH key authentication enabled
- [ ] SSL/TLS configured
- [ ] CORS properly restricted to Vercel domain
- [ ] Regular backups enabled

---

## Quick Reference

| Task | Command |
|------|---------|
| Start | `docker compose -f docker-compose.backend.yml up -d` |
| Stop | `docker compose -f docker-compose.backend.yml down` |
| Restart | `docker compose -f docker-compose.backend.yml restart` |
| Logs | `docker compose -f docker-compose.backend.yml logs -f` |
| Status | `docker compose -f docker-compose.backend.yml ps` |
| Rebuild | `docker compose -f docker-compose.backend.yml build` |

---

---

## Step 11: Auto-Deploy with GitHub Actions

Set up automatic deployment when you push to `main` branch.

### 11.1 Create Deploy User (Security Best Practice)

Never use root for automated deployments. Create a dedicated user:

```bash
# Create deploy user
useradd -m -s /bin/bash deploy

# Add to docker group
usermod -aG docker deploy

# Move project to deploy user's home
mv /root/msm-car-booking /home/deploy/
chown -R deploy:deploy /home/deploy/msm-car-booking
```

### 11.2 Generate SSH Key for GitHub Actions

```bash
# Switch to deploy user
su - deploy

# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# Add to authorized keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display private key (copy this)
cat ~/.ssh/github_actions
```

### 11.3 Add GitHub Secrets

Go to: `https://github.com/YOUR_ORG/msm-car-booking/settings/secrets/actions`

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP (e.g., `14.225.222.12`) |
| `VPS_USERNAME` | `deploy` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | Private key from step 11.2 |

### 11.4 Workflow File

The workflow is already created at `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
      - 'docker-compose.backend.yml'

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd ~/msm-car-booking
            git pull origin main
            docker compose -f docker-compose.backend.yml build backend
            docker compose -f docker-compose.backend.yml up -d backend
            docker image prune -f
```

### 11.5 How It Works

```
Push to main → GitHub Actions triggers → SSH to VPS → Pull & rebuild → Done
     │                   │                    │              │
     └── backend/** ─────┘                    │              │
         changes only                         │              │
                                              └── deploy user (not root)
```

### 11.6 Test Deployment

1. Make a small change to any file in `backend/`
2. Commit and push to `main`
3. Go to GitHub → Actions tab → Watch the deployment
4. Verify on VPS: `docker compose -f docker-compose.backend.yml ps`

---

**Next Steps:**
- [Monitoring & Logging](./07-monitoring.md) - Set up monitoring
- [Prometheus & Grafana](./09-prometheus-grafana.md) - Advanced metrics
