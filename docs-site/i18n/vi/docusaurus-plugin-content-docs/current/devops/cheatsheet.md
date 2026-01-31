---
id: cheatsheet
title: Cheatsheet DevOps
sidebar_position: 11
---

# DevOps Cheatsheet

Tham khảo nhanh tất cả các lệnh DevOps sử dụng trong MSM-CAR-BOOKING.

---

## Docker

### Images

```bash
docker images                          # Liệt kê images
docker pull image:tag                  # Tải image
docker build -t name:tag .             # Build image
docker rmi image:tag                   # Xóa image
docker image prune -a                  # Xóa images không sử dụng
```

### Containers

```bash
docker run -d --name app -p 8080:80 image   # Chạy container
docker ps                              # Liệt kê containers đang chạy
docker ps -a                           # Liệt kê tất cả containers
docker stop container                  # Dừng container
docker start container                 # Khởi động container
docker restart container               # Khởi động lại container
docker rm container                    # Xóa container
docker rm -f container                 # Buộc xóa container đang chạy
```

### Logs & Debug

```bash
docker logs container                  # Xem logs
docker logs -f container               # Theo dõi logs
docker logs --tail 100 container       # 100 dòng cuối
docker exec -it container bash         # Truy cập shell
docker exec container command          # Chạy lệnh
docker inspect container               # Chi tiết container
```

### Hệ thống

```bash
docker stats                           # Sử dụng resources
docker system df                       # Sử dụng disk
docker system prune -a                 # Dọn dẹp mọi thứ
docker system prune -a --volumes       # Dọn dẹp bao gồm volumes
```

---

## Docker Compose

### Lệnh cơ bản

```bash
docker compose up -d                   # Khởi động tất cả services
docker compose down                    # Dừng tất cả services
docker compose down -v                 # Dừng và xóa volumes
docker compose ps                      # Liệt kê services
docker compose restart                 # Khởi động lại tất cả
```

### Logs

```bash
docker compose logs                    # Tất cả logs
docker compose logs -f                 # Theo dõi logs
docker compose logs -f service         # Theo dõi service cụ thể
docker compose logs --tail 50          # 50 dòng cuối
```

### Build & Cập nhật

```bash
docker compose build                   # Build tất cả images
docker compose build --no-cache        # Build không cache
docker compose pull                    # Pull images mới nhất
docker compose up -d --build           # Rebuild và khởi động lại
```

---

## Git

### Workflow hàng ngày

```bash
git status                             # Kiểm tra status
git diff                               # Xem thay đổi
git add .                              # Stage tất cả thay đổi
git commit -m "message"                # Commit
git push                               # Push lên remote
git pull                               # Pull từ remote
```

### Branches

```bash
git branch                             # Liệt kê branches
git checkout -b name                   # Tạo và chuyển
git merge branch                       # Merge branch
git branch -d name                     # Xóa branch
```

### Hoàn tác

```bash
git restore file                       # Hủy thay đổi
git restore --staged file              # Unstage file
git reset --soft HEAD~1                # Hoàn tác commit, giữ thay đổi
git reset --hard HEAD~1                # Hoàn tác commit, mất thay đổi
git revert commit                      # Revert commit cụ thể
```

---

## Nginx

### Quản lý Service

```bash
nginx -t                               # Test cấu hình
nginx -s reload                        # Reload config (không downtime)
systemctl start nginx                  # Khởi động
systemctl stop nginx                   # Dừng
systemctl restart nginx                # Khởi động lại
systemctl status nginx                 # Status
```

### Patterns cấu hình phổ biến

```nginx
# Static files
location / {
    try_files $uri $uri/ /index.html;
}

# API proxy
location /api {
    proxy_pass http://localhost:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Cache static assets
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Công thức nhanh

### Deploy phiên bản mới

```bash
cd /opt/MSM-CAR-BOOKING
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f --tail 50
```

### Backup Database

```bash
# Backup
docker compose exec -T postgres pg_dump -U postgres > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres < backup.sql
```

### Dọn dẹp Server

```bash
docker system prune -af
docker volume prune -f
```

### Kiểm tra mọi thứ

```bash
docker compose ps
docker stats --no-stream
df -h
free -h
```

---

## Khắc phục sự cố

### Container không khởi động

```bash
docker logs container                  # Kiểm tra logs
docker inspect container               # Kiểm tra config
docker run -it image /bin/sh           # Chạy tương tác
```

### Port đã được sử dụng

```bash
lsof -i :8080                          # Tìm process
kill -9 PID                            # Kill nó
```

### Hết disk

```bash
docker system df                       # Kiểm tra Docker usage
docker system prune -af                # Dọn Docker
df -h                                  # Kiểm tra disk
```

---

## Định dạng Commit Message

```
type(scope): description

feat: feature mới
fix: sửa lỗi
docs: tài liệu
style: định dạng
refactor: tái cấu trúc code
test: tests
chore: bảo trì
```

Ví dụ:
```bash
git commit -m "feat(auth): add JWT refresh token"
git commit -m "fix(api): handle null user gracefully"
git commit -m "docs: update deployment guide"
```
