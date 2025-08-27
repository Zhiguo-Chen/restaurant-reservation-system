#!/bin/bash

# Restaurant Reservation System - Setup Script
# This script helps users set up the Docker environment

set -e

echo "🍽️  Restaurant Reservation System - Docker Setup"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker daemon is running"

# Check available ports
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use (needed for $service)"
        echo "   Please stop the service using this port or modify docker-compose.yml"
        return 1
    else
        echo "✅ Port $port is available for $service"
        return 0
    fi
}

echo ""
echo "🔍 Checking required ports..."

ports_ok=true
check_port 3000 "Frontend" || ports_ok=false
check_port 4000 "Backend" || ports_ok=false
check_port 27018 "MongoDB" || ports_ok=false
check_port 6379 "Redis" || ports_ok=false
check_port 8081 "Mongo Express" || ports_ok=false

if [ "$ports_ok" = false ]; then
    echo ""
    echo "❌ Some required ports are in use. Please resolve port conflicts before continuing."
    exit 1
fi

# Check available disk space (at least 2GB)
available_space=$(df . | tail -1 | awk '{print $4}')
required_space=2097152  # 2GB in KB

if [ "$available_space" -lt "$required_space" ]; then
    echo "⚠️  Warning: Less than 2GB disk space available"
    echo "   Available: $(($available_space / 1024 / 1024))GB"
    echo "   Recommended: 2GB+"
fi

echo ""
echo "🚀 Starting setup..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p docker/mongodb/init
mkdir -p logs
mkdir -p backup

# Set permissions
chmod +x scripts/*.sh

# Pull required Docker images
echo "📦 Pulling Docker images..."
docker-compose -f docker-compose.dev.yml pull

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "   1. Start development environment: make dev"
echo "   2. Open your browser: http://localhost:3000"
echo "   3. Check all services: make health"
echo ""
echo "📚 Useful commands:"
echo "   make help          - Show all available commands"
echo "   make dev-logs      - View development logs"
echo "   make shell-db      - Access MongoDB shell"
echo "   make urls          - Show all service URLs"
echo ""
echo "🔐 Default credentials:"
echo "   Admin user: admin / admin123"
echo "   Employee user: employee / employee123"
echo "   Database UI: admin / admin123"
echo ""
echo "Happy coding! 🎉"