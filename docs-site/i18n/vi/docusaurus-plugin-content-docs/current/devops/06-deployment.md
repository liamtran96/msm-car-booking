---
id: 06-deployment
title: Deployment
sidebar_position: 7
---

# Chiến lược Deployment

**Độ khó:** Nâng cao
**Thời gian học:** 2-3 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md), [05-cicd-jenkins.md](./05-cicd-jenkins.md)

---

## Tổng quan Deployment

### Các loại môi trường

| Môi trường | Mục đích | Ai truy cập |
|------------|---------|-------------|
| Development | Phát triển code | Developers |
| Staging | Test trước production | QA, Stakeholders |
| Production | Users thực | End users |

---

## Chiến lược Deployment

### 1. Recreate (Đơn giản nhất)

Dừng tất cả, deploy phiên bản mới.

```
v1 ████████████ STOP
                    v2 ████████████ START
```

**Ưu điểm:** Đơn giản
**Nhược điểm:** Downtime

### 2. Rolling Update

Thay thế từng instance một.

```
v1 ██████████████
   v2 ████
      v1 ██████████
         v2 ████████
            v1 ██████
               v2 ████████████
```

**Ưu điểm:** Zero downtime
**Nhược điểm:** Hai versions chạy cùng lúc

### 3. Blue-Green

Chạy hai môi trường song song, switch traffic.

```
Blue  (v1): ████████████████ ← Traffic
Green (v2): ████████████████

Switch →

Blue  (v1): ████████████████
Green (v2): ████████████████ ← Traffic
```

**Ưu điểm:** Rollback nhanh
**Nhược điểm:** Cần gấp đôi resources

### 4. Canary

Deploy cho một phần nhỏ users trước.

```
v1: ████████████████████████ 90%
v2: ████ 10%

→ Nếu ok →

v1: ████████████ 50%
v2: ████████████ 50%

→ Nếu ok →

v2: ████████████████████████ 100%
```

**Ưu điểm:** An toàn, phát hiện lỗi sớm
**Nhược điểm:** Phức tạp hơn

---

## Deploy với Docker Compose

### Script deploy cơ bản

```bash
#!/bin/bash
# deploy.sh

set -e  # Dừng nếu có lỗi

echo "Pulling latest images..."
docker compose pull

echo "Starting services..."
docker compose up -d

echo "Cleaning up..."
docker image prune -f

echo "Deployment complete!"
docker compose ps
```

### Rolling Update với Compose

```bash
# Update từng service một
docker compose up -d --no-deps api
docker compose up -d --no-deps web

# Với scale
docker compose up -d --scale api=3
```

---

## Server Setup

### Chuẩn bị server

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Cài Docker Compose
sudo apt install docker-compose-plugin

# 4. Cài các tools cần thiết
sudo apt install -y git nginx certbot python3-certbot-nginx

# 5. Thiết lập firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Cấu trúc thư mục

```
/opt/app/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env
├── nginx/
│   └── app.conf
├── backups/
└── logs/
```

---

## Database Migrations

### Chạy migrations khi deploy

```bash
# Trong deploy script
docker compose exec -T api npm run migration:run
```

### Backup trước khi migrate

```bash
#!/bin/bash
# backup-and-migrate.sh

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

# Backup database
docker compose exec -T postgres pg_dump -U postgres > "/opt/backups/$BACKUP_FILE"

# Run migrations
docker compose exec -T api npm run migration:run

echo "Migration complete. Backup: $BACKUP_FILE"
```

---

## SSL/HTTPS Setup

### Let's Encrypt với Nginx

```bash
# Cài certbot
sudo apt install certbot python3-certbot-nginx

# Lấy certificate
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (đã được cài đặt tự động)
sudo certbot renew --dry-run
```

---

## Health Checks

### Verify deployment

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:3333/health"
MAX_RETRIES=10
RETRY_INTERVAL=5

for i in $(seq 1 $MAX_RETRIES); do
    response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

    if [ "$response" = "200" ]; then
        echo "Health check passed!"
        exit 0
    fi

    echo "Attempt $i: Health check failed (status: $response)"
    sleep $RETRY_INTERVAL
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
```

---

## Rollback

### Script rollback

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_TAG=${1:-"latest"}

echo "Rolling back to $PREVIOUS_TAG..."

# Pull previous version
docker compose pull

# Restart services
docker compose up -d

echo "Rollback complete!"
```

### Restore database từ backup

```bash
# Restore
docker compose exec -T postgres psql -U postgres < /opt/backups/backup_20240120.sql
```

---

## Monitoring sau Deploy

```bash
# Kiểm tra containers
docker compose ps

# Xem logs
docker compose logs -f --tail 100

# Kiểm tra resources
docker stats --no-stream

# Test endpoint
curl http://localhost:3333/health
```

---

## Tổng kết

### Deploy Checklist

- [ ] Backup database
- [ ] Pull latest images
- [ ] Run migrations
- [ ] Start services
- [ ] Health check
- [ ] Monitor logs
- [ ] Test critical endpoints

### Commands quan trọng

```bash
# Deploy
docker compose pull && docker compose up -d

# Rollback
docker compose down && git checkout v1.0.0 && docker compose up -d

# Health check
curl http://localhost:3333/health

# View logs
docker compose logs -f
```

---

**Tiếp theo:** Học [Monitoring](./07-monitoring.md) để giám sát hệ thống.
