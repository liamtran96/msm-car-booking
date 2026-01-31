---
id: 01-docker
title: Docker cơ bản
sidebar_position: 2
---

# Docker - Kiến thức cơ bản về Container

**Độ khó:** Người mới bắt đầu
**Thời gian học:** 2-3 giờ
**Yêu cầu:** Kiến thức cơ bản về dòng lệnh

---

## Docker là gì?

Docker là một nền tảng đóng gói ứng dụng và tất cả các dependency vào một **container**. Hãy nghĩ nó như một container vận chuyển - mọi thứ cần thiết để chạy ứng dụng đều nằm bên trong, và nó hoạt động giống nhau ở mọi nơi.

### Vấn đề mà Docker giải quyết

**Không có Docker:**
```
Developer: "Máy tôi chạy được!"
Operations: "Nhưng server không chạy được!"
```

**Với Docker:**
```
Cùng một container chạy ở mọi nơi:
- Laptop của bạn (macOS/Windows/Linux)
- CI/CD server
- Staging server
- Production server
```

### Máy ảo vs Container

```
┌─────────────────────────────────────────────────────────────┐
│              Máy ảo (Virtual Machines)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  App A  │  │  App B  │  │  App C  │                      │
│  ├─────────┤  ├─────────┤  ├─────────┤                      │
│  │Guest OS │  │Guest OS │  │Guest OS │  ← Mỗi cái một OS    │
│  └─────────┘  └─────────┘  └─────────┘    (Gigabytes)       │
│  ┌─────────────────────────────────────┐                    │
│  │           Hypervisor                 │                    │
│  └─────────────────────────────────────┘                    │
│  ┌─────────────────────────────────────┐                    │
│  │           Host OS                    │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Containers                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  App A  │  │  App B  │  │  App C  │                      │
│  ├─────────┤  ├─────────┤  ├─────────┤                      │
│  │  Libs   │  │  Libs   │  │  Libs   │  ← Chỉ thư viện cần  │
│  └─────────┘  └─────────┘  └─────────┘    (Megabytes)       │
│  ┌─────────────────────────────────────┐                    │
│  │           Docker Engine              │                    │
│  └─────────────────────────────────────┘                    │
│  ┌─────────────────────────────────────┐                    │
│  │           Host OS                    │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

| Khía cạnh | Máy ảo | Container |
|--------|-----------------|-----------|
| Kích thước | Gigabytes | Megabytes |
| Khởi động | Phút | Giây |
| Hiệu năng | Chậm hơn (giả lập phần cứng) | Gần như native |
| Cách ly | Hoàn toàn (OS riêng) | Cấp độ process |

---

## Các khái niệm chính

### 1. Image

Một **template chỉ đọc** chứa các hướng dẫn để tạo container.

```
Image = Code ứng dụng + Dependencies + Cấu hình
```

Hãy nghĩ nó như một **công thức nấu ăn** - nó mô tả cách làm, nhưng không phải món ăn thực sự.

### 2. Container

Một **instance đang chạy** của image.

```
Container = Image + Môi trường runtime
```

Hãy nghĩ nó như **món ăn thực sự** được làm từ công thức. Bạn có thể làm nhiều món từ một công thức.

### 3. Dockerfile

Một **file văn bản** với các hướng dẫn để build image.

```dockerfile
FROM node:20-alpine      # Bắt đầu với Node.js base image
WORKDIR /app             # Đặt thư mục làm việc
COPY package.json .      # Copy package.json
RUN npm install          # Cài đặt dependencies
COPY . .                 # Copy source code
CMD ["npm", "start"]     # Lệnh để chạy
```

### 4. Registry

**Kho lưu trữ** cho Docker images.

- **Docker Hub** - Registry công cộng (mặc định)
- **GitLab Registry** - Registry riêng tư
- **AWS ECR** - Registry của Amazon

### 5. Volume

**Bộ nhớ bền vững** tồn tại sau khi container khởi động lại.

```
Container (tạm thời) ←→ Volume (vĩnh viễn)
```

---

## Cài đặt Docker

### macOS

```bash
# Sử dụng Homebrew
brew install --cask docker

# Khởi động Docker Desktop từ thư mục Applications
# Đợi icon Docker trên menu bar hiện "running"

# Xác minh cài đặt
docker --version
# Docker version 24.0.7, build afdd53b
```

### Ubuntu / Debian

```bash
# 1. Cập nhật package index
sudo apt update

# 2. Cài đặt các gói yêu cầu
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Thêm GPG key của Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. Thêm Docker repository
echo "deb [arch=$(dpkg --print-architecture) \
    signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Cài đặt Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Thêm user vào docker group (tránh dùng sudo)
sudo usermod -aG docker $USER

# 7. Áp dụng thay đổi group (hoặc logout/login)
newgrp docker

# 8. Khởi động Docker
sudo systemctl enable docker
sudo systemctl start docker

# 9. Xác minh
docker --version
docker run hello-world
```

### Windows

1. Tải Docker Desktop từ https://docker.com/products/docker-desktop
2. Chạy trình cài đặt
3. Bật WSL 2 khi được hỏi
4. Khởi động lại máy tính
5. Mở Docker Desktop
6. Đợi nó khởi động (kiểm tra system tray)

---

## Container đầu tiên của bạn

### 🔧 Bài tập 1: Chạy Hello World

```bash
# Chạy hello-world image
docker run hello-world
```

**Điều xảy ra:**
1. Docker tìm `hello-world` image cục bộ
2. Không tìm thấy, tải từ Docker Hub
3. Tạo container từ image
4. Chạy container (in message)
5. Container thoát

### 🔧 Bài tập 2: Chạy Nginx Web Server

```bash
# Chạy nginx ở chế độ detached (-d) với port mapping (-p)
docker run -d -p 8080:80 --name my-nginx nginx:alpine

# Mở trong trình duyệt
open http://localhost:8080

# Xem các container đang chạy
docker ps

# Xem logs
docker logs my-nginx

# Dừng container
docker stop my-nginx

# Xóa container
docker rm my-nginx
```

**Hiểu về lệnh:**

| Phần | Ý nghĩa |
|------|---------|
| `docker run` | Tạo và khởi động container |
| `-d` | Chế độ detached (chạy nền) |
| `-p 8080:80` | Map port host 8080 tới container port 80 |
| `--name my-nginx` | Đặt tên container là "my-nginx" |
| `nginx:alpine` | Sử dụng nginx image với alpine tag |

---

## Các lệnh Docker thiết yếu

### Lệnh Image

```bash
# Liệt kê tất cả images trên máy
docker images

# Pull image từ Docker Hub
docker pull node:20-alpine

# Build image từ Dockerfile
docker build -t myapp:v1 .

# Build với đường dẫn Dockerfile tùy chỉnh
docker build -f docker/Dockerfile -t myapp:v1 .

# Xóa một image
docker rmi myapp:v1

# Xóa images không sử dụng
docker image prune

# Xóa TẤT CẢ images không sử dụng
docker image prune -a
```

### Lệnh Container

```bash
# Liệt kê containers đang chạy
docker ps

# Liệt kê TẤT CẢ containers (bao gồm đã dừng)
docker ps -a

# Tạo và khởi động container
docker run -d --name myapp myapp:v1

# Dừng container
docker stop myapp

# Khởi động container đã dừng
docker start myapp

# Khởi động lại container
docker restart myapp

# Xóa container
docker rm myapp

# Buộc xóa container đang chạy
docker rm -f myapp

# Xóa tất cả containers đã dừng
docker container prune
```

### Logs và Debug

```bash
# Xem logs container
docker logs myapp

# Theo dõi logs thời gian thực (như tail -f)
docker logs -f myapp

# Hiển thị 100 dòng cuối
docker logs --tail 100 myapp

# Hiển thị logs từ một thời điểm
docker logs --since 1h myapp

# Thực thi lệnh bên trong container đang chạy
docker exec -it myapp bash

# Nếu không có bash, thử sh
docker exec -it myapp sh

# Chạy một lệnh đơn lẻ
docker exec myapp ls -la /app
```

### Lệnh hệ thống

```bash
# Hiển thị disk usage của Docker
docker system df

# Dọn dẹp mọi thứ không sử dụng
docker system prune

# Dọn dẹp mọi thứ bao gồm volumes (⚠️ mất dữ liệu!)
docker system prune -a --volumes

# Hiển thị thông tin hệ thống Docker
docker info
```

---

## Hiểu về Dockerfile

Dockerfile là công thức để build image. Hãy phân tích từng instruction.

### Ví dụ cơ bản

```dockerfile
# Sử dụng image có sẵn làm base
FROM node:20-alpine

# Đặt thư mục làm việc bên trong container
WORKDIR /app

# Copy files từ host vào container
COPY package.json .

# Chạy lệnh trong quá trình build
RUN npm install

# Copy phần code còn lại
COPY . .

# Expose port (chỉ là tài liệu)
EXPOSE 3000

# Lệnh mặc định khi container khởi động
CMD ["npm", "start"]
```

### Tham khảo Dockerfile Instructions

| Instruction | Mục đích | Ví dụ |
|-------------|---------|---------|
| `FROM` | Image base để bắt đầu | `FROM node:20-alpine` |
| `WORKDIR` | Đặt thư mục làm việc | `WORKDIR /app` |
| `COPY` | Copy files từ host | `COPY . .` |
| `ADD` | Copy files (hỗ trợ URLs, giải nén tar) | `ADD https://... /app/` |
| `RUN` | Thực thi lệnh trong quá trình build | `RUN npm install` |
| `ENV` | Đặt biến môi trường | `ENV NODE_ENV=production` |
| `EXPOSE` | Ghi nhận port ứng dụng sử dụng | `EXPOSE 3000` |
| `CMD` | Lệnh mặc định (có thể override) | `CMD ["npm", "start"]` |
| `ENTRYPOINT` | Lệnh cố định (khó override hơn) | `ENTRYPOINT ["node"]` |
| `USER` | Chạy với user cụ thể | `USER nodejs` |
| `HEALTHCHECK` | Theo dõi sức khỏe container | Xem bên dưới |

### Multi-Stage Builds

Multi-stage builds tạo production images nhỏ hơn bằng cách tách biệt build và runtime.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production (image nhỏ hơn)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --production  # Chỉ production deps
COPY --from=builder /app/dist ./dist  # Copy built files
CMD ["node", "dist/main.js"]
```

**Lợi ích:**
- Build stage: Có tất cả dev dependencies (lớn)
- Production stage: Chỉ có những gì cần thiết (nhỏ)
- Image cuối không bao gồm source code, dev dependencies, build tools

### Dockerfile API của chúng ta - Giải thích

```dockerfile
# ===== STAGE 1: BUILDER =====
FROM node:20-alpine AS builder
# Sử dụng Node.js 20 trên Alpine Linux (nhỏ ~50MB)
# "AS builder" đặt tên stage này để tham chiếu

WORKDIR /app
# Tất cả lệnh tiếp theo chạy trong thư mục /app

RUN npm install -g pnpm
# Cài đặt pnpm package manager toàn cục

COPY package.json pnpm-lock.yaml* ./
# Copy chỉ package files trước (để caching)
# Dấu * làm cho pnpm-lock.yaml là tùy chọn

RUN pnpm install --frozen-lockfile
# Cài đặt chính xác các phiên bản từ lockfile
# Layer này được cache nếu package.json không thay đổi

COPY . .
# Bây giờ copy tất cả source code

RUN pnpm run build
# Compile TypeScript thành JavaScript


# ===== STAGE 2: PRODUCTION =====
FROM node:20-alpine AS production
# Bắt đầu mới với image sạch

WORKDIR /app

RUN npm install -g pnpm

# Tạo user không phải root để bảo mật
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
# -g 1001: group ID
# -S: system group/user
# -u 1001: user ID

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile
# --prod: chỉ production dependencies (nhỏ hơn)

# Copy CHỈ built files từ builder stage
COPY --from=builder /app/dist ./dist

# Thay đổi ownership cho user không phải root
RUN chown -R nestjs:nodejs /app

# Chuyển sang user không phải root
USER nestjs
# Container bây giờ chạy với user "nestjs", không phải root

EXPOSE 3333
# Ghi nhận rằng app sử dụng port 3333

# Health check - Docker giám sát cái này
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3333}/api/health/live || exit 1
# Mỗi 30s, kiểm tra nếu app phản hồi
# Nếu thất bại 3 lần, đánh dấu container là unhealthy

CMD ["node", "dist/main.js"]
# Khởi động ứng dụng
```

---

## Làm việc với Volumes

Volumes lưu trữ dữ liệu bền vững ngoài vòng đời container.

### Các loại Mount

```bash
# 1. Named Volume (Docker quản lý vị trí)
docker run -v mydata:/app/data myapp

# 2. Bind Mount (bạn chỉ định đường dẫn host)
docker run -v $(pwd)/data:/app/data myapp

# 3. tmpfs Mount (trong bộ nhớ, mất khi khởi động lại)
docker run --tmpfs /app/temp myapp
```

### 🔧 Bài tập 3: Lưu trữ dữ liệu với Volumes

```bash
# Tạo named volume
docker volume create mydata

# Chạy container với volume
docker run -d \
    --name postgres \
    -v mydata:/var/lib/postgresql/data \
    -e POSTGRES_PASSWORD=secret \
    postgres:15-alpine

# Thêm một số dữ liệu
docker exec -it postgres psql -U postgres -c "CREATE TABLE test (id int);"

# Dừng và xóa container
docker stop postgres
docker rm postgres

# Chạy container mới với cùng volume
docker run -d \
    --name postgres-new \
    -v mydata:/var/lib/postgresql/data \
    -e POSTGRES_PASSWORD=secret \
    postgres:15-alpine

# Dữ liệu vẫn còn đó!
docker exec -it postgres-new psql -U postgres -c "\dt"
```

### Lệnh Volume

```bash
# Liệt kê volumes
docker volume ls

# Kiểm tra volume
docker volume inspect mydata

# Xóa volume
docker volume rm mydata

# Xóa volumes không sử dụng
docker volume prune
```

---

## Làm việc với Networks

Docker networks cho phép containers giao tiếp với nhau.

### Các loại Network

| Loại | Mô tả | Trường hợp sử dụng |
|------|-------------|----------|
| `bridge` | Mặc định, network cách ly | Development |
| `host` | Sử dụng network của host trực tiếp | Hiệu năng |
| `none` | Không có networking | Bảo mật |

### 🔧 Bài tập 4: Container Networking

```bash
# Tạo network
docker network create mynetwork

# Chạy containers trên network
docker run -d --name db --network mynetwork postgres:15-alpine -e POSTGRES_PASSWORD=secret
docker run -d --name app --network mynetwork myapp

# Containers bây giờ có thể liên lạc với nhau bằng tên
docker exec app ping db  # Hoạt động!

# Dọn dẹp
docker stop db app
docker rm db app
docker network rm mynetwork
```

### Lệnh Network

```bash
# Liệt kê networks
docker network ls

# Tạo network
docker network create mynetwork

# Kiểm tra network
docker network inspect mynetwork

# Kết nối container vào network
docker network connect mynetwork mycontainer

# Ngắt kết nối container
docker network disconnect mynetwork mycontainer

# Xóa network
docker network rm mynetwork
```

---

## Best Practices

### 1. Sử dụng Tags cụ thể

```dockerfile
# ❌ Không tốt - "latest" có thể thay đổi bất ngờ
FROM node:latest

# ✅ Tốt - phiên bản cụ thể
FROM node:20-alpine
```

### 2. Giảm thiểu Layers

```dockerfile
# ❌ Không tốt - nhiều lệnh RUN
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# ✅ Tốt - một lệnh RUN duy nhất
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Sắp xếp Instructions theo tần suất thay đổi

```dockerfile
# ✅ Tốt - instructions ít thay đổi đặt trước
FROM node:20-alpine
WORKDIR /app

# Dependencies thay đổi ít thường xuyên hơn code
COPY package*.json ./
RUN npm install

# Code thay đổi thường xuyên - đặt cuối
COPY . .
```

### 4. Sử dụng .dockerignore

Tạo `.dockerignore` để loại trừ files khỏi build context:

```
# .dockerignore
node_modules
npm-debug.log
.git
.env
*.md
test
coverage
```

### 5. Chạy với User không phải Root

```dockerfile
# Tạo user
RUN adduser -D appuser

# Chuyển sang user
USER appuser
```

### 6. Sử dụng Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

---

## Khắc phục sự cố

### Container không khởi động

```bash
# Kiểm tra logs
docker logs mycontainer

# Chạy tương tác để xem lỗi
docker run -it myapp:latest /bin/sh

# Kiểm tra exit code
docker inspect mycontainer --format='{{.State.ExitCode}}'
```

### Exit Codes thường gặp

| Code | Ý nghĩa |
|------|---------|
| 0 | Thành công (thoát bình thường) |
| 1 | Lỗi chung |
| 137 | Bị kill (OOM hoặc docker kill) |
| 139 | Segmentation fault |
| 143 | Terminated (SIGTERM) |

### Build Image thất bại

```bash
# Build không có cache (bắt đầu mới)
docker build --no-cache -t myapp .

# Build với output chi tiết
docker build --progress=plain -t myapp .
```

### Hết dung lượng đĩa

```bash
# Kiểm tra usage
docker system df

# Dọn dẹp
docker system prune -a
```

---

## Tổng kết

| Khái niệm | Là gì |
|---------|------------|
| **Image** | Template cho containers (như một class) |
| **Container** | Instance đang chạy của image (như một object) |
| **Dockerfile** | Hướng dẫn để build image |
| **Volume** | Bộ nhớ bền vững |
| **Network** | Giao tiếp giữa containers |

### Các lệnh cần nhớ

```bash
docker build -t name .        # Build image
docker run -d -p 8080:80 name # Chạy container
docker ps                      # Liệt kê containers
docker logs -f name           # Xem logs
docker exec -it name bash     # Truy cập shell
docker stop name              # Dừng container
docker rm name                # Xóa container
docker system prune -a        # Dọn dẹp
```

---

**Tiếp theo:** Học [Docker Compose](./02-docker-compose.md) để chạy nhiều containers cùng nhau.
