#!/bin/bash

# Restaurant Reservation System - Restore Script
# Restore MongoDB data and application files from backup

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
CONTAINER_NAME="restaurant-mongodb-dev"
BACKUP_NAME=""
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP_NAME="$2"
            shift 2
            ;;
        --prod)
            CONTAINER_NAME="restaurant-mongodb"
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 --backup=BACKUP_NAME [OPTIONS]"
            echo ""
            echo "Required:"
            echo "  --backup NAME    Name of backup to restore"
            echo ""
            echo "Options:"
            echo "  --prod           Restore to production database"
            echo "  --force          Skip confirmation prompts"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --backup=restaurant_backup_20231201_120000"
            echo "  $0 --backup=restaurant_backup_20231201_120000.tar.gz --prod"
            echo ""
            echo "Available backups:"
            ls -1 "$BACKUP_DIR"/restaurant_backup_* 2>/dev/null | sed 's|.*/||' | sed 's/^/  /' || echo "  No backups found"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$BACKUP_NAME" ]]; then
    print_error "Backup name is required"
    echo "Use --backup=BACKUP_NAME to specify which backup to restore"
    echo "Use --help to see available backups"
    exit 1
fi

echo "🍽️  Restaurant Reservation System - Restore"
echo "==========================================="
echo ""

# Check if backup exists
BACKUP_PATH=""
if [[ -f "${BACKUP_DIR}/${BACKUP_NAME}" ]]; then
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
elif [[ -d "${BACKUP_DIR}/${BACKUP_NAME}" ]]; then
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
elif [[ -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" ]]; then
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    BACKUP_NAME="${BACKUP_NAME}.tar.gz"
else
    print_error "Backup not found: $BACKUP_NAME"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/restaurant_backup_* 2>/dev/null | sed 's|.*/||' | sed 's/^/  /' || echo "  No backups found"
    exit 1
fi

print_info "Found backup: $BACKUP_PATH"

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

# Confirmation prompt
if [[ "$FORCE" != true ]]; then
    echo ""
    print_warning "This will REPLACE all current data in the database!"
    echo "Container: $CONTAINER_NAME"
    echo "Backup: $BACKUP_NAME"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
fi

# Create temporary directory for extraction
TEMP_DIR="/tmp/restaurant_restore_$$"
mkdir -p "$TEMP_DIR"

# Extract backup if compressed
if [[ "$BACKUP_NAME" == *.tar.gz ]]; then
    print_info "Extracting compressed backup..."
    tar -xzf "$BACKUP_PATH" -C "$TEMP_DIR"
    EXTRACTED_DIR=$(ls "$TEMP_DIR" | head -1)
    RESTORE_SOURCE="$TEMP_DIR/$EXTRACTED_DIR"
else
    RESTORE_SOURCE="$BACKUP_PATH"
fi

# Check backup structure
if [[ ! -d "$RESTORE_SOURCE/mongodb" ]]; then
    print_error "Invalid backup structure: mongodb directory not found"
    rm -rf "$TEMP_DIR"
    exit 1
fi

print_info "Starting restore process..."

# Stop application containers to prevent data corruption
print_info "Stopping application containers..."
if [[ "$CONTAINER_NAME" == *"dev"* ]]; then
    docker-compose -f docker-compose.dev.yml stop backend frontend 2>/dev/null || true
else
    docker-compose stop backend frontend 2>/dev/null || true
fi

# Drop existing database
print_info "Dropping existing database..."
docker exec "$CONTAINER_NAME" mongosh \
    --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
    --eval "db.dropDatabase()" \
    --quiet

# Copy backup to container
print_info "Copying backup to container..."
docker cp "$RESTORE_SOURCE/mongodb/restaurant-reservations" "$CONTAINER_NAME:/tmp/restore_data"

# Restore database
print_info "Restoring MongoDB database..."
docker exec "$CONTAINER_NAME" mongorestore \
    --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
    /tmp/restore_data \
    --quiet

# Clean up temporary files in container
docker exec "$CONTAINER_NAME" rm -rf /tmp/restore_data

print_status "Database restore completed"

# Restore configuration files if they exist
if [[ -d "$RESTORE_SOURCE/docker" ]]; then
    print_info "Restoring configuration files..."
    cp -r "$RESTORE_SOURCE/docker"/* docker/ 2>/dev/null || true
    cp "$RESTORE_SOURCE"/docker-compose*.yml . 2>/dev/null || true
    print_status "Configuration files restored"
fi

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# Restart application containers
print_info "Restarting application containers..."
if [[ "$CONTAINER_NAME" == *"dev"* ]]; then
    docker-compose -f docker-compose.dev.yml start backend frontend
else
    docker-compose start backend frontend
fi

# Wait for services to be ready
print_info "Waiting for services to restart..."
sleep 10

# Verify restore
print_info "Verifying restore..."

# Check database connection
if docker exec "$CONTAINER_NAME" mongosh \
    --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
    --eval "db.stats()" \
    --quiet >/dev/null 2>&1; then
    print_status "Database connection verified"
else
    print_error "Database connection failed"
    exit 1
fi

# Check collections
COLLECTIONS=$(docker exec "$CONTAINER_NAME" mongosh \
    --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
    --eval "db.getCollectionNames()" \
    --quiet 2>/dev/null | grep -o '\[.*\]' || echo "[]")

if [[ "$COLLECTIONS" != "[]" ]]; then
    print_status "Database collections restored: $COLLECTIONS"
else
    print_warning "No collections found in restored database"
fi

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:4000/health >/dev/null 2>&1; then
        print_status "Backend API is responding"
        break
    elif [[ $i -eq 30 ]]; then
        print_warning "Backend API is not responding yet"
    else
        sleep 2
    fi
done

print_status "Restore completed successfully!"
echo ""
echo "📊 Restore Summary:"
echo "   Backup: $BACKUP_NAME"
echo "   Target: $CONTAINER_NAME"
echo "   Collections: $COLLECTIONS"
echo ""
echo "🌐 Service URLs:"
echo "   Frontend:      http://localhost:3000"
echo "   Backend API:   http://localhost:4000"
echo "   GraphQL:       http://localhost:4000/graphql"
echo "   Database UI:   http://localhost:8081"
echo ""
print_info "System is ready for use! 🎉"