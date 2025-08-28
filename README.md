# 🍽️ Restaurant Reservation System

A modern, full-stack restaurant reservation system built with Node.js, SolidJS, Couchbase, and GraphQL. Features a complete Docker setup for easy deployment and development.

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

### Manual Setup

```bash
# First time setup - build and start all services
make build

# Wait for all services to be healthy (about 2-3 minutes)
make health

# Seed database with sample data (recommended)
make seed
```

### Daily Development

```bash
# Start existing containers (faster)
make start

# Rebuild and start (when dependencies change)
make build
```

**Important**:

- **First time**: Always use `make build` to ensure all dependencies are installed
- **Daily use**: Use `make start` for faster startup
- **After code changes**: Use `make build` to rebuild with latest changes

### Access the System

| Service                   | URL                           | Credentials                     |
| ------------------------- | ----------------------------- | ------------------------------- |
| 🌐 **Frontend**           | http://localhost:3000         | No login required for customers |
| 🔧 **Backend API**        | http://localhost:4000         | -                               |
| 📊 **GraphQL Playground** | http://localhost:4000/graphql | -                               |
| 🗄️ **Database Admin**     | http://localhost:8091         | admin / password123             |
| 👤 **Staff Login**        | http://localhost:3000/login   | staff1 / staff123               |
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

# Database Commands
make seed         # Seed database with sample data
make seed-employees # Seed only employee accounts

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

2. **Seed Sample Data**

   ```bash
   make seed
   ```

3. **Make Changes**

   - Backend: Edit files in `packages/backend/src/`
   - Frontend: Edit files in `packages/frontend/src/`
   - Restart containers to see changes: `make build`

4. **View Logs**

   ```bash
   make logs
   ```

5. **Test the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000/health
   - GraphQL: http://localhost:4000/graphql

### Database Management

```bash
# Seed database with sample data
make seed

# Seed only employee accounts
make seed-employees

# Access Couchbase query shell
make shell-db

# View database in browser
open http://localhost:8091
```

### Sample Data

After running `make seed`, you'll have:

**Employee Accounts:**

- **Admin**: `admin` / `admin123` (Full system access)
- **Manager**: `manager` / `manager123` (Reservation management)
- **Staff 1**: `staff1` / `staff123` (Basic access)
- **Staff 2**: `staff2` / `staff123` (Basic access)

**Sample Reservations:**

- 5 sample reservations with different statuses (confirmed, pending, cancelled)
- Various party sizes and dates
- Customer contact information and special requests

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
