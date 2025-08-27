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

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd restaurant-reservation-system

# Start the application
make start
```

### Access the System

| Service                   | URL                           | Credentials                     |
| ------------------------- | ----------------------------- | ------------------------------- |
| 🌐 **Frontend**           | http://localhost:3000         | No login required for customers |
| 🔧 **Backend API**        | http://localhost:4000         | -                               |
| 📊 **GraphQL Playground** | http://localhost:4000/graphql | -                               |
| 🗄️ **Database Admin**     | http://localhost:8091         | admin / password123             |
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
├── docker/                     # Docker configuration
├── docker-compose.yml          # Docker setup
└── Makefile                    # Command shortcuts
```

## 🛠️ Development

### Available Commands

```bash
# Basic Commands
make start        # Start the application
make build        # Build and start the application
make logs         # View application logs
make stop         # Stop the application

# Utilities
make shell-be     # Backend container shell
make shell-fe     # Frontend container shell
make shell-db     # Couchbase query shell
make health       # Check system health
make clean        # Clean up everything
```

### Development Workflow

1. **Start the Application**

   ```bash
   make start
   ```

2. **Make Changes**

   - Backend: Edit files in `packages/backend/src/`
   - Frontend: Edit files in `packages/frontend/src/`
   - Restart containers to see changes: `make build`

3. **View Logs**

   ```bash
   make logs
   ```

4. **Test the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/health
   - GraphQL: http://localhost:4000/graphql

### Database Management

```bash
# Access Couchbase query shell
make shell-db

# View database in browser
open http://localhost:8091
```

## 🏗️ Architecture

### Backend Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Apollo Server** - GraphQL server
- **Couchbase** - Primary database
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
- **Couchbase Web Console** - Database administration

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
NODE_ENV=development
PORT=4000
COUCHBASE_CONNECTION_STRING=couchbase://couchbase
COUCHBASE_USERNAME=admin
COUCHBASE_PASSWORD=password123
COUCHBASE_BUCKET=restaurant-reservations
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

   - Edit `docker/couchbase/init-cluster.sh`
   - Modify connection strings in docker-compose files

2. **API Configuration**

   - Update `packages/backend/src/config/environment.ts`
   - Modify GraphQL schema in `packages/backend/src/graphql/schema/`

3. **Frontend Configuration**
   - Edit `packages/frontend/vite.config.ts`
   - Update API endpoints in service files

## 📊 Monitoring

### Monitoring

```bash
# Check service health
make health

# View logs
make logs
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
make logs

# Specific service
docker logs restaurant-backend -f
docker logs restaurant-frontend -f
docker logs restaurant-couchbase -f
```

## 🔒 Security

### Production Security Checklist

- [ ] Change default Couchbase passwords
- [ ] Update JWT secret key
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure Couchbase security
- [ ] Configure CORS properly
- [ ] Set up log monitoring
- [ ] Regular security updates

### Authentication Flow

1. **Customer Reservations** - No authentication required
2. **Employee Access** - JWT-based authentication
3. **Admin Functions** - Role-based authorization
4. **API Security** - Rate limiting and validation

## 🚀 Deployment

### Deployment

```bash
# Start the application
make start

# Build and start (for updates)
make build
```

### Cloud Deployment

- **Docker Hub** - Container registry
- **AWS ECS** - Container orchestration
- **Couchbase Cloud** - Managed database
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
- **Database connection**: Ensure Couchbase container is running
- **Build failures**: Run `make clean` and rebuild with `make build`

### Getting Help

- Review container logs: `make dev-logs`
- Check system health: `make health`
- Open an issue on GitHub

### Resources

- [Docker Documentation](https://docs.docker.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Couchbase Documentation](https://docs.couchbase.com/)
- [SolidJS Documentation](https://www.solidjs.com/docs/latest)

---

**Made with ❤️ for restaurant owners and developers**
