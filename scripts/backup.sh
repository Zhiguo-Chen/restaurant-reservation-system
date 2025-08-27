#!/bin/bash

# Restaurant Reservation System - Backup Script
# Automated backup for MongoDB data and application files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="restaurant_backup_${TIMESTAMP}"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Default values
CONTAINER_NAME="restaurant-mongodb-dev"
COMPRESS=true
KEEP_DAYS=7

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --prod)
            CONTAINER_NAME="restaurant-mongodb"
            shift
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        --keep-days)
            KEEP_DAYS="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --prod           Backup production database"
            echo "  --no-compress    Don't compress backup files"
            echo "  --keep-days N    Keep backups for N days (default: 7)"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    Backup development database"
            echo "  $0 --prod            Backup production database"
            echo "  $0 --keep-days 30    Keep backups for 30 days"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🍽️  Restaurant Reservation System - Backup"
echo "=========================================="
echo ""

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    print_error "Container $CONTAINER_NAME is not running"
    echo "Please start the system first:"
    if [[ "$CONTAINER_NAME" == *"dev"* ]]; then
        echo "  make dev"
    else
        echo "  make prod"
    fi
    exit 1
fi

print_info "Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$FULL_BACKUP_PATH"

# Backup MongoDB
print_info "Backing up MongoDB database..."
docker exec "$CONTAINER_NAME" mongodump \
    --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
    --out="/tmp/backup_${TIMESTAMP}" \
    --quiet

# Copy backup from container
docker cp "$CONTAINER_NAME:/tmp/backup_${TIMESTAMP}" "$FULL_BACKUP_PATH/mongodb"

# Clean up temporary files in container
docker exec "$CONTAINER_NAME" rm -rf "/tmp/backup_${TIMESTAMP}"

print_status "MongoDB backup completed"

# Backup application configuration
print_info "Backing up application configuration..."
cp -r docker/ "$FULL_BACKUP_PATH/docker" 2>/dev/null || true
cp docker-compose*.yml "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp .env* "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp Makefile "$FULL_BACKUP_PATH/" 2>/dev/null || true

print_status "Configuration backup completed"

# Create backup metadata
cat > "$FULL_BACKUP_PATH/backup_info.txt" << EOF
Restaurant Reservation System Backup
====================================

Backup Date: $(date)
Backup Type: $(if [[ "$CONTAINER_NAME" == *"dev"* ]]; then echo "Development"; else echo "Production"; fi)
Container: $CONTAINER_NAME
Backup Size: $(du -sh "$FULL_BACKUP_PATH" | cut -f1)

Contents:
- MongoDB database dump
- Docker configuration
- Environment files
- Application configuration

Restore Instructions:
1. Stop the current system
2. Run: ./scripts/restore.sh --backup="$BACKUP_NAME"
3. Start the system

EOF

# Compress backup if requested
if [[ "$COMPRESS" == true ]]; then
    print_info "Compressing backup..."
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    FINAL_BACKUP="${BACKUP_NAME}.tar.gz"
    cd - >/dev/null
    print_status "Backup compressed to ${FINAL_BACKUP}"
else
    FINAL_BACKUP="$BACKUP_NAME"
fi

# Calculate backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${FINAL_BACKUP}" | cut -f1)

print_status "Backup completed successfully!"
echo ""
echo "📦 Backup Details:"
echo "   Name: $FINAL_BACKUP"
echo "   Size: $BACKUP_SIZE"
echo "   Path: ${BACKUP_DIR}/${FINAL_BACKUP}"
echo ""

# Clean up old backups
if [[ "$KEEP_DAYS" -gt 0 ]]; then
    print_info "Cleaning up backups older than $KEEP_DAYS days..."
    
    # Find and remove old backups
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "restaurant_backup_*" -type f -mtime +$KEEP_DAYS 2>/dev/null || true)
    OLD_DIRS=$(find "$BACKUP_DIR" -name "restaurant_backup_*" -type d -mtime +$KEEP_DAYS 2>/dev/null || true)
    
    if [[ -n "$OLD_BACKUPS" ]]; then
        echo "$OLD_BACKUPS" | xargs rm -f
        REMOVED_COUNT=$(echo "$OLD_BACKUPS" | wc -l)
        print_status "Removed $REMOVED_COUNT old backup files"
    fi
    
    if [[ -n "$OLD_DIRS" ]]; then
        echo "$OLD_DIRS" | xargs rm -rf
        REMOVED_DIR_COUNT=$(echo "$OLD_DIRS" | wc -l)
        print_status "Removed $REMOVED_DIR_COUNT old backup directories"
    fi
    
    if [[ -z "$OLD_BACKUPS" && -z "$OLD_DIRS" ]]; then
        print_info "No old backups to clean up"
    fi
fi

# List current backups
echo ""
echo "📋 Current Backups:"
ls -lh "$BACKUP_DIR"/restaurant_backup_* 2>/dev/null | awk '{print "   " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "   No backups found"

echo ""
print_info "Backup process completed! 🎉"