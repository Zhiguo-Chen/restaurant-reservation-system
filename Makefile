# Restaurant Reservation System - Docker Commands

.PHONY: help dev prod build clean logs shell test

# Default target
help:
	@echo "Restaurant Reservation System - Docker Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment with hot reload"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-logs     - Show development logs"
	@echo "  make dev-stop     - Stop development environment"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production environment"
	@echo "  make prod-logs    - Show production logs"
	@echo "  make prod-stop    - Stop production environment"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean        - Clean up containers, images, and volumes"
	@echo "  make shell-be     - Open shell in backend container"
	@echo "  make shell-fe     - Open shell in frontend container"
	@echo "  make shell-db     - Open MongoDB shell"
	@echo "  make test         - Run tests in containers"
	@echo "  make backup-db    - Backup MongoDB data"
	@echo "  make restore-db   - Restore MongoDB data"

# Development environment
dev:
	docker-compose -f docker-compose.dev.yml up -d

dev-build:
	docker-compose -f docker-compose.dev.yml up -d --build

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop:
	docker-compose -f docker-compose.dev.yml down

# Production environment
prod:
	docker-compose up -d

prod-build:
	docker-compose up -d --build

prod-logs:
	docker-compose logs -f

prod-stop:
	docker-compose down

# Utility commands
clean:
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

shell-be:
	docker exec -it restaurant-backend-dev sh

shell-fe:
	docker exec -it restaurant-frontend-dev sh

shell-db:
	docker exec -it restaurant-mongodb-dev mongosh -u admin -p password123 --authenticationDatabase admin restaurant-reservations

test:
	docker-compose -f docker-compose.dev.yml exec backend npm test
	docker-compose -f docker-compose.dev.yml exec frontend npm test

backup-db:
	docker exec restaurant-mongodb-dev mongodump --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" --out=/tmp/backup
	docker cp restaurant-mongodb-dev:/tmp/backup ./backup-$(shell date +%Y%m%d-%H%M%S)

restore-db:
	@echo "Usage: make restore-db BACKUP_DIR=./backup-20231201-120000"
	@if [ -z "$(BACKUP_DIR)" ]; then echo "Please specify BACKUP_DIR"; exit 1; fi
	docker cp $(BACKUP_DIR) restaurant-mongodb-dev:/tmp/restore
	docker exec restaurant-mongodb-dev mongorestore --uri="mongodb://admin:password123@localhost:27017/restaurant-reservations?authSource=admin" /tmp/restore/restaurant-reservations

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:4000/health || echo "Backend: DOWN"
	@curl -f http://localhost:3000 || echo "Frontend: DOWN"
	@docker exec restaurant-mongodb-dev mongosh --eval "db.adminCommand('ping')" --quiet || echo "MongoDB: DOWN"

# Show service URLs
urls:
	@echo "Service URLs:"
	@echo "Frontend:      http://localhost:3000"
	@echo "Backend API:   http://localhost:4000"
	@echo "GraphQL:       http://localhost:4000/graphql"
	@echo "Health Check:  http://localhost:4000/health"
	@echo "Mongo Express: http://localhost:8081 (admin/admin123)"
	@echo "MongoDB:       mongodb://admin:password123@localhost:27017"