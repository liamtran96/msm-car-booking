# =============================================================================
# MSM Car Booking - Backend Dockerfile
# Optimized for 3GB VPS with multi-stage build
# NestJS 11.1.12 + Node.js 22 Alpine
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Development
# -----------------------------------------------------------------------------
FROM base AS development

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=development

# Expose port
EXPOSE 3001

# Run in development mode with hot reload
CMD ["pnpm", "start:dev"]

# -----------------------------------------------------------------------------
# Stage 4: Build
# -----------------------------------------------------------------------------
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Prune dev dependencies for production
RUN pnpm prune --prod

# -----------------------------------------------------------------------------
# Stage 5: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Add non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Run the application
CMD ["node", "dist/main.js"]
