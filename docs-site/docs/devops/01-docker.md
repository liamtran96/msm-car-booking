---
id: 01-docker
title: Docker Basics
sidebar_position: 2
---

# Docker - Container Basics

**Difficulty:** Beginner
**Time to Learn:** 2-3 hours
**Prerequisites:** Basic command line knowledge

---

## What is Docker?

Docker is a platform that packages your application and all its dependencies into a **container**. Think of it like a shipping container - everything needed to run your app is inside, and it works the same everywhere.

### The Problem Docker Solves

**Without Docker:**
```
Developer: "It works on my machine!"
Operations: "But it doesn't work on the server!"
```

**With Docker:**
```
Same container runs everywhere:
- Your laptop (macOS/Windows/Linux)
- CI/CD server
- Staging server
- Production server
```

### Virtual Machines vs Containers

```
┌─────────────────────────────────────────────────────────────┐
│              Virtual Machines                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  App A  │  │  App B  │  │  App C  │                      │
│  ├─────────┤  ├─────────┤  ├─────────┤                      │
│  │Guest OS │  │Guest OS │  │Guest OS │  ← Full OS each      │
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
│  │  Libs   │  │  Libs   │  │  Libs   │  ← Only libs needed  │
│  └─────────┘  └─────────┘  └─────────┘    (Megabytes)       │
│  ┌─────────────────────────────────────┐                    │
│  │           Docker Engine              │                    │
│  └─────────────────────────────────────┘                    │
│  ┌─────────────────────────────────────┐                    │
│  │           Host OS                    │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

| Aspect | Virtual Machine | Container |
|--------|-----------------|-----------|
| Size | Gigabytes | Megabytes |
| Startup | Minutes | Seconds |
| Performance | Slower (hardware emulation) | Near-native |
| Isolation | Complete (separate OS) | Process-level |

---

## Key Concepts

### 1. Image

A **read-only template** containing instructions for creating a container.

```
Image = Your app code + Dependencies + Configuration
```

Think of it like a **recipe** - it describes what to build, but isn't the actual dish.

### 2. Container

A **running instance** of an image.

```
Container = Image + Runtime environment
```

Think of it like the **actual dish** made from the recipe. You can make multiple dishes from one recipe.

### 3. Dockerfile

A **text file** with instructions to build an image.

```dockerfile
FROM node:20-alpine      # Start with Node.js base image
WORKDIR /app             # Set working directory
COPY package.json .      # Copy package.json
RUN npm install          # Install dependencies
COPY . .                 # Copy source code
CMD ["npm", "start"]     # Command to run
```

### 4. Registry

A **storage** for Docker images.

- **Docker Hub** - Public registry (default)
- **GitLab Registry** - Private registry
- **AWS ECR** - Amazon's registry

### 5. Volume

**Persistent storage** that survives container restarts.

```
Container (temporary) ←→ Volume (permanent)
```

---

## Installing Docker

### macOS

```bash
# Using Homebrew
brew install --cask docker

# Start Docker Desktop from Applications folder
# Wait for Docker icon in menu bar to show "running"

# Verify installation
docker --version
# Docker version 24.0.7, build afdd53b
```

### Ubuntu / Debian

```bash
# 1. Update package index
sudo apt update

# 2. Install prerequisites
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) \
    signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Add your user to docker group (avoid sudo)
sudo usermod -aG docker $USER

# 7. Apply group changes (or logout/login)
newgrp docker

# 8. Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 9. Verify
docker --version
docker run hello-world
```

### Windows

1. Download Docker Desktop from https://docker.com/products/docker-desktop
2. Run the installer
3. Enable WSL 2 when prompted
4. Restart your computer
5. Open Docker Desktop
6. Wait for it to start (check system tray)

---

## Your First Container

### 🔧 Exercise 1: Run Hello World

```bash
# Run the hello-world image
docker run hello-world
```

**What happens:**
1. Docker looks for `hello-world` image locally
2. Doesn't find it, downloads from Docker Hub
3. Creates a container from the image
4. Runs the container (prints message)
5. Container exits

### 🔧 Exercise 2: Run Nginx Web Server

```bash
# Run nginx in detached mode (-d) with port mapping (-p)
docker run -d -p 8080:80 --name my-nginx nginx:alpine

# Open in browser
open http://localhost:8080

# See running containers
docker ps

# View logs
docker logs my-nginx

# Stop the container
docker stop my-nginx

# Remove the container
docker rm my-nginx
```

**Understanding the command:**

| Part | Meaning |
|------|---------|
| `docker run` | Create and start a container |
| `-d` | Detached mode (run in background) |
| `-p 8080:80` | Map host port 8080 to container port 80 |
| `--name my-nginx` | Name the container "my-nginx" |
| `nginx:alpine` | Use nginx image with alpine tag |

---

## Essential Docker Commands

### Image Commands

```bash
# List all images on your machine
docker images

# Pull an image from Docker Hub
docker pull node:20-alpine

# Build image from Dockerfile
docker build -t myapp:v1 .

# Build with custom Dockerfile path
docker build -f docker/Dockerfile -t myapp:v1 .

# Remove an image
docker rmi myapp:v1

# Remove unused images
docker image prune

# Remove ALL unused images
docker image prune -a
```

### Container Commands

```bash
# List running containers
docker ps

# List ALL containers (including stopped)
docker ps -a

# Create and start a container
docker run -d --name myapp myapp:v1

# Stop a container
docker stop myapp

# Start a stopped container
docker start myapp

# Restart a container
docker restart myapp

# Remove a container
docker rm myapp

# Force remove a running container
docker rm -f myapp

# Remove all stopped containers
docker container prune
```

### Logs and Debugging

```bash
# View container logs
docker logs myapp

# Follow logs in real-time (like tail -f)
docker logs -f myapp

# Show last 100 lines
docker logs --tail 100 myapp

# Show logs since a time
docker logs --since 1h myapp

# Execute command inside running container
docker exec -it myapp bash

# If bash not available, try sh
docker exec -it myapp sh

# Run a one-off command
docker exec myapp ls -la /app
```

### System Commands

```bash
# Show Docker disk usage
docker system df

# Clean up everything unused
docker system prune

# Clean up everything including volumes (⚠️ data loss!)
docker system prune -a --volumes

# Show Docker system info
docker info
```

---

## Understanding Dockerfile

A Dockerfile is a recipe for building an image. Let's break down each instruction.

### Basic Example

```dockerfile
# Use an existing image as base
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy files from host to container
COPY package.json .

# Run commands during build
RUN npm install

# Copy rest of the code
COPY . .

# Expose port (documentation only)
EXPOSE 3000

# Default command when container starts
CMD ["npm", "start"]
```

### Dockerfile Instructions Reference

| Instruction | Purpose | Example |
|-------------|---------|---------|
| `FROM` | Base image to start from | `FROM node:20-alpine` |
| `WORKDIR` | Set working directory | `WORKDIR /app` |
| `COPY` | Copy files from host | `COPY . .` |
| `ADD` | Copy files (supports URLs, tar extraction) | `ADD https://... /app/` |
| `RUN` | Execute command during build | `RUN npm install` |
| `ENV` | Set environment variable | `ENV NODE_ENV=production` |
| `EXPOSE` | Document which port app uses | `EXPOSE 3000` |
| `CMD` | Default command (can be overridden) | `CMD ["npm", "start"]` |
| `ENTRYPOINT` | Fixed command (harder to override) | `ENTRYPOINT ["node"]` |
| `USER` | Run as specific user | `USER nodejs` |
| `HEALTHCHECK` | Container health monitoring | See below |

### Multi-Stage Builds

Multi-stage builds create smaller production images by separating build and runtime.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production (smaller image)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --production  # Only production deps
COPY --from=builder /app/dist ./dist  # Copy built files
CMD ["node", "dist/main.js"]
```

**Benefits:**
- Build stage: Has all dev dependencies (large)
- Production stage: Only has what's needed (small)
- Final image doesn't include source code, dev dependencies, build tools

### Our API Dockerfile Explained

```dockerfile
# ===== STAGE 1: BUILDER =====
FROM node:20-alpine AS builder
# Use Node.js 20 on Alpine Linux (small ~50MB)
# "AS builder" names this stage for reference

WORKDIR /app
# All following commands run in /app directory

RUN npm install -g pnpm
# Install pnpm package manager globally

COPY package.json pnpm-lock.yaml* ./
# Copy only package files first (for caching)
# The * makes pnpm-lock.yaml optional

RUN pnpm install --frozen-lockfile
# Install exact versions from lockfile
# This layer is cached if package.json doesn't change

COPY . .
# Now copy all source code

RUN pnpm run build
# Compile TypeScript to JavaScript


# ===== STAGE 2: PRODUCTION =====
FROM node:20-alpine AS production
# Start fresh with clean image

WORKDIR /app

RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
# -g 1001: group ID
# -S: system group/user
# -u 1001: user ID

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile
# --prod: only production dependencies (smaller)

# Copy ONLY the built files from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs
# Container now runs as "nestjs" user, not root

EXPOSE 3333
# Document that app uses port 3333

# Health check - Docker monitors this
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3333}/api/health/live || exit 1
# Every 30s, check if app responds
# If fails 3 times, mark container as unhealthy

CMD ["node", "dist/main.js"]
# Start the application
```

---

## Working with Volumes

Volumes persist data outside the container lifecycle.

### Types of Mounts

```bash
# 1. Named Volume (Docker manages location)
docker run -v mydata:/app/data myapp

# 2. Bind Mount (you specify host path)
docker run -v $(pwd)/data:/app/data myapp

# 3. tmpfs Mount (in memory, lost on restart)
docker run --tmpfs /app/temp myapp
```

### 🔧 Exercise 3: Persist Data with Volumes

```bash
# Create a named volume
docker volume create mydata

# Run container with volume
docker run -d \
    --name postgres \
    -v mydata:/var/lib/postgresql/data \
    -e POSTGRES_PASSWORD=secret \
    postgres:15-alpine

# Add some data
docker exec -it postgres psql -U postgres -c "CREATE TABLE test (id int);"

# Stop and remove container
docker stop postgres
docker rm postgres

# Run new container with same volume
docker run -d \
    --name postgres-new \
    -v mydata:/var/lib/postgresql/data \
    -e POSTGRES_PASSWORD=secret \
    postgres:15-alpine

# Data is still there!
docker exec -it postgres-new psql -U postgres -c "\dt"
```

### Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect mydata

# Remove volume
docker volume rm mydata

# Remove unused volumes
docker volume prune
```

---

## Working with Networks

Docker networks allow containers to communicate.

### Network Types

| Type | Description | Use Case |
|------|-------------|----------|
| `bridge` | Default, isolated network | Development |
| `host` | Use host's network directly | Performance |
| `none` | No networking | Security |

### 🔧 Exercise 4: Container Networking

```bash
# Create a network
docker network create mynetwork

# Run containers on the network
docker run -d --name db --network mynetwork postgres:15-alpine -e POSTGRES_PASSWORD=secret
docker run -d --name app --network mynetwork myapp

# Containers can now reach each other by name
docker exec app ping db  # Works!

# Clean up
docker stop db app
docker rm db app
docker network rm mynetwork
```

### Network Commands

```bash
# List networks
docker network ls

# Create network
docker network create mynetwork

# Inspect network
docker network inspect mynetwork

# Connect container to network
docker network connect mynetwork mycontainer

# Disconnect container
docker network disconnect mynetwork mycontainer

# Remove network
docker network rm mynetwork
```

---

## Best Practices

### 1. Use Specific Tags

```dockerfile
# ❌ Bad - "latest" can change unexpectedly
FROM node:latest

# ✅ Good - specific version
FROM node:20-alpine
```

### 2. Minimize Layers

```dockerfile
# ❌ Bad - multiple RUN commands
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# ✅ Good - single RUN command
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Order Instructions by Change Frequency

```dockerfile
# ✅ Good - rarely changing instructions first
FROM node:20-alpine
WORKDIR /app

# Dependencies change less often than code
COPY package*.json ./
RUN npm install

# Code changes frequently - put last
COPY . .
```

### 4. Use .dockerignore

Create `.dockerignore` to exclude files from build context:

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

### 5. Run as Non-Root User

```dockerfile
# Create user
RUN adduser -D appuser

# Switch to user
USER appuser
```

### 6. Use Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs mycontainer

# Run interactively to see errors
docker run -it myapp:latest /bin/sh

# Check exit code
docker inspect mycontainer --format='{{.State.ExitCode}}'
```

### Common Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (normal exit) |
| 1 | General error |
| 137 | Killed (OOM or docker kill) |
| 139 | Segmentation fault |
| 143 | Terminated (SIGTERM) |

### Image Build Fails

```bash
# Build with no cache (fresh start)
docker build --no-cache -t myapp .

# Build with verbose output
docker build --progress=plain -t myapp .
```

### Out of Disk Space

```bash
# Check usage
docker system df

# Clean up
docker system prune -a
```

---

## Summary

| Concept | What It Is |
|---------|------------|
| **Image** | Template for containers (like a class) |
| **Container** | Running instance of image (like an object) |
| **Dockerfile** | Instructions to build an image |
| **Volume** | Persistent storage |
| **Network** | Container communication |

### Key Commands to Remember

```bash
docker build -t name .        # Build image
docker run -d -p 8080:80 name # Run container
docker ps                      # List containers
docker logs -f name           # View logs
docker exec -it name bash     # Shell access
docker stop name              # Stop container
docker rm name                # Remove container
docker system prune -a        # Clean up
```

---

**Next:** Learn [Docker Compose](./02-docker-compose.md) to run multiple containers together.
