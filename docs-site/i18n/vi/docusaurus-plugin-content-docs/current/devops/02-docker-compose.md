---
id: 02-docker-compose
title: Docker Compose
sidebar_position: 3
---

# Docker Compose - Ứng dụng Multi-Container

**Độ khó:** Người mới bắt đầu
**Thời gian học:** 1-2 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md)

---

## Docker Compose là gì?

Docker Compose là công cụ để định nghĩa và chạy **multi-container** Docker applications. Thay vì chạy nhiều lệnh `docker run`, bạn định nghĩa mọi thứ trong một file YAML.

### Vấn đề mà nó giải quyết

**Không có Docker Compose:**
```bash
# Khởi động database
docker run -d --name db \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  --network mynet \
  postgres:15-alpine

# Khởi động Redis
docker run -d --name redis \
  --network mynet \
  redis:7-alpine

# Khởi động API
docker run -d --name api \
  -e DATABASE_URL=postgres://... \
  -p 3333:3333 \
  --network mynet \
  myapi:latest
```

**Với Docker Compose:**
```bash
docker compose up -d
```

Một lệnh khởi động mọi thứ!

---

## Các khái niệm chính

| Khái niệm | Mô tả |
|---------|-------------|
| **Service** | Cấu hình container (image, ports, volumes, v.v.) |
| **Network** | Mạng ảo kết nối các services |
| **Volume** | Lưu trữ bền vững được đặt tên |
| **Project** | Tất cả services định nghĩa trong compose file |

---

## Cài đặt Docker Compose

Docker Compose đi kèm với Docker Desktop (macOS/Windows).

Cho Linux:
```bash
# Đã được cài với docker-ce-cli
docker compose version

# Nếu chưa cài
sudo apt install docker-compose-plugin
```

💡 **Lưu ý:** Sử dụng `docker compose` (có dấu cách) không phải `docker-compose` (có gạch ngang). Phiên bản gạch ngang đã cũ.

---

## File docker-compose.yml đầu tiên

### Bài tập 1: Web Server đơn giản

Tạo file tên `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

Chạy:
```bash
docker compose up -d
open http://localhost:8080
docker compose down
```

---

## Các lệnh Docker Compose

### Lệnh cơ bản

```bash
docker compose up              # Khởi động (foreground)
docker compose up -d           # Khởi động (background)
docker compose down            # Dừng và xóa containers
docker compose down -v         # Dừng và xóa cả volumes
docker compose ps              # Liệt kê containers
docker compose logs            # Xem logs
docker compose logs -f         # Theo dõi logs
docker compose logs service    # Logs của service cụ thể
```

### Build và Pull

```bash
docker compose build           # Build tất cả images
docker compose build --no-cache # Build mà không cache
docker compose pull            # Pull images mới nhất
docker compose up -d --build   # Rebuild và khởi động
```

### Lệnh thực thi

```bash
docker compose exec api bash   # Shell trong container đang chạy
docker compose run --rm api npm test  # Chạy lệnh một lần
```

---

## Cấu trúc file docker-compose.yml

```yaml
version: '3.8'          # Phiên bản Compose file

services:               # Containers cần chạy
  api:
    image: node:20      # Image để sử dụng
    build: ./api        # Hoặc build từ Dockerfile
    ports:
      - "3333:3333"     # host:container
    environment:
      - NODE_ENV=production
    env_file:
      - .env            # Biến từ file
    volumes:
      - ./data:/app/data
    depends_on:
      - db              # Khởi động sau db
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:               # Named volume

networks:
  app-network:          # Custom network
```

---

## Ví dụ docker-compose.yml của chúng ta

```yaml
services:
  # Database PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: MSM-CAR-BOOKING
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis cho caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # API NestJS
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3333:3333"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/MSM-CAR-BOOKING
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  # Frontend React
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

## Biến môi trường

### Sử dụng file .env

```bash
# .env
POSTGRES_PASSWORD=secret
API_PORT=3333
```

```yaml
# docker-compose.yml
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  api:
    ports:
      - "${API_PORT}:3333"
```

### Nhiều môi trường

```bash
# Development
docker compose up -d

# Production (với override file)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Tổng kết

### Các lệnh quan trọng

```bash
docker compose up -d           # Khởi động tất cả
docker compose down            # Dừng tất cả
docker compose logs -f         # Xem logs
docker compose exec api bash   # Shell vào container
docker compose ps              # Liệt kê services
```

### Best Practices

1. Luôn sử dụng named volumes cho dữ liệu bền vững
2. Sử dụng health checks cho databases
3. Đặt depends_on với conditions
4. Sử dụng file .env cho secrets
5. Đặt restart policy phù hợp

---

**Tiếp theo:** Học [Nginx](./03-nginx.md) để cấu hình web server và reverse proxy.
