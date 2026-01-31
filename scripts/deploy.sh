#!/bin/bash
# =============================================================================
# MSM Car Booking - Deployment Script
# Optimized for 3GB VPS
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found. Copy .env.example to .env and configure it."
        exit 1
    fi

    log_info "All requirements met"
}

setup_swap() {
    log_info "Checking swap space..."

    SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')

    if [ "$SWAP_SIZE" -lt 1024 ]; then
        log_warn "Swap is less than 1GB. Consider adding swap for stability."
        echo ""
        echo "To add 2GB swap, run these commands:"
        echo "  sudo fallocate -l 2G /swapfile"
        echo "  sudo chmod 600 /swapfile"
        echo "  sudo mkswap /swapfile"
        echo "  sudo swapon /swapfile"
        echo "  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab"
        echo ""
    else
        log_info "Swap space: ${SWAP_SIZE}MB"
    fi
}

build_images() {
    log_info "Building Docker images..."

    docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE build --no-cache

    log_info "Images built successfully"
}

start_services() {
    log_info "Starting services..."

    docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE up -d

    log_info "Services started"
}

stop_services() {
    log_info "Stopping services..."

    docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE down

    log_info "Services stopped"
}

restart_services() {
    log_info "Restarting services..."

    docker compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE restart

    log_info "Services restarted"
}

show_status() {
    log_info "Service status:"
    docker compose -f $COMPOSE_FILE ps

    echo ""
    log_info "Resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

show_logs() {
    SERVICE=${1:-}

    if [ -z "$SERVICE" ]; then
        docker compose -f $COMPOSE_FILE logs -f --tail=100
    else
        docker compose -f $COMPOSE_FILE logs -f --tail=100 $SERVICE
    fi
}

run_migrations() {
    log_info "Running database migrations..."

    docker compose -f $COMPOSE_FILE exec backend pnpm migration:run

    log_info "Migrations completed"
}

backup_database() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/msm_backup_${TIMESTAMP}.sql"

    mkdir -p $BACKUP_DIR

    log_info "Creating database backup..."

    docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U postgres msm_car_booking > $BACKUP_FILE

    # Compress the backup
    gzip $BACKUP_FILE

    log_info "Backup created: ${BACKUP_FILE}.gz"
}

cleanup() {
    log_info "Cleaning up Docker resources..."

    docker system prune -f
    docker volume prune -f

    log_info "Cleanup completed"
}

# Main
case "${1:-}" in
    start)
        check_requirements
        setup_swap
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        check_requirements
        build_images
        ;;
    deploy)
        check_requirements
        setup_swap
        build_images
        stop_services
        start_services
        run_migrations
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs ${2:-}
        ;;
    migrate)
        run_migrations
        ;;
    backup)
        backup_database
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "MSM Car Booking - Deployment Script"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  build     - Build Docker images"
        echo "  deploy    - Full deployment (build + start + migrate)"
        echo "  status    - Show service status and resource usage"
        echo "  logs      - Show logs (optionally specify service: logs backend)"
        echo "  migrate   - Run database migrations"
        echo "  backup    - Backup database"
        echo "  cleanup   - Clean up Docker resources"
        echo ""
        exit 1
        ;;
esac

exit 0
