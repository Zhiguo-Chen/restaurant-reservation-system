# 🐳 Docker 部署指南

这个项目提供了完整的 Docker 配置，让你可以一键启动整个餐厅预订系统，无需安装任何依赖软件。

## 📋 系统要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 2GB 可用磁盘空间

## 🚀 快速开始

### 开发环境（推荐）

```bash
# 启动开发环境（支持热重载）
make dev

# 或者使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

### 生产环境

```bash
# 启动生产环境
make prod

# 或者使用 docker-compose
docker-compose up -d
```

## 📊 服务访问地址

启动成功后，你可以访问以下服务：

| 服务          | 地址                          | 说明               |
| ------------- | ----------------------------- | ------------------ |
| 🌐 前端应用   | http://localhost:3000         | 餐厅预订系统主页   |
| 🔧 后端 API   | http://localhost:4000         | REST API 接口      |
| 📊 GraphQL    | http://localhost:4000/graphql | GraphQL Playground |
| 🏥 健康检查   | http://localhost:4000/health  | 系统状态检查       |
| 🗄️ 数据库管理 | http://localhost:8081         | MongoDB 管理界面   |

### 默认账户信息

**数据库管理界面 (Mongo Express)**

- 用户名: `admin`
- 密码: `admin123`

**系统管理员账户**

- 用户名: `admin`
- 密码: `admin123`

**员工账户**

- 用户名: `employee`
- 密码: `employee123`

## 🛠️ 常用命令

### 基本操作

```bash
# 查看所有可用命令
make help

# 启动开发环境
make dev

# 查看日志
make dev-logs

# 停止服务
make dev-stop

# 重新构建并启动
make dev-build
```

### 调试和维护

```bash
# 进入后端容器
make shell-be

# 进入前端容器
make shell-fe

# 进入数据库
make shell-db

# 检查服务健康状态
make health

# 显示所有服务地址
make urls
```

### 数据库操作

```bash
# 备份数据库
make backup-db

# 恢复数据库
make restore-db BACKUP_DIR=./backup-20231201-120000
```

### 清理

```bash
# 清理所有容器、镜像和数据卷
make clean
```

## 🏗️ 架构说明

### 服务组件

1. **Frontend (React/SolidJS)**

   - 端口: 3000
   - 基于 Nginx 的生产构建
   - 开发模式支持热重载

2. **Backend (Node.js/Express)**

   - 端口: 4000
   - GraphQL + REST API
   - 支持热重载开发

3. **MongoDB**

   - 端口: 27017
   - 自动初始化数据库和示例数据
   - 数据持久化存储

4. **Redis**

   - 端口: 6379
   - 用于缓存和会话管理

5. **Mongo Express**
   - 端口: 8081
   - 数据库管理界面

### 网络配置

所有服务运行在独立的 Docker 网络中，确保安全隔离：

- 开发环境: `restaurant-dev-network`
- 生产环境: `restaurant-network`

### 数据持久化

- MongoDB 数据: `mongodb_data` 卷
- Redis 数据: `redis_data` 卷

## 🔧 配置说明

### 环境变量

主要环境变量在 `docker-compose.yml` 中配置：

```yaml
# 后端配置
NODE_ENV: development
MONGODB_URI: mongodb://admin:password123@mongodb:27017/restaurant-reservations?authSource=admin
JWT_SECRET: your-super-secret-jwt-key-for-development-only
CORS_ORIGIN: http://localhost:3000

# 前端配置
VITE_API_URL: http://localhost:4000
VITE_GRAPHQL_URL: http://localhost:4000/graphql
```

### 自定义配置

如需修改配置，可以：

1. 编辑 `docker-compose.yml` 或 `docker-compose.dev.yml`
2. 创建 `.env` 文件覆盖默认值
3. 修改各服务的 Dockerfile

## 🐛 故障排除

### 常见问题

**端口冲突**

```bash
# 检查端口占用
lsof -i :3000
lsof -i :4000
lsof -i :27017

# 修改 docker-compose.yml 中的端口映射
```

**容器启动失败**

```bash
# 查看详细日志
docker-compose logs [service-name]

# 重新构建容器
docker-compose up --build
```

**数据库连接失败**

```bash
# 检查 MongoDB 容器状态
docker ps | grep mongodb

# 进入数据库容器检查
make shell-db
```

**前端无法访问后端**

```bash
# 检查网络连接
docker network ls
docker network inspect restaurant-dev-network
```

### 性能优化

**开发环境优化**

- 使用 `docker-compose.dev.yml` 启用热重载
- 挂载源代码目录避免重复构建

**生产环境优化**

- 使用多阶段构建减小镜像大小
- 启用 Nginx 压缩和缓存
- 配置健康检查

## 📝 开发工作流

### 本地开发

1. 启动开发环境：`make dev`
2. 修改代码（自动热重载）
3. 查看日志：`make dev-logs`
4. 测试：`make test`

### 部署到生产

1. 构建生产镜像：`make prod-build`
2. 启动生产环境：`make prod`
3. 监控日志：`make prod-logs`
4. 健康检查：`make health`

## 🔒 安全注意事项

⚠️ **重要**: 生产环境请务必修改以下默认配置：

1. 修改 MongoDB 管理员密码
2. 更换 JWT 密钥
3. 配置 HTTPS
4. 限制网络访问
5. 定期备份数据

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [MongoDB Docker 镜像](https://hub.docker.com/_/mongo)
- [Node.js Docker 最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
