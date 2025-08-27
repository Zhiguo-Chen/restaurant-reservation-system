#!/bin/bash

# Restaurant Reservation System - Monitoring Script
# Real-time monitoring of system health and performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}$1${NC}"
}

# Configuration
ENVIRONMENT="dev"
REFRESH_INTERVAL=5

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --prod)
            ENVIRONMENT="prod"
            shift
            ;;
        --interval)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --prod           Monitor production environment"
            echo "  --interval N     Refresh interval in seconds (default: 5)"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    Monitor development environment"
            echo "  $0 --prod            Monitor production environment"
            echo "  $0 --interval 10     Refresh every 10 seconds"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set container names based on environment
if [[ "$ENVIRONMENT" == "prod" ]]; then
    BACKEND_CONTAINER="restaurant-backend"
    FRONTEND_CONTAINER="restaurant-frontend"
    MONGODB_CONTAINER="restaurant-mongodb"
    REDIS_CONTAINER="restaurant-redis"
else
    BACKEND_CONTAINER="restaurant-backend-dev"
    FRONTEND_CONTAINER="restaurant-frontend-dev"
    MONGODB_CONTAINER="restaurant-mongodb-dev"
    REDIS_CONTAINER="restaurant-redis-dev"
fi

# Function to check container status
check_container() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name"; then
        local status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
        if [[ "$status" == "Up" ]]; then
            echo -e "${GREEN}●${NC} $service_name: Running"
        else
            echo -e "${YELLOW}●${NC} $service_name: $status"
        fi
    else
        echo -e "${RED}●${NC} $service_name: Stopped"
    fi
}

# Function to check service health
check_service_health() {
    local url=$1
    local service_name=$2
    
    if curl -f "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}●${NC} $service_name: Healthy"
    else
        echo -e "${RED}●${NC} $service_name: Unhealthy"
    fi
}

# Function to get container stats
get_container_stats() {
    local container_name=$1
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        docker stats "$container_name" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | tail -1
    else
        echo "N/A\tN/A\tN/A\tN/A"
    fi
}

# Function to get database stats
get_db_stats() {
    if docker ps --format "table {{.Names}}" | grep -q "$MONGODB_CONTAINER"; then
        local db_size=$(docker exec "$MONGODB_CONTAINER" mongosh \
            --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
            --eval "db.stats().dataSize" \
            --quiet 2>/dev/null | tail -1 || echo "0")
        
        local collections=$(docker exec "$MONGODB_CONTAINER" mongosh \
            --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
            --eval "db.getCollectionNames().length" \
            --quiet 2>/dev/null | tail -1 || echo "0")
        
        local reservations=$(docker exec "$MONGODB_CONTAINER" mongosh \
            --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
            --eval "db.reservations.countDocuments()" \
            --quiet 2>/dev/null | tail -1 || echo "0")
        
        local users=$(docker exec "$MONGODB_CONTAINER" mongosh \
            --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" \
            --eval "db.users.countDocuments()" \
            --quiet 2>/dev/null | tail -1 || echo "0")
        
        echo "$db_size|$collections|$reservations|$users"
    else
        echo "0|0|0|0"
    fi
}

# Function to display system info
display_system_info() {
    clear
    
    print_header "🍽️  Restaurant Reservation System - Monitor ($ENVIRONMENT)"
    print_header "=================================================="
    echo ""
    
    print_header "📊 System Status ($(date))"
    echo "----------------------------------------"
    
    # Container Status
    check_container "$BACKEND_CONTAINER" "Backend API"
    check_container "$FRONTEND_CONTAINER" "Frontend App"
    check_container "$MONGODB_CONTAINER" "MongoDB"
    check_container "$REDIS_CONTAINER" "Redis"
    
    echo ""
    
    # Service Health
    print_header "🏥 Service Health"
    echo "----------------------------------------"
    check_service_health "http://localhost:4000/health" "Backend API"
    check_service_health "http://localhost:3000" "Frontend App"
    
    # Database connectivity
    if docker exec "$MONGODB_CONTAINER" mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
        echo -e "${GREEN}●${NC} MongoDB: Connected"
    else
        echo -e "${RED}●${NC} MongoDB: Disconnected"
    fi
    
    echo ""
    
    # Resource Usage
    print_header "💻 Resource Usage"
    echo "----------------------------------------"
    printf "%-15s %-10s %-20s %-15s %-15s\n" "Service" "CPU" "Memory" "Network I/O" "Disk I/O"
    echo "--------------------------------------------------------------------------------"
    
    if docker ps --format "table {{.Names}}" | grep -q "$BACKEND_CONTAINER"; then
        local stats=$(get_container_stats "$BACKEND_CONTAINER")
        printf "%-15s %s\n" "Backend" "$stats" | tr '\t' ' '
    fi
    
    if docker ps --format "table {{.Names}}" | grep -q "$FRONTEND_CONTAINER"; then
        local stats=$(get_container_stats "$FRONTEND_CONTAINER")
        printf "%-15s %s\n" "Frontend" "$stats" | tr '\t' ' '
    fi
    
    if docker ps --format "table {{.Names}}" | grep -q "$MONGODB_CONTAINER"; then
        local stats=$(get_container_stats "$MONGODB_CONTAINER")
        printf "%-15s %s\n" "MongoDB" "$stats" | tr '\t' ' '
    fi
    
    if docker ps --format "table {{.Names}}" | grep -q "$REDIS_CONTAINER"; then
        local stats=$(get_container_stats "$REDIS_CONTAINER")
        printf "%-15s %s\n" "Redis" "$stats" | tr '\t' ' '
    fi
    
    echo ""
    
    # Database Statistics
    print_header "🗄️  Database Statistics"
    echo "----------------------------------------"
    local db_stats=$(get_db_stats)
    IFS='|' read -r db_size collections reservations users <<< "$db_stats"
    
    printf "%-20s %s\n" "Database Size:" "${db_size} bytes"
    printf "%-20s %s\n" "Collections:" "$collections"
    printf "%-20s %s\n" "Reservations:" "$reservations"
    printf "%-20s %s\n" "Users:" "$users"
    
    echo ""
    
    # Recent Logs (last 5 lines from backend)
    print_header "📝 Recent Backend Logs"
    echo "----------------------------------------"
    if docker ps --format "table {{.Names}}" | grep -q "$BACKEND_CONTAINER"; then
        docker logs "$BACKEND_CONTAINER" --tail 5 2>/dev/null | sed 's/^/  /' || echo "  No logs available"
    else
        echo "  Backend container not running"
    fi
    
    echo ""
    
    # Service URLs
    print_header "🌐 Service URLs"
    echo "----------------------------------------"
    echo "  Frontend:      http://localhost:3000"
    echo "  Backend API:   http://localhost:4000"
    echo "  GraphQL:       http://localhost:4000/graphql"
    echo "  Health Check:  http://localhost:4000/health"
    echo "  Database UI:   http://localhost:8081"
    
    echo ""
    print_info "Press Ctrl+C to exit | Refreshing every ${REFRESH_INTERVAL}s"
}

# Main monitoring loop
echo "Starting monitoring for $ENVIRONMENT environment..."
echo "Press Ctrl+C to exit"

# Trap Ctrl+C to exit gracefully
trap 'echo -e "\n\nMonitoring stopped."; exit 0' INT

while true; do
    display_system_info
    sleep "$REFRESH_INTERVAL"
done