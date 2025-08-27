# Restaurant Reservation System - Docker Commands

.PHONY: help start build logs stop clean shell seed test health urls

# Default target
help:
	@echo "Restaurant Reservation System - Docker Commands"
	@echo ""
	@echo "Basic Commands:"
	@echo "  make start        - Start the application"
	@echo "  make build        - Build and start the application"
	@echo "  make logs         - Show application logs"
	@echo "  make stop         - Stop the application"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean        - Clean up containers, images, and volumes"
	@echo "  make shell-be     - Open shell in backend container"
	@echo "  make shell-fe     - Open shell in frontend container"
	@echo "  make shell-db     - Open Couchbase query shell"
	@echo "  make seed         - Seed database with sample data
  make seed-employees - Seed only employees from JSON file"
	@echo "  make test         - Run tests in containers"
	@echo "  make health       - Check service health"
	@echo "  make urls         - Show service URLs"

# Application commands
start:
	docker-compose up -d

build:
	docker-compose up -d --build

logs:
	docker-compose logs -f

stop:
	docker-compose down

# Utility commands
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

shell-be:
	docker exec -it restaurant-backend sh

shell-fe:
	docker exec -it restaurant-frontend sh

shell-db:
	docker exec -it restaurant-couchbase /opt/couchbase/bin/cbq -u admin -p password123

seed:
	docker-compose exec backend npm run seed

seed-employees:
	docker-compose exec backend npm run seed:employees

test:
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:4000/health || echo "Backend: DOWN"
	@curl -f http://localhost:3000 || echo "Frontend: DOWN"
	@curl -f -u admin:password123 http://localhost:8091/pools/default || echo "Couchbase: DOWN"

# Show service URLs
urls:
	@echo "Service URLs:"
	@echo "Frontend:      http://localhost:3000"
	@echo "Backend API:   http://localhost:4000"
	@echo "GraphQL:       http://localhost:4000/graphql"
	@echo "Health Check:  http://localhost:4000/health"
	@echo "Couchbase UI:  http://localhost:8091 (admin/password123)"