---
id: 03-nginx
title: Nginx
sidebar_position: 4
---

# Nginx - Web Server & Reverse Proxy

**Độ khó:** Trung bình
**Thời gian học:** 2-3 giờ
**Yêu cầu:** [01-docker.md](./01-docker.md), [02-docker-compose.md](./02-docker-compose.md)

---

## Nginx là gì?

Nginx (phát âm "engine-x") là một web server hiệu năng cao cũng có thể hoạt động như reverse proxy, load balancer, và HTTP cache.

### Nginx làm gì trong dự án của chúng ta

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│                                                              │
│  1. Phục vụ React static files (HTML, JS, CSS)              │
│  2. Proxy /api requests đến NestJS backend                   │
│  3. Xử lý SSL/HTTPS termination                             │
│  4. Nén responses (gzip)                                     │
│  5. Cache static assets                                       │
│  6. Thêm security headers                                    │
└─────────────────────────────────────────────────────────────┘
```

### Tại sao sử dụng Nginx?

| Không có Nginx | Có Nginx |
|---------------|------------|
| Node.js phục vụ static files (chậm) | Nginx phục vụ static files (nhanh) |
| Mỗi service exposed trên port khác | Điểm vào duy nhất (port 80/443) |
| Không có SSL termination | Xử lý HTTPS |
| Không có compression | Gzip compression |
| Không có caching headers | Caching hiệu quả |

---

## Các khái niệm chính

| Khái niệm | Mô tả |
|---------|-------------|
| **Server Block** | Virtual host - xử lý requests cho một domain |
| **Location Block** | URL path matching và xử lý |
| **Upstream** | Backend server pool cho load balancing |
| **Proxy Pass** | Forward requests đến server khác |
| **Reverse Proxy** | Nginx đứng trước ứng dụng của bạn |

---

## Cài đặt Nginx

### Docker (Khuyến nghị cho Development)

```bash
docker run -d -p 8080:80 --name nginx nginx:alpine
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### macOS

```bash
brew install nginx
brew services start nginx
```

### Xác minh cài đặt

```bash
nginx -v
curl http://localhost
```

---

## Cấu hình Nginx

### Vị trí file

| OS | Config chính | Sites |
|----|-------------|-------|
| Ubuntu/Debian | `/etc/nginx/nginx.conf` | `/etc/nginx/sites-available/` |
| macOS (Homebrew) | `/opt/homebrew/etc/nginx/nginx.conf` | Cùng thư mục |
| Docker | `/etc/nginx/nginx.conf` | `/etc/nginx/conf.d/` |

### Server Block cơ bản

```nginx
server {
    listen 80;                           # Port để lắng nghe
    server_name example.com;             # Tên domain
    root /var/www/html;                  # Document root
    index index.html;                    # File mặc định

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Location Block

```nginx
# Exact match
location = /favicon.ico {
    log_not_found off;
}

# Prefix match
location /api {
    proxy_pass http://localhost:3333;
}

# Regex match
location ~* \.(jpg|jpeg|png|gif)$ {
    expires 30d;
}
```

---

## Cấu hình nginx.conf của dự án

```nginx
server {
    # ===== CÀI ĐẶT CƠ BẢN =====
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # ===== GZIP COMPRESSION =====
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    # ===== SPA ROUTING =====
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ===== API PROXY =====
    location /api {
        proxy_pass http://api:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # ===== STATIC ASSET CACHING =====
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ===== SECURITY HEADERS =====
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Các cấu hình phổ biến

### Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Load Balancer

```nginx
upstream api_servers {
    least_conn;
    server 192.168.1.10:3333 weight=3;
    server 192.168.1.11:3333 weight=2;
    server 192.168.1.12:3333 backup;
}

server {
    listen 80;
    location / {
        proxy_pass http://api_servers;
    }
}
```

### HTTPS với SSL

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

---

## Các lệnh Nginx

```bash
# Test cấu hình (LUÔN làm trước khi reload)
sudo nginx -t

# Reload cấu hình (không downtime)
sudo nginx -s reload

# Khởi động/Dừng/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx

# Xem logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## Khắc phục sự cố

### 502 Bad Gateway

**Nguyên nhân:** Backend server không phản hồi

```bash
# Kiểm tra backend có chạy không
curl http://localhost:3333

# Kiểm tra Nginx error log
tail -f /var/log/nginx/error.log
```

### 504 Gateway Timeout

**Nguyên nhân:** Backend mất quá lâu

```nginx
# Tăng timeouts
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

### 413 Request Entity Too Large

**Nguyên nhân:** Upload size vượt giới hạn

```nginx
client_max_body_size 100M;
```

---

## Tổng kết

| Khái niệm | Mục đích |
|---------|---------|
| **Server Block** | Cấu hình virtual host |
| **Location Block** | Xử lý URL path |
| **proxy_pass** | Forward requests đến backend |
| **try_files** | Thứ tự lookup file (cho SPA) |
| **upstream** | Backend server pool |

### Lệnh quan trọng

```bash
nginx -t              # Test config
nginx -s reload       # Reload config
systemctl status nginx  # Kiểm tra status
```

---

**Tiếp theo:** Học [Git Workflow](./04-git-workflow.md) để quản lý phiên bản hiệu quả.
