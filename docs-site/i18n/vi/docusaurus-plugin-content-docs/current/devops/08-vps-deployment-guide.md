---
id: 08-vps-deployment-guide
title: Hướng dẫn Triển khai VPS (Chỉ Backend)
sidebar_position: 8
---

# Hướng dẫn Triển khai VPS (Chỉ Backend)

**Độ khó:** Trung bình
**Thời gian hoàn thành:** 1-2 giờ
**Yêu cầu:** Kiến thức cơ bản về Linux, quyền SSH vào VPS

---

## Tổng quan

Hướng dẫn này hướng dẫn bạn triển khai **chỉ các dịch vụ backend** của MSM Car Booking trên VPS. Frontend sẽ được triển khai riêng trên Vercel.

Khi hoàn thành, bạn sẽ có:

- Các dịch vụ Docker container hóa
- Cơ sở dữ liệu PostgreSQL
- Backend API NestJS với SSL

### Kiến trúc

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

## Yêu cầu Tiên quyết

### Yêu cầu VPS

| Tài nguyên | Tối thiểu | Khuyến nghị |
|------------|-----------|-------------|
| RAM | 2GB | 4GB |
| CPU | 1 vCPU | 2 vCPU |
| Lưu trữ | 20GB SSD | 40GB SSD |
| OS | Ubuntu 22.04+, Fedora 40+ | Ubuntu 24.04 LTS, Fedora 43 |

### Trước khi Bắt đầu

- [ ] VPS với quyền SSH (địa chỉ IP và mật khẩu root)
- [ ] Tên miền (tùy chọn - có thể dùng Cloudflare Tunnel để có HTTPS miễn phí)

---

## Bước 1: Thiết lập VPS Ban đầu

### 1.1 Kết nối đến VPS

```bash
ssh root@IP_VPS_CUA_BAN
# Ví dụ: ssh root@14.225.222.12
```

### 1.2 Cập nhật Packages Hệ thống

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

### 1.3 Tạo User Không phải Root (Khuyến nghị)

Chạy với quyền root là rủi ro. Tạo user deploy:

```bash
# Tạo user
adduser deploy

# Thêm vào group sudo
usermod -aG sudo deploy

# Chuyển sang user mới
su - deploy
```

### 1.4 Cấu hình Firewall

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

Các port mở mong đợi: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

### 1.5 Cấu hình SSH Keys (Tùy chọn nhưng Khuyến nghị)

Trên **máy local** của bạn:

```bash
# Tạo SSH key nếu chưa có
ssh-keygen -t ed25519 -C "email-cua-ban@example.com"

# Copy public key đến VPS
ssh-copy-id deploy@IP_VPS_CUA_BAN
```

Bây giờ bạn có thể SSH mà không cần mật khẩu:
```bash
ssh deploy@IP_VPS_CUA_BAN
```

---

## Bước 2: Cài đặt Docker

### 2.1 Cài đặt Docker Engine

**Ubuntu/Debian:**
```bash
# Xóa phiên bản cũ
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Cài đặt prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Thêm GPG key chính thức của Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Thêm repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Fedora/RHEL:**
```bash
# Cài đặt prerequisites
sudo dnf install -y dnf-plugins-core

# Thêm repository Docker
sudo dnf config-manager addrepo --from-repofile=https://download.docker.com/linux/fedora/docker-ce.repo

# Cài đặt Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Khởi động Docker
sudo systemctl enable --now docker
```

### 2.2 Cấu hình Docker cho User Không phải Root

```bash
# Thêm user hiện tại vào group docker
sudo usermod -aG docker $USER

# Áp dụng thay đổi group (hoặc logout/login)
newgrp docker
```

### 2.3 Xác minh Cài đặt Docker

```bash
# Kiểm tra phiên bản Docker
docker --version

# Kiểm tra phiên bản Docker Compose
docker compose version

# Test Docker
docker run hello-world
```

Output mong đợi:
```
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
Hello from Docker!
```

---

## Bước 3: Thiết lập Swap Space

Thêm swap để ngăn lỗi hết bộ nhớ trong lúc tải cao.

### Filesystem Tiêu chuẩn (ext4)

```bash
# Kiểm tra swap hiện tại
free -h

# Tạo file swap 2GB
sudo fallocate -l 2G /swapfile

# Đặt quyền
sudo chmod 600 /swapfile

# Thiết lập swap
sudo mkswap /swapfile
sudo swapon /swapfile

# Làm cho persistent (giữ sau reboot)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Xác minh
free -h
```

### Btrfs Filesystem (Fedora Cloud)

Btrfs yêu cầu xử lý đặc biệt cho swap files:

```bash
# Kiểm tra loại filesystem
df -Th /

# Nếu là btrfs, sử dụng các lệnh này:
sudo truncate -s 0 /swapfile
sudo chattr +C /swapfile
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Làm cho persistent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Xác minh
free -h
```

Output mong đợi:
```
              total        used        free      shared  buff/cache   available
Mem:          2.9Gi       xxx         xxx        xxx         xxx         xxx
Swap:         2.0Gi         0B        2.0Gi
```

### Cấu hình Swappiness

```bash
# Đặt swappiness (thấp hơn = dùng ít swap hơn)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Cài đặt Tối ưu Bộ nhớ

### Cấu hình VPS 4GB (Khuyến nghị)

Cấu hình Docker Compose mặc định được tối ưu cho VPS 4GB. Đây là ngân sách bộ nhớ:

| Dịch vụ | Giới hạn Bộ nhớ | Dự trữ | Ghi chú |
|---------|-----------------|--------|---------|
| PostgreSQL | 1GB | 512MB | Tiêu thụ lớn nhất |
| Backend | 640MB | 384MB | Node.js heap bị giới hạn |
| Frontend | 128MB | 64MB | Chỉ static files |
| Nginx | 128MB | 64MB | Reverse proxy |
| **Tổng** | ~1.9GB | ~1GB | |
| **Dự phòng** | ~2GB | | Cho OS, buffers, spikes |

### Cài đặt PostgreSQL (VPS 4GB)

```bash
# Áp dụng qua docker-compose.yml command
shared_buffers=512MB          # 12.5% của RAM
effective_cache_size=1536MB   # ~40% của RAM
maintenance_work_mem=128MB    # Cho VACUUM, CREATE INDEX
work_mem=16MB                 # Bộ nhớ per-operation
max_connections=50            # Giảm từ mặc định 100
wal_buffers=16MB
max_worker_processes=4
max_parallel_workers=4
max_parallel_workers_per_gather=2
```

### Cài đặt Node.js

```bash
# Áp dụng qua biến môi trường
NODE_OPTIONS="--max-old-space-size=512"
```

### Kiểm tra Sử dụng Bộ nhớ

```bash
# Giám sát thời gian thực
watch -n 5 'free -h && echo && docker stats --no-stream'

# Kiểm tra bộ nhớ container
docker stats
```

### Cấu hình VPS 3GB (Tối thiểu)

Nếu sử dụng VPS 3GB, giảm các cài đặt:

| Cài đặt | Giá trị 4GB | Giá trị 3GB |
|---------|-------------|-------------|
| PostgreSQL limit | 1GB | 768MB |
| shared_buffers | 512MB | 256MB |
| effective_cache_size | 1536MB | 512MB |
| maintenance_work_mem | 128MB | 64MB |
| Nginx limit | 128MB | 64MB |
| max_worker_processes | 4 | 3 |

Chỉnh sửa `docker-compose.yml` để áp dụng cài đặt 3GB nếu cần.

---

## Bước 4: Clone Repository

### 4.1 Clone MSM Car Booking

```bash
# Đi đến thư mục home
cd ~

# Clone repository
git clone https://github.com/YOUR_ORG/msm-car-booking.git

# Vào thư mục project
cd msm-car-booking
```

### 4.2 Tổng quan Cấu trúc Project

```
msm-car-booking/
├── backend/              # NestJS API (chúng ta triển khai cái này)
├── frontend/             # React app (triển khai lên Vercel)
├── database/             # Database init scripts
├── scripts/              # Deployment scripts
├── docker-compose.yml    # File compose chính
└── .env.example          # Template môi trường
```

---

## Bước 5: Cấu hình Môi trường

### 5.1 Tạo File Môi trường

```bash
# Copy file môi trường mẫu
cp .env.example .env

# Chỉnh sửa biến môi trường
nano .env
```

### 5.2 Cấu hình Cài đặt Production

Cập nhật file `.env` với giá trị của bạn:

```bash
# =============================================================================
# MSM Car Booking - Môi trường Production Backend
# =============================================================================

# Ứng dụng
NODE_ENV=production
BUILD_TARGET=production

# Ports
BACKEND_PORT=3001
DB_PORT=5432

# Cơ sở dữ liệu - THAY ĐỔI CÁC GIÁ TRỊ NÀY!
DB_USERNAME=postgres
DB_PASSWORD=MAT_KHAU_AN_TOAN_CUA_BAN   # Tạo: openssl rand -base64 32
DB_NAME=msm_car_booking
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT - THAY ĐỔI CÁI NÀY!
JWT_SECRET=KHOA_BI_MAT_TOI_THIEU_32_KY_TU  # Tạo: openssl rand -base64 48
JWT_EXPIRES_IN=7d

# API
API_PREFIX=api/v1

# CORS - URL frontend Vercel của bạn
CORS_ORIGIN=https://your-app.vercel.app
```

### 5.3 Tạo Mật khẩu An toàn

```bash
# Tạo mật khẩu database an toàn
openssl rand -base64 32

# Tạo JWT secret an toàn
openssl rand -base64 48
```

Copy các giá trị được tạo này vào file `.env` của bạn.

---

## Bước 6: Tạo Docker Compose Chỉ Backend

Tạo file mới cho triển khai chỉ backend:

```bash
nano docker-compose.backend.yml
```

Thêm nội dung này:

```yaml
version: '3.8'

services:
  # PostgreSQL 18 - Tối ưu cho VPS 4GB
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
      -c shared_buffers=512MB
      -c effective_cache_size=1536MB
      -c maintenance_work_mem=128MB
      -c work_mem=16MB
      -c max_connections=50
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c max_worker_processes=4
      -c max_parallel_workers=4
      -c max_parallel_workers_per_gather=2
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-msm_car_booking}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
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

## Bước 7: Triển khai Backend

### 7.1 Build và Khởi động Dịch vụ

```bash
# Build backend image
docker compose -f docker-compose.backend.yml build

# Khởi động dịch vụ
docker compose -f docker-compose.backend.yml up -d

# Kiểm tra trạng thái
docker compose -f docker-compose.backend.yml ps
```

### 7.2 Chạy Database Migrations

```bash
# Chạy migrations
docker compose -f docker-compose.backend.yml exec backend pnpm migration:run

# Seed dữ liệu ban đầu (tùy chọn)
docker compose -f docker-compose.backend.yml exec backend pnpm seed:run
```

### 7.3 Xác minh Backend Đang Chạy

```bash
# Kiểm tra health endpoint
curl http://localhost:3001/api/v1/health

# Kiểm tra logs
docker compose -f docker-compose.backend.yml logs -f backend
```

Output mong đợi:
```json
{"status":"ok"}
```

---

## Bước 8: Thiết lập HTTPS (Chọn Một Phương án)

### Phương án A: Cloudflare Tunnel (Nhanh, Không cần Tên miền)

Tốt nhất cho: Thiết lập nhanh, testing, không cần tên miền.

#### A.1 Cài đặt cloudflared

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

#### A.2 Khởi động Tunnel (Foreground)

```bash
cloudflared tunnel --url http://localhost:3001
```

Bạn sẽ thấy output như:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

#### A.3 Chạy như Background Service

```bash
nohup cloudflared tunnel --url http://localhost:3001 > /root/cloudflared.log 2>&1 &
```

Kiểm tra URL của bạn:
```bash
cat /root/cloudflared.log | grep trycloudflare
```

#### A.4 Tạo Systemd Service (Persistent)

**Phương pháp 1: Sử dụng nano (Khuyến nghị)**

```bash
nano /etc/systemd/system/cloudflared.service
```

Paste nội dung này:

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

Lưu với `Ctrl+X`, sau đó `Y`, rồi `Enter`.

**Phương pháp 2: Sử dụng heredoc**

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

#### A.5 Enable và Start Service

```bash
systemctl daemon-reload
```

```bash
systemctl enable cloudflared
```

```bash
systemctl start cloudflared
```

#### A.6 Xác minh và Lấy URL

Kiểm tra trạng thái:
```bash
systemctl status cloudflared
```

Lấy URL HTTPS của bạn:
```bash
journalctl -u cloudflared | grep trycloudflare
```

> **Lưu ý:** Quick tunnels tạo URL mới mỗi lần restart. Để có URL cố định, tạo tài khoản Cloudflare miễn phí và thiết lập [named tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/).

---

### Phương án B: Nginx + Let's Encrypt (Cần Tên miền)

Tốt nhất cho: Production, tên miền cố định.

#### B.1 Cài đặt Nginx

**Ubuntu/Debian:**
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

**Fedora/RHEL:**
```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

#### B.2 Cấu hình Nginx cho API

Tạo cấu hình Nginx:

**Ubuntu/Debian:**
```bash
sudo nano /etc/nginx/sites-available/msm-api
```

**Fedora/RHEL:**
```bash
sudo nano /etc/nginx/conf.d/msm-api.conf
```

Thêm nội dung này (thay `api.your-domain.com` bằng tên miền thực của bạn):

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

#### B.3 Enable Site (Chỉ Ubuntu/Debian)

```bash
sudo ln -s /etc/nginx/sites-available/msm-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### B.4 Lấy SSL Certificate

```bash
sudo certbot --nginx -d api.your-domain.com
```

Certbot sẽ:
1. Xác minh quyền sở hữu tên miền
2. Lấy certificate
3. Tự động cập nhật cấu hình Nginx
4. Thiết lập auto-renewal

#### B.5 Xác minh SSL

```bash
curl https://api.your-domain.com/api/v1/
```

---

## Bước 9: Cấu hình CORS cho Vercel Frontend

Cập nhật file `.env` với tên miền Vercel của bạn:

```bash
nano .env
```

Cập nhật CORS_ORIGIN:

```bash
# Một domain
CORS_ORIGIN=https://your-app.vercel.app

# Hoặc nhiều domains (phân cách bằng dấu phẩy)
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com
```

Khởi động lại backend:

```bash
docker compose -f docker-compose.backend.yml restart backend
```

---

## Bước 10: Thiết lập Vercel Frontend

Trên **máy local** của bạn, cấu hình frontend cho Vercel:

### 10.1 Tạo Biến Môi trường Vercel

Trong cài đặt project Vercel của bạn, thêm:

| Biến | Giá trị |
|------|---------|
| `VITE_API_URL` | `https://api.your-domain.com/api/v1` |
| `VITE_APP_NAME` | `MSM Car Booking` |

### 10.2 Triển khai lên Vercel

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Triển khai frontend
cd frontend
vercel --prod
```

---

## Bảo trì

### Lệnh Thường dùng

```bash
# Kiểm tra trạng thái
docker compose -f docker-compose.backend.yml ps

# Xem logs
docker compose -f docker-compose.backend.yml logs -f backend
docker compose -f docker-compose.backend.yml logs -f postgres

# Khởi động lại dịch vụ
docker compose -f docker-compose.backend.yml restart

# Dừng dịch vụ
docker compose -f docker-compose.backend.yml down

# Khởi động dịch vụ
docker compose -f docker-compose.backend.yml up -d
```

### Backup Cơ sở dữ liệu

```bash
# Tạo backup
docker compose -f docker-compose.backend.yml exec -T postgres \
  pg_dump -U postgres msm_car_booking > backup_$(date +%Y%m%d).sql

# Nén
gzip backup_$(date +%Y%m%d).sql
```

### Cập nhật Ứng dụng

```bash
# Pull code mới nhất
git pull origin main

# Rebuild và restart
docker compose -f docker-compose.backend.yml build backend
docker compose -f docker-compose.backend.yml up -d backend

# Chạy migrations mới nếu có
docker compose -f docker-compose.backend.yml exec backend pnpm migration:run
```

### Giám sát Tài nguyên

```bash
# Sử dụng tài nguyên Docker
docker stats

# Sử dụng bộ nhớ
free -h

# Sử dụng ổ đĩa
df -h
```

---

## Xử lý Sự cố

### Backend Không Khởi động

```bash
# Kiểm tra logs
docker compose -f docker-compose.backend.yml logs backend

# Kiểm tra port đang sử dụng
sudo lsof -i :3001
```

### Vấn đề Kết nối Cơ sở dữ liệu

```bash
# Kiểm tra trạng thái postgres
docker compose -f docker-compose.backend.yml ps postgres

# Kết nối trực tiếp đến database
docker exec -it msm_postgres psql -U postgres -d msm_car_booking
```

### Lỗi CORS từ Vercel

1. Kiểm tra `CORS_ORIGIN` trong `.env` khớp với URL Vercel của bạn
2. Khởi động lại backend sau thay đổi
3. Kiểm tra console trình duyệt để xem lỗi chính xác

### Gia hạn SSL Certificate

```bash
# Test gia hạn
sudo certbot renew --dry-run

# Buộc gia hạn
sudo certbot renew
```

---

## Checklist Bảo mật

- [ ] Đã đổi mật khẩu database mặc định
- [ ] Đã tạo JWT secret mạnh
- [ ] Đã cấu hình UFW firewall
- [ ] Sử dụng user không phải root để triển khai
- [ ] Đã bật xác thực SSH key
- [ ] Đã cấu hình SSL/TLS
- [ ] CORS được giới hạn đúng với domain Vercel
- [ ] Đã bật backup định kỳ

---

## Tham khảo Nhanh

| Tác vụ | Lệnh |
|--------|------|
| Khởi động | `docker compose -f docker-compose.backend.yml up -d` |
| Dừng | `docker compose -f docker-compose.backend.yml down` |
| Khởi động lại | `docker compose -f docker-compose.backend.yml restart` |
| Logs | `docker compose -f docker-compose.backend.yml logs -f` |
| Trạng thái | `docker compose -f docker-compose.backend.yml ps` |
| Rebuild | `docker compose -f docker-compose.backend.yml build` |

---

---

## Bước 11: Auto-Deploy với GitHub Actions

Thiết lập triển khai tự động khi bạn push đến nhánh `main`.

### 11.1 Tạo Deploy User (Thực hành Bảo mật Tốt nhất)

Không bao giờ sử dụng root cho triển khai tự động. Tạo user chuyên dụng.

#### Những gì Được Bảo toàn Khi Di chuyển Thư mục Project

| Thành phần | Trạng thái | Lý do |
|------------|------------|-------|
| Dữ liệu Database | An toàn | Lưu trong Docker volume, không phải thư mục project |
| Môi trường (.env) | An toàn | Di chuyển cùng project |
| Docker images | An toàn | Lưu trong Docker, không phải thư mục project |
| Cloudflared tunnel | An toàn | Kết nối đến localhost:3001 |
| Firewall rules | An toàn | Không liên quan đến vị trí project |

#### Các Bước Di chuyển (Root sang Deploy User)

```bash
# Với quyền root: Dừng containers trước
cd /root/msm-car-booking
docker compose -f docker-compose.backend.yml down

# Tạo deploy user
useradd -m -s /bin/bash deploy

# Thêm vào docker group
usermod -aG docker deploy

# Di chuyển project đến home của deploy user
mv /root/msm-car-booking /home/deploy/
chown -R deploy:deploy /home/deploy/msm-car-booking

# Chuyển sang deploy user và khởi động lại
su - deploy
cd ~/msm-car-booking
docker compose -f docker-compose.backend.yml up -d

# Xác minh
curl http://localhost:3001/api/v1/
```

### 11.2 Tạo SSH Key cho GitHub Actions

```bash
# Chuyển sang deploy user
su - deploy

# Tạo SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# Thêm vào authorized keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Hiển thị private key (copy cái này)
cat ~/.ssh/github_actions
```

### 11.3 Thêm GitHub Secrets

Đi đến: `https://github.com/YOUR_ORG/msm-car-booking/settings/secrets/actions`

Thêm các secrets này:

| Tên Secret | Giá trị |
|------------|---------|
| `VPS_HOST` | IP VPS của bạn (ví dụ: `14.225.222.12`) |
| `VPS_USERNAME` | `deploy` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | Private key từ bước 11.2 |

### 11.4 File Workflow

Workflow đã được tạo tại `.github/workflows/deploy-backend.yml`:

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

### 11.5 Cách Hoạt động

```
Push đến main → GitHub Actions trigger → SSH đến VPS → Pull & rebuild → Hoàn thành
     │                   │                    │              │
     └── backend/** ─────┘                    │              │
         chỉ thay đổi                         │              │
                                              └── deploy user (không phải root)
```

### 11.6 Test Triển khai

1. Thực hiện thay đổi nhỏ với bất kỳ file nào trong `backend/`
2. Commit và push đến `main`
3. Đi đến GitHub → tab Actions → Theo dõi triển khai
4. Xác minh trên VPS: `docker compose -f docker-compose.backend.yml ps`

---

**Bước Tiếp theo:**
- [Giám sát & Logging](./07-monitoring.md) - Thiết lập giám sát
- [Prometheus & Grafana](./09-prometheus-grafana.md) - Metrics nâng cao
