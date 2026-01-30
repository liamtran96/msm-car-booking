---
id: 03-nginx
title: Nginx
sidebar_position: 4
---

# Nginx - Web Server & Reverse Proxy

**Difficulty:** Intermediate
**Time to Learn:** 2-3 hours
**Prerequisites:** [01-docker.md](./01-docker.md), [02-docker-compose.md](./02-docker-compose.md)

---

## What is Nginx?

Nginx (pronounced "engine-x") is a high-performance web server that can also act as a reverse proxy, load balancer, and HTTP cache.

### What Nginx Does in Our Project

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│                                                              │
│  1. Serve React static files (HTML, JS, CSS)                │
│  2. Proxy /api requests to NestJS backend                   │
│  3. Handle SSL/HTTPS termination                            │
│  4. Compress responses (gzip)                               │
│  5. Cache static assets                                      │
│  6. Add security headers                                     │
└─────────────────────────────────────────────────────────────┘
```

### Why Use Nginx?

| Without Nginx | With Nginx |
|---------------|------------|
| Node.js serves static files (slow) | Nginx serves static files (fast) |
| Each service exposed on different port | Single entry point (port 80/443) |
| No SSL termination | Handles HTTPS |
| No compression | Gzip compression |
| No caching headers | Efficient caching |

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Server Block** | Virtual host - handles requests for a domain |
| **Location Block** | URL path matching and handling |
| **Upstream** | Backend server pool for load balancing |
| **Proxy Pass** | Forward requests to another server |
| **Reverse Proxy** | Nginx sits in front of your app |

### Reverse Proxy Explained

```
                    ┌─────────────────────────┐
                    │       Internet          │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    Nginx (Port 443)     │
                    │    - SSL Termination    │
                    │    - Load Balancing     │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌────────▼────────┐
│   Web App (:80)   │ │   API (:3333)     │ │  API 2 (:3334)  │
│   (React/Vue)     │ │   (NestJS)        │ │  (NestJS)       │
└───────────────────┘ └───────────────────┘ └─────────────────┘
```

---

## Installing Nginx

### Docker (Recommended for Development)

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

### Verify Installation

```bash
# Check version
nginx -v

# Check if running
curl http://localhost
```

---

## Nginx Configuration Files

### File Locations

| OS | Main Config | Sites |
|----|-------------|-------|
| Ubuntu/Debian | `/etc/nginx/nginx.conf` | `/etc/nginx/sites-available/` |
| macOS (Homebrew) | `/opt/homebrew/etc/nginx/nginx.conf` | Same directory |
| Docker | `/etc/nginx/nginx.conf` | `/etc/nginx/conf.d/` |

### Configuration Structure

```
/etc/nginx/
├── nginx.conf              # Main config
├── conf.d/                 # Additional configs
│   └── default.conf        # Default site
├── sites-available/        # Available site configs
│   └── mysite.conf
├── sites-enabled/          # Enabled sites (symlinks)
│   └── mysite.conf -> ../sites-available/mysite.conf
├── mime.types              # File type mappings
└── modules-enabled/        # Loaded modules
```

---

## Configuration Basics

### Main Configuration Structure

```nginx
# /etc/nginx/nginx.conf

# Global settings
user nginx;
worker_processes auto;           # Number of worker processes
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

# Events settings
events {
    worker_connections 1024;     # Max connections per worker
    multi_accept on;
}

# HTTP settings
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Include site configs
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Server Block (Virtual Host)

```nginx
server {
    listen 80;                           # Port to listen on
    server_name example.com;             # Domain name(s)
    root /var/www/html;                  # Document root
    index index.html;                    # Default file

    # Logging
    access_log /var/log/nginx/example.access.log;
    error_log /var/log/nginx/example.error.log;

    # Location blocks
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Location Block

Location blocks handle requests matching specific paths:

```nginx
# Exact match
location = /favicon.ico {
    log_not_found off;
}

# Prefix match
location /api {
    proxy_pass http://localhost:3333;
}

# Regex match (case-sensitive)
location ~ \.php$ {
    # Handle PHP files
}

# Regex match (case-insensitive)
location ~* \.(jpg|jpeg|png|gif)$ {
    expires 30d;
}

# Priority order:
# 1. = (exact match)
# 2. ^~ (prefix, stops regex matching)
# 3. ~ or ~* (regex)
# 4. prefix (longest match)
```

---

## Our Project's nginx.conf Explained

```nginx
server {
    # ===== BASIC SETTINGS =====
    listen 80;                              # Listen on port 80
    server_name _;                          # Accept any hostname
    root /usr/share/nginx/html;             # Static files location
    index index.html;                       # Default file

    # ===== GZIP COMPRESSION =====
    gzip on;                                # Enable compression
    gzip_vary on;                           # Add Vary header
    gzip_min_length 1024;                   # Min size to compress
    gzip_proxied expired no-cache no-store private auth;
    gzip_types                              # File types to compress
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml
        application/javascript;

    # ===== SPA ROUTING =====
    # React Router support - if file doesn't exist, serve index.html
    location / {
        try_files $uri $uri/ /index.html;
        # 1. Try exact file ($uri)
        # 2. Try directory ($uri/)
        # 3. Fall back to index.html (React handles routing)
    }

    # ===== API PROXY =====
    # Forward /api requests to NestJS backend
    location /api {
        proxy_pass http://api:3333;         # Backend URL (Docker service name)
        proxy_http_version 1.1;             # Use HTTP/1.1
        proxy_set_header Upgrade $http_upgrade;    # WebSocket support
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;               # Original host
        proxy_set_header X-Real-IP $remote_addr;   # Client IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # HTTP or HTTPS
        proxy_cache_bypass $http_upgrade;
    }

    # ===== STATIC ASSET CACHING =====
    # Cache static files for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # Browser caches these files for 1 year
        # "immutable" = never revalidate
    }

    # ===== SECURITY HEADERS =====
    add_header X-Frame-Options "SAMEORIGIN" always;
    # Prevent clickjacking - only allow framing from same origin

    add_header X-Content-Type-Options "nosniff" always;
    # Prevent MIME type sniffing

    add_header X-XSS-Protection "1; mode=block" always;
    # Enable browser XSS filter
}
```

---

## Common Configurations

### 1. Static File Server

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;

    location / {
        autoindex on;              # Enable directory listing
        autoindex_exact_size off;  # Show human-readable sizes
    }

    # Cache all files for 30 days
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### 2. Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 3. Load Balancer

```nginx
upstream api_servers {
    least_conn;                            # Load balancing method
    server 192.168.1.10:3333 weight=3;    # Higher weight = more requests
    server 192.168.1.11:3333 weight=2;
    server 192.168.1.12:3333 backup;      # Only used if others fail
    keepalive 32;                          # Keep connections open
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Connection "";    # Required for keepalive
    }
}
```

### Load Balancing Methods

| Method | Description |
|--------|-------------|
| `round-robin` | Default, requests distributed evenly |
| `least_conn` | Send to server with fewest connections |
| `ip_hash` | Same client always goes to same server |
| `hash $key` | Hash-based distribution |

### 4. HTTPS with SSL

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;    # Redirect to HTTPS
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/html;
    index index.html;
}
```

### 5. WebSocket Proxy

```nginx
location /ws {
    proxy_pass http://localhost:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;              # Long timeout for WebSocket
}
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com -d www.example.com

# Auto-renewal (already set up by Certbot)
sudo certbot renew --dry-run

# Certificates are stored at:
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem
```

### SSL Configuration Best Practices

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;           # Modern protocols only
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

# Performance
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## Performance Optimization

### Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;                        # 1-9, higher = more compression
gzip_proxied any;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/x-javascript
    application/xml
    application/rss+xml
    application/atom+xml
    image/svg+xml;
```

### Caching

```nginx
# Static assets - cache for 1 year
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;                        # Don't log static file access
}

# HTML - don't cache (or short cache)
location ~* \.html$ {
    expires -1;                            # No cache
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

### Buffer Settings

```nginx
# Proxy buffer settings
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;

# Client body settings
client_max_body_size 10M;                  # Max upload size
client_body_buffer_size 128k;
```

---

## Security Hardening

### Security Headers

```nginx
# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

# HTTPS only
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Rate Limiting

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        # 10 requests/second with burst of 20
        proxy_pass http://api:3333;
    }
}
```

### Block Bad Bots

```nginx
# Block specific user agents
if ($http_user_agent ~* (bot|spider|crawler)) {
    return 403;
}

# Block specific IPs
deny 192.168.1.100;
deny 10.0.0.0/8;
allow all;
```

### Hide Nginx Version

```nginx
# In http block
server_tokens off;
```

---

## Nginx Commands

```bash
# Test configuration (ALWAYS do this before reload)
sudo nginx -t

# Reload configuration (no downtime)
sudo nginx -s reload

# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error log
sudo tail -f /var/log/nginx/error.log

# View access log
sudo tail -f /var/log/nginx/access.log

# Check which process is using port 80
sudo lsof -i :80
```

---

## 🔧 Hands-On Exercises

### Exercise 1: Basic Static Server

```bash
# Create test directory
mkdir -p /tmp/nginx-test
echo "<h1>Hello Nginx!</h1>" > /tmp/nginx-test/index.html

# Run Nginx container
docker run -d -p 8080:80 \
    -v /tmp/nginx-test:/usr/share/nginx/html:ro \
    --name nginx-test \
    nginx:alpine

# Test
curl http://localhost:8080

# Clean up
docker rm -f nginx-test
```

### Exercise 2: Reverse Proxy

Create `nginx.conf`:
```nginx
events {}

http {
    server {
        listen 80;

        location / {
            return 200 'Hello from Nginx!\n';
            add_header Content-Type text/plain;
        }

        location /api {
            proxy_pass http://host.docker.internal:3333;
        }
    }
}
```

Run:
```bash
docker run -d -p 8080:80 \
    -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
    --name nginx-proxy \
    nginx:alpine
```

### Exercise 3: SSL with Self-Signed Certificate

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /tmp/nginx-ssl/server.key \
    -out /tmp/nginx-ssl/server.crt \
    -subj "/CN=localhost"
```

Create `nginx-ssl.conf`:
```nginx
events {}

http {
    server {
        listen 443 ssl;
        ssl_certificate /etc/nginx/ssl/server.crt;
        ssl_certificate_key /etc/nginx/ssl/server.key;

        location / {
            return 200 'Hello from HTTPS!\n';
            add_header Content-Type text/plain;
        }
    }
}
```

Run:
```bash
docker run -d -p 443:443 \
    -v /tmp/nginx-ssl:/etc/nginx/ssl:ro \
    -v $(pwd)/nginx-ssl.conf:/etc/nginx/nginx.conf:ro \
    --name nginx-ssl \
    nginx:alpine

# Test (ignore certificate warning)
curl -k https://localhost
```

---

## Troubleshooting

### Configuration Errors

```bash
# Test config syntax
sudo nginx -t

# Common errors:
# - Missing semicolon at end of directive
# - Missing closing brace
# - Duplicate listen directives
```

### 502 Bad Gateway

**Cause:** Backend server not responding

```bash
# Check if backend is running
curl http://localhost:3333

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Check if proxy_pass URL is correct
# Use service name in Docker, localhost outside
```

### 504 Gateway Timeout

**Cause:** Backend taking too long

```nginx
# Increase timeouts
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

### 413 Request Entity Too Large

**Cause:** Upload size exceeds limit

```nginx
# Increase max body size
client_max_body_size 100M;
```

### Permission Denied

```bash
# Check file permissions
ls -la /var/www/html

# Nginx runs as 'nginx' or 'www-data' user
sudo chown -R nginx:nginx /var/www/html
```

---

## Summary

| Concept | Purpose |
|---------|---------|
| **Server Block** | Virtual host configuration |
| **Location Block** | URL path handling |
| **proxy_pass** | Forward requests to backend |
| **try_files** | File lookup order (for SPA) |
| **upstream** | Backend server pool |
| **ssl_certificate** | HTTPS certificate |

### Key Configuration Patterns

```nginx
# Static files
location / {
    try_files $uri $uri/ /index.html;
}

# API proxy
location /api {
    proxy_pass http://backend:3333;
}

# Asset caching
location ~* \.(js|css|png)$ {
    expires 1y;
}
```

### Key Commands

```bash
nginx -t              # Test config
nginx -s reload       # Reload config
systemctl status nginx  # Check status
tail -f /var/log/nginx/error.log  # View errors
```

---

**Next:** Learn [Git Workflow](./04-git-workflow.md) for version control best practices.
