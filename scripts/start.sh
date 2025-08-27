#!/bin/bash

# Restaurant Reservation System - Start Script
# Quick start script for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Default environment
ENVIRONMENT="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -e, --env ENV    Environment to start (dev|prod) [default: dev]"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                Start development environment"
            echo "  $0 --env prod     Start production environment"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🍽️  Restaurant Reservation System"
echo "=================================="
echo ""

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, prod"
    exit 1
fi

print_info "Starting $ENVIRONMENT environment..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
print_info "Stopping existing containers..."
if [[ "$ENVIRONMENT" == "dev" ]]; then
    docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1 || true
    docker-compose down >/dev/null 2>&1 || true
else
    docker-compose down >/dev/null 2>&1 || true
    docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1 || true
fi

# Start the appropriate environment
if [[ "$ENVIRONMENT" == "dev" ]]; then
    print_info "Starting development environment with hot reload..."
    docker-compose -f docker-compose.dev.yml up -d --build
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10
    
    # Check service health
    print_info "Checking service health..."
    
    # Check MongoDB
    if docker exec restaurant-mongodb-dev mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
        print_status "MongoDB is ready"
    else
        print_warning "MongoDB is starting up..."
    fi
    
    # Check Backend
    for i in {1..30}; do
        if curl -f http://localhost:4000/health >/dev/null 2>&1; then
            print_status "Backend API is ready"
            break
        elif [[ $i -eq 30 ]]; then
            print_warning "Backend API is still starting up..."
        else
            sleep 2
        fi
    done
    
    # Check Frontend
    for i in {1..30}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_status "Frontend is ready"
            break
        elif [[ $i -eq 30 ]]; then
            print_warning "Frontend is still starting up..."
        else
            sleep 2
        fi
    done
    
else
    print_info "Starting production environment..."
    docker-compose up -d --build
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 15
    
    # Check service health
    print_info "Checking service health..."
    
    # Check MongoDB
    if docker exec restaurant-mongodb mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
        print_status "MongoDB is ready"
    else
        print_warning "MongoDB is starting up..."
    fi
    
    # Check Backend
    for i in {1..30}; do
        if curl -f http://localhost:4000/health >/dev/null 2>&1; then
            print_status "Backend API is ready"
            break
        elif [[ $i -eq 30 ]]; then
            print_warning "Backend API is still starting up..."
        else
            sleep 2
        fi
    done
    
    # Check Frontend
    for i in {1..30}; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            print_status "Frontend is ready"
            break
        elif [[ $i -eq 30 ]]; then
            print_warning "Frontend is still starting up..."
        else
            sleep 2
        fi
    done
fi

echo ""
print_status "Restaurant Reservation System is running!"
echo ""
echo "🌐 Service URLs:"
echo "   Frontend:      http://localhost:3000"
echo "   Backend API:   http://localhost:4000"
echo "   GraphQL:       http://localhost:4000/graphql"
echo "   Health Check:  http://localhost:4000/health"
echo "   Database UI:   http://localhost:8081"
echo ""
echo "🔐 Default Credentials:"
echo "   Admin:         admin / admin123"
echo "   Employee:      employee / employee123"
echo "   Database UI:   admin / admin123"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:     make ${ENVIRONMENT}-logs"
echo "   Stop system:   make ${ENVIRONMENT}-stop"
echo "   Open shell:    make shell-be | make shell-fe | make shell-db"
echo "   Health check:  make health"
echo ""
print_info "System is ready for use! 🎉"