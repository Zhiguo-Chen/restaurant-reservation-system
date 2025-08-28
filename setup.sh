#!/bin/bash

# Restaurant Reservation System - Setup Script
# This script ensures a complete setup for new developers

set -e  # Exit on any error

echo "🍽️  Restaurant Reservation System - Setup"
echo "========================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build and start services
echo ""
echo "🚀 Building and starting services..."
make build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready (this may take 2-3 minutes)..."
sleep 30

# Check health multiple times
for i in {1..10}; do
    echo "Health check attempt $i/10..."
    if make health > /dev/null 2>&1; then
        echo "✅ All services are healthy!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  Some services may still be starting. Check with 'make health'"
    else
        sleep 30
    fi
done

# Seed database
echo ""
echo "🌱 Seeding database with sample data..."
make seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:4000"
echo "  • GraphQL Playground: http://localhost:4000/graphql"
echo "  • Database Admin: http://localhost:8091 (admin/password123)"
echo ""
echo "👤 Test accounts:"
echo "  • Admin: admin / admin123"
echo "  • Manager: manager / manager123"
echo "  • Staff: staff1 / staff123"
echo ""
echo "🔧 Useful commands:"
echo "  • make logs    - View logs"
echo "  • make health  - Check service health"
echo "  • make stop    - Stop services"
echo "  • make help    - Show all commands"