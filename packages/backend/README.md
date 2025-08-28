# Restaurant Reservation Backend

这是餐厅预订系统的后端服务，使用 Apollo GraphQL 和 Express.js 构建。

## 🚀 Apollo GraphQL 集成完成

### 架构概览

- **GraphQL Server**: Apollo Server Express
- **数据库**: Couchbase
- **认证**: JWT Token
- **API 端点**: `/graphql`

### 启动服务

1. **环境配置**

   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接信息
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   npm start
   ```

### GraphQL 端点

- **GraphQL API**: `http://localhost:4000/graphql`
- **GraphQL Playground**: `http://localhost:4000/graphql` (开发环境)
- **健康检查**: `http://localhost:4000/health`
- **状态检查**: `http://localhost:4000/api/status`

### 主要功能

#### 查询 (Queries)

- `reservations` - 获取预订列表（支持过滤和分页）
- `reservation(id)` - 获取单个预订详情
- `reservationsByEmail(email)` - 根据邮箱查询预订
- `me` - 获取当前用户信息

#### 变更 (Mutations)

- `createReservation` - 创建新预订
- `updateReservation` - 更新预订信息
- `cancelReservation` - 取消预订
- `updateReservationStatus` - 更新预订状态（员工/管理员）

#### 订阅 (Subscriptions)

- `reservationUpdated` - 预订更新实时通知
- `reservationCreated` - 新预订创建实时通知

### 示例 GraphQL 查询

```graphql
# 获取所有预订
query GetReservations {
  reservations {
    data {
      id
      guestName
      guestEmail
      arrivalTime
      tableSize
      status
    }
    pagination {
      total
      hasMore
    }
  }
}

# 创建新预订
mutation CreateReservation {
  createReservation(
    input: {
      guestName: "张三"
      guestPhone: "13800138000"
      guestEmail: "zhangsan@example.com"
      arrivalTime: "2024-12-25T19:00:00Z"
      tableSize: 4
      notes: "靠窗位置"
    }
  ) {
    id
    guestName
    status
    arrivalTime
  }
}
```

### 认证

使用 JWT Token 进行认证：

```
Authorization: Bearer <your-jwt-token>
```

### 环境变量

| 变量名                        | 描述                 | 默认值                    |
| ----------------------------- | -------------------- | ------------------------- |
| `PORT`                        | 服务器端口           | `4000`                    |
| `NODE_ENV`                    | 环境模式             | `development`             |
| `COUCHBASE_CONNECTION_STRING` | Couchbase 连接字符串 | -                         |
| `COUCHBASE_USERNAME`          | 数据库用户名         | -                         |
| `COUCHBASE_PASSWORD`          | 数据库密码           | -                         |
| `COUCHBASE_BUCKET`            | 数据库桶名           | `restaurant-reservations` |
| `JWT_SECRET`                  | JWT 密钥             | -                         |
| `JWT_EXPIRES_IN`              | Token 过期时间       | `24h`                     |
| `CORS_ORIGIN`                 | CORS 允许的源        | `http://localhost:3000`   |

### 开发工具

- **TypeScript**: 类型安全
- **ESLint**: 代码规范
- **Jest**: 单元测试
- **ts-node-dev**: 开发热重载

### 项目结构

```
src/
├── config/          # 配置文件
├── graphql/         # GraphQL相关
│   ├── resolvers/   # GraphQL解析器
│   ├── schema.ts    # GraphQL模式定义
│   ├── server.ts    # Apollo Server配置
│   └── context.ts   # GraphQL上下文
├── services/        # 业务逻辑服务
├── repositories/    # 数据访问层
├── types/          # TypeScript类型定义
├── utils/          # 工具函数
└── index.ts        # 应用入口
```

### 下一步

1. 配置 Couchbase 数据库
2. 运行数据库种子脚本：`npm run seed`
3. 启动服务器：`npm run dev`
4. 访问 GraphQL Playground 测试 API

### 故障排除

如果遇到数据库连接问题：

1. 确保 Couchbase 服务正在运行
2. 检查 `.env` 文件中的数据库配置
3. 确认数据库用户权限

如果遇到 GraphQL 错误：

1. 检查 GraphQL schema 语法
2. 确认 resolvers 实现完整
3. 查看服务器日志获取详细错误信息
