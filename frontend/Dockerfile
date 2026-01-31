# =============================================================================
# MSM Car Booking - Frontend Dockerfile
# Optimized for 3GB VPS with multi-stage build
# React 19 + Vite + Nginx Alpine
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Development
# -----------------------------------------------------------------------------
FROM base AS development

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments for environment
ARG VITE_API_URL=/api/v1
ARG VITE_APP_NAME="MSM Car Booking"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 5: Production (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Add non-root user capability
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
