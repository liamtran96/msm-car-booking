---
id: cheatsheet
title: DevOps Cheatsheet
sidebar_position: 11
---

# DevOps Cheatsheet

Quick reference for all DevOps commands used in xTMS.

---

## Docker

### Images

```bash
docker images                          # List images
docker pull image:tag                  # Download image
docker build -t name:tag .             # Build image
docker build -f path/Dockerfile -t name .  # Build with custom Dockerfile
docker rmi image:tag                   # Remove image
docker image prune -a                  # Remove unused images
```

### Containers

```bash
docker run -d --name app -p 8080:80 image   # Run container
docker ps                              # List running containers
docker ps -a                           # List all containers
docker stop container                  # Stop container
docker start container                 # Start container
docker restart container               # Restart container
docker rm container                    # Remove container
docker rm -f container                 # Force remove running container
```

### Logs & Debug

```bash
docker logs container                  # View logs
docker logs -f container               # Follow logs
docker logs --tail 100 container       # Last 100 lines
docker exec -it container bash         # Shell access
docker exec container command          # Run command
docker inspect container               # Container details
```

### System

```bash
docker stats                           # Resource usage
docker system df                       # Disk usage
docker system prune -a                 # Clean everything
docker system prune -a --volumes       # Clean including volumes
```

### Networks

```bash
docker network ls                      # List networks
docker network create name             # Create network
docker network inspect name            # Network details
docker network rm name                 # Remove network
```

### Volumes

```bash
docker volume ls                       # List volumes
docker volume create name              # Create volume
docker volume inspect name             # Volume details
docker volume rm name                  # Remove volume
docker volume prune                    # Remove unused volumes
```

---

## Docker Compose

### Basic Commands

```bash
docker compose up -d                   # Start all services
docker compose down                    # Stop all services
docker compose down -v                 # Stop and remove volumes
docker compose ps                      # List services
docker compose restart                 # Restart all
docker compose restart service         # Restart one service
```

### Logs

```bash
docker compose logs                    # All logs
docker compose logs -f                 # Follow logs
docker compose logs -f service         # Follow specific service
docker compose logs --tail 50          # Last 50 lines
```

### Build & Update

```bash
docker compose build                   # Build all images
docker compose build service           # Build specific service
docker compose build --no-cache        # Build without cache
docker compose pull                    # Pull latest images
docker compose up -d --build           # Rebuild and restart
```

### Execute

```bash
docker compose exec service bash       # Shell in service
docker compose exec service command    # Run command
docker compose run --rm service cmd    # Run one-off command
```

---

## Nginx

### Service Management

```bash
nginx -t                               # Test configuration
nginx -s reload                        # Reload config (no downtime)
systemctl start nginx                  # Start
systemctl stop nginx                   # Stop
systemctl restart nginx                # Restart
systemctl status nginx                 # Status
```

### Logs

```bash
tail -f /var/log/nginx/access.log      # Access logs
tail -f /var/log/nginx/error.log       # Error logs
```

### Common Config Patterns

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

## Git

### Daily Workflow

```bash
git status                             # Check status
git diff                               # View changes
git add .                              # Stage all changes
git add file                           # Stage specific file
git commit -m "message"                # Commit
git push                               # Push to remote
git pull                               # Pull from remote
```

### Branches

```bash
git branch                             # List branches
git branch name                        # Create branch
git checkout name                      # Switch branch
git checkout -b name                   # Create and switch
git merge branch                       # Merge branch
git branch -d name                     # Delete branch
```

### Undo

```bash
git restore file                       # Discard changes
git restore --staged file              # Unstage file
git reset --soft HEAD~1                # Undo commit, keep changes
git reset --hard HEAD~1                # Undo commit, lose changes
git revert commit                      # Revert specific commit
```

### History

```bash
git log --oneline                      # Compact history
git log --oneline --graph              # With graph
git show commit                        # Show commit details
git blame file                         # Who changed what
```

### Remote

```bash
git remote -v                          # List remotes
git fetch origin                       # Fetch without merge
git push -u origin branch              # Push new branch
git push origin --delete branch        # Delete remote branch
```

---

## Jenkins

### Local Jenkins (Docker)

```bash
# Start Jenkins
docker run -d --name jenkins \
  -p 9090:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get initial password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Stop/Start
docker stop jenkins
docker start jenkins

# View logs
docker logs -f jenkins
```

### Jenkinsfile Quick Reference

```groovy
pipeline {
    agent any

    environment {
        VAR = 'value'
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            when { branch 'main' }
            steps {
                sh 'npm run deploy'
            }
        }
    }

    post {
        always { cleanWs() }
        success { echo 'Success!' }
        failure { echo 'Failed!' }
    }
}
```

---

## SSL/Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## System Administration

### Service Management (systemd)

```bash
systemctl start service                # Start
systemctl stop service                 # Stop
systemctl restart service              # Restart
systemctl status service               # Status
systemctl enable service               # Enable on boot
systemctl disable service              # Disable on boot
```

### Firewall (UFW)

```bash
ufw status                             # Check status
ufw enable                             # Enable firewall
ufw allow 22                           # Allow SSH
ufw allow 80                           # Allow HTTP
ufw allow 443                          # Allow HTTPS
ufw deny 3306                          # Deny MySQL
```

### Process Management

```bash
ps aux                                 # List processes
top                                    # Interactive process viewer
htop                                   # Better top (if installed)
kill PID                               # Kill process
kill -9 PID                            # Force kill
lsof -i :8080                          # What's using port 8080
```

### Disk & Memory

```bash
df -h                                  # Disk usage
du -sh folder                          # Folder size
free -h                                # Memory usage
```

---

## Quick Recipes

### Deploy New Version

```bash
# Pull and restart
cd /opt/xtms
docker compose pull
docker compose up -d

# Verify
docker compose ps
docker compose logs -f --tail 50
```

### Database Backup

```bash
# Backup
docker compose exec -T postgres pg_dump -U postgres > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres < backup.sql
```

### View All Logs

```bash
# All services, last 5 minutes
docker compose logs --since 5m

# Filter errors
docker compose logs 2>&1 | grep -i error
```

### Clean Up Server

```bash
# Docker cleanup
docker system prune -af
docker volume prune -f

# Log cleanup
truncate -s 0 /var/log/*.log

# Old backups (keep last 7)
ls -t /opt/backups/*.sql | tail -n +8 | xargs rm -f
```

### Check Everything

```bash
# Status overview
docker compose ps
docker stats --no-stream
df -h
free -h
```

### Restart Everything

```bash
cd /opt/xtms
docker compose down
docker compose up -d
docker compose logs -f
```

---

## Environment Variables

### Docker

```bash
# Run with env vars
docker run -e VAR=value image

# From file
docker run --env-file .env image
```

### Docker Compose

```bash
# .env file (same directory as docker-compose.yml)
DB_PASSWORD=secret
API_KEY=xxx

# Use in compose
environment:
  DB_PASSWORD: ${DB_PASSWORD}
```

---

## Troubleshooting

### Container Won't Start

```bash
docker logs container                  # Check logs
docker inspect container               # Check config
docker run -it image /bin/sh           # Run interactively
```

### Port Already in Use

```bash
lsof -i :8080                          # Find process
kill -9 PID                            # Kill it
# Or use different port
```

### Out of Disk

```bash
docker system df                       # Check Docker usage
docker system prune -af                # Clean Docker
df -h                                  # Check disk
du -sh /* 2>/dev/null | sort -h        # Find large dirs
```

### Cannot Connect to Service

```bash
# Check if running
docker compose ps

# Check logs
docker compose logs service

# Test connectivity
docker compose exec service curl localhost:PORT

# Check network
docker network inspect xtms_default
```

---

## Prometheus & Grafana

### Starting the Stack

```bash
# Start monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Stop monitoring stack
docker compose -f docker-compose.monitoring.yml down

# View logs
docker compose -f docker-compose.monitoring.yml logs -f prometheus
```

### Prometheus Commands

```bash
# Check targets status
curl http://localhost:9090/api/v1/targets | jq

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=up'

# Reload config (without restart)
curl -X POST http://localhost:9090/-/reload

# Check alerts
curl http://localhost:9090/api/v1/alerts | jq

# Check config validity
curl http://localhost:9090/api/v1/status/config

# Check cardinality (for debugging high memory)
curl http://localhost:9090/api/v1/status/tsdb
```

### Common PromQL Queries

```promql
# Is service up?
up{job="api"}

# Request rate
sum(rate(http_requests_total[5m]))

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# 95th percentile latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Memory usage %
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# CPU usage %
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Disk usage %
(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100
```

### Grafana

```bash
# Access URLs
open http://localhost:9090    # Prometheus
open http://localhost:3001    # Grafana (admin/admin123)
open http://localhost:9093    # Alertmanager

# Import dashboard by ID
# In Grafana: Dashboards → Import → Enter ID → Load
# Popular IDs:
# 1860  - Node Exporter Full
# 893   - Docker monitoring
# 9628  - PostgreSQL
# 11835 - Redis
```

---

## Commit Message Format

```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructure
test: tests
chore: maintenance
```

Examples:
```bash
git commit -m "feat(auth): add JWT refresh token"
git commit -m "fix(api): handle null user gracefully"
git commit -m "docs: update deployment guide"
```
