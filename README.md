# 🍽️ Restaurant Reservation System

A modern, full-stack restaurant reservation system built with Node.js, React/SolidJS, MongoDB, and GraphQL. Features a complete Docker setup for easy deployment and development.

## ✨ Features

### For Customers

- 🎯 **No Registration Required** - Quick and easy reservations
- 📱 **Responsive Design** - Works on all devices
- 🔍 **Reservation Management** - Find and manage reservations by email
- ⏰ **Real-time Availability** - Instant booking confirmation
- 📧 **Email Notifications** - Automatic confirmation and updates

### For Restaurant Staff

- 👥 **Employee Dashboard** - Comprehensive reservation management
- 📊 **Real-time Analytics** - Booking trends and statistics
- 🔐 **Role-based Access** - Employee and Admin roles
- 📋 **Reservation Status** - Approve, modify, or cancel bookings
- 🎯 **Business Rules** - Automatic validation and conflict detection

### Technical Features

- 🚀 **GraphQL API** - Efficient data fetching
- 🔒 **JWT Authentication** - Secure employee access
- 📦 **Docker Ready** - One-click deployment
- 🗄️ **MongoDB** - Scalable document database
- ⚡ **Redis Caching** - High performance
- 🔍 **Health Monitoring** - System status tracking

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 2GB+ disk space

### One-Click Setup

```bash
# Clone the repository
git clone <repository-url>
cd restaurant-reservation-system

# Run setup script
./scripts/setup.sh

# Start development environment
./scripts/start.sh

# Or use make commands
make dev
```

### Access the System

| Service                   | URL                           | Credentials                     |
| ------------------------- | ----------------------------- | ------------------------------- |
| 🌐 **Frontend**           | http://localhost:3000         | No login required for customers |
| 🔧 **Backend API**        | http://localhost:4000         | -                               |
| 📊 **GraphQL Playground** | http://localhost:4000/graphql | -                               |
| 🗄️ **Database Admin**     | http://localhost:8081         | admin / admin123                |
| 👤 **Employee Login**     | http://localhost:3000/login   | employee / employee123          |
| 👑 **Admin Login**        | http://localhost:3000/login   | admin / admin123                |

## 📁 Project Structure

```
restaurant-reservation-system/
├── packages/
│   ├── backend/                 # Node.js API server
│   │   ├── src/
│   │   │   ├── graphql/        # GraphQL schema & resolvers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── middleware/     # Express middleware
│   │   │   └── utils/          # Utilities
│   │   └── Dockerfile
│   ├── frontend/               # React/SolidJS web app
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── services/       # API clients
│   │   │   └── contexts/       # State management
│   │   └── Dockerfile
│   └── shared/                 # Shared types & utilities
├── docker/                     # Docker configuration
├── scripts/                    # Utility scripts
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
└── Makefile                    # Command shortcuts
```

## 🛠️ Development

### Available Commands

```bash
# Development
make dev          # Start development environment
make dev-logs     # View development logs
make dev-stop     # Stop development environment

# Production
make prod         # Start production environment
make prod-logs    # View production logs
make prod-stop    # Stop production environment

# Utilities
make shell-be     # Backend container shell
make shell-fe     # Frontend container shell
make shell-db     # MongoDB shell
make health       # Check system health
make clean        # Clean up everything
```

### Development Workflow

1. **Start Development Environment**

   ```bash
   make dev
   ```

2. **Make Changes**

   - Backend: Edit files in `packages/backend/src/`
   - Frontend: Edit files in `packages/frontend/src/`
   - Changes are automatically reloaded

3. **View Logs**

   ```bash
   make dev-logs
   ```

4. **Test Changes**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/health
   - GraphQL: http://localhost:4000/graphql

### Database Management

```bash
# Access MongoDB shell
make shell-db

# Backup database
./scripts/backup.sh

# Restore database
./scripts/restore.sh --backup=restaurant_backup_20231201_120000

# View database in browser
open http://localhost:8081
```

## 🏗️ Architecture

### Backend Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Apollo Server** - GraphQL server
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication tokens

### Frontend Stack

- **SolidJS** - Reactive UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **GraphQL Client** - API communication

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server
- **MongoDB Express** - Database administration

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/restaurant-reservations?authSource=admin
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**

```env
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_NODE_ENV=development
```

### Customization

1. **Database Configuration**

   - Edit `docker/mongodb/init/01-init-db.js`
   - Modify connection strings in docker-compose files

2. **API Configuration**

   - Update `packages/backend/src/config/environment.ts`
   - Modify GraphQL schema in `packages/backend/src/graphql/schema/`

3. **Frontend Configuration**
   - Edit `packages/frontend/vite.config.ts`
   - Update API endpoints in service files

## 📊 Monitoring

### Real-time Monitoring

```bash
# Start monitoring dashboard
./scripts/monitor.sh

# Monitor production environment
./scripts/monitor.sh --prod
```

### Health Checks

```bash
# Check all services
make health

# Individual service checks
curl http://localhost:4000/health
curl http://localhost:3000
```

### Logs

```bash
# All services
make dev-logs

# Specific service
docker logs restaurant-backend-dev -f
docker logs restaurant-frontend-dev -f
docker logs restaurant-mongodb-dev -f
```

## 🔒 Security

### Production Security Checklist

- [ ] Change default MongoDB passwords
- [ ] Update JWT secret key
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Configure CORS properly
- [ ] Set up log monitoring
- [ ] Regular security updates

### Authentication Flow

1. **Customer Reservations** - No authentication required
2. **Employee Access** - JWT-based authentication
3. **Admin Functions** - Role-based authorization
4. **API Security** - Rate limiting and validation

## 🚀 Deployment

### Development Deployment

```bash
# Quick start
./scripts/start.sh

# With monitoring
./scripts/start.sh && ./scripts/monitor.sh
```

### Production Deployment

```bash
# Production environment
./scripts/start.sh --env prod

# With SSL (requires additional configuration)
# See deployment documentation
```

### Cloud Deployment

- **Docker Hub** - Container registry
- **AWS ECS** - Container orchestration
- **MongoDB Atlas** - Managed database
- **Redis Cloud** - Managed caching

## 🧪 Testing

```bash
# Run all tests
make test

# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📚 API Documentation

### GraphQL API

- **Playground**: http://localhost:4000/graphql
- **Schema**: Auto-generated documentation
- **Introspection**: Enabled in development

### REST API

- **Health Check**: `GET /health`
- **Authentication**: `POST /api/auth/login`
- **User Management**: `GET /api/auth/me`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Port conflicts**: Check `make health` and modify docker-compose ports
- **Database connection**: Ensure MongoDB container is running
- **Build failures**: Run `make clean` and rebuild

### Getting Help

- Check the [troubleshooting guide](README.docker.md#故障排除)
- Review container logs: `make dev-logs`
- Open an issue on GitHub

### Resources

- [Docker Documentation](https://docs.docker.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)

---

**Made with ❤️ for restaurant owners and developers**
