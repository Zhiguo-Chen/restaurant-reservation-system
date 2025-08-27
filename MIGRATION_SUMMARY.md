# 数据库和 GraphQL 服务器迁移总结

## 已完成的更改

### 1. 依赖更新

- ✅ 将 `apollo-server-express` 替换为 `@apollo/server` 5.0
- ✅ 将 `graphql` 版本更新为 16.11.0
- ✅ 将 `mongodb` 替换为 `couchbase` 4.3.0
- ✅ 移除了 `mongodb-memory-server` (测试依赖)

### 2. Docker 配置更新

- ✅ 将 MongoDB 服务替换为 Couchbase 7.2.4
- ✅ 更新环境变量从 MONGODB*\* 到 COUCHBASE*\*
- ✅ 移除 mongo-express，Couchbase 自带 Web Console (端口 8091)
- ✅ 创建了 Couchbase 初始化脚本

### 3. 后端代码更新

- ✅ 更新主入口文件 (index.ts) 以使用 Couchbase 和新的 Apollo Server
- ✅ 重写数据库配置类 (DatabaseConnection) 支持 Couchbase
- ✅ 更新环境配置以使用 Couchbase 环境变量
- ✅ 更新 GraphQL 服务器配置以使用 @apollo/server 5.0
- ✅ 重写 BaseRepository 以支持 Couchbase N1QL 查询
- ✅ 完全更新 UserRepository 以使用 Couchbase
- ✅ 完全更新 ReservationRepository 以使用 Couchbase N1QL 查询

### 4. 环境变量更新

- ✅ 更新 .env 和 .env.example 文件

### 5. 工具和脚本

- ✅ 创建了 Couchbase 初始化脚本 (docker/couchbase/init-cluster.sh)
- ✅ 创建了迁移测试脚本 (scripts/test-migration.js)
- ✅ 添加了自动初始化服务和健康检查

## 主要技术变更

### Apollo Server 迁移

- 从 `apollo-server-express` 3.x 迁移到 `@apollo/server` 5.0
- 使用新的 `expressMiddleware` 而不是 `applyMiddleware`
- 添加了 `ApolloServerPluginDrainHttpServer` 插件
- 更新了上下文创建方式

### Couchbase 迁移

- 从 MongoDB 文档模型迁移到 Couchbase 键值+N1QL 模型
- 所有文档现在包含 `type` 字段用于区分文档类型
- 使用 N1QL 查询替代 MongoDB 查询
- 实现了适当的索引策略

## 需要后续更新的测试文件

以下测试文件仍然引用 MongoDB，需要在后续更新：

- `packages/backend/src/config/__tests__/database.integration.test.ts`
- `packages/backend/src/config/__tests__/environment.test.ts`
- `packages/backend/src/repositories/__tests__/UserRepository.test.ts`
- `packages/backend/src/repositories/__tests__/ReservationRepository.test.ts`
- `packages/backend/src/services/__tests__/ErrorHandlingService.test.ts`

## 启动说明

1. 安装新依赖：

```bash
cd packages/backend
npm install
```

2. 启动服务：

```bash
docker-compose up -d
```

3. 等待初始化完成（约 1-2 分钟）

4. 验证服务：

```bash
# 测试 Couchbase 连接
node scripts/test-migration.js

# 检查服务状态
curl http://localhost:4000/health
```

5. 访问服务：

- GraphQL Playground: http://localhost:4000/graphql
- Couchbase Web Console: http://localhost:8091 (admin/password123)
- 后端健康检查: http://localhost:4000/health

## 验证清单

- ✅ Docker 服务启动正常
- ✅ Couchbase 集群初始化成功
- ✅ 索引创建完成
- ⏳ GraphQL 端点响应正常
- ⏳ 数据库操作功能正常
- ⏳ 前端连接正常

## 注意事项

- Couchbase 使用 N1QL 查询语言，语法与 MongoDB 查询不同
- 文档结构需要包含 `type` 字段来区分不同类型的文档
- 索引策略与 MongoDB 不同，已创建适当的二级索引
- 新的 Apollo Server 需要 HTTP 服务器实例
- 环境变量已完全更新，旧的 MongoDB 变量不再使用
