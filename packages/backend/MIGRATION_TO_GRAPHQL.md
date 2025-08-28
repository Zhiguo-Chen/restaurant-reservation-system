# 后台 API 完全迁移到 Apollo GraphQL

## 迁移概述

后台服务已成功从混合 REST + GraphQL 架构完全迁移到纯 Apollo GraphQL 架构。所有 API 功能现在都通过单一的 GraphQL 端点提供。

## 迁移内容

### ✅ 已完成的迁移

1. **认证系统 GraphQL 化**

   - 添加了 `login` mutation 替代 `POST /auth/login`
   - 添加了 `logout` mutation 替代 `POST /auth/logout`
   - 添加了 `validateToken` query 替代 `GET /auth/validate`
   - 保留了 `me` query 替代 `GET /auth/me`

2. **GraphQL Schema 扩展**

   - 新增认证相关类型：`AuthPayload`, `LogoutResponse`, `TokenValidationResponse`
   - 新增输入类型：`LoginInput`
   - 扩展了 Query 和 Mutation 类型

3. **Resolvers 实现**

   - 创建了完整的 `authResolvers.ts`
   - 集成到主 resolvers 配置中

4. **代码清理**

   - 删除了 REST API 路由文件 (`routes/auth.ts`)
   - 删除了 REST API 控制器 (`controllers/AuthController.ts`)
   - 清理了相关的导出文件

5. **类型定义**
   - 添加了 GraphQL 特定的认证类型定义

### 🏗️ 现有功能保持不变

- 预订管理的 GraphQL API 保持完整
- 数据库连接和服务层无变化
- 认证中间件和 JWT 处理逻辑保持不变
- 所有业务逻辑保持不变

## 新的 API 结构

### 单一端点

- **GraphQL Endpoint**: `http://localhost:3001/graphql`
- **GraphQL Playground**: `http://localhost:3001/graphql` (开发环境)

### 保留的 REST 端点

- `GET /health` - 健康检查
- `GET /api/status` - 服务状态

## 主要优势

1. **统一的 API 接口**: 所有操作通过单一 GraphQL 端点
2. **类型安全**: 强类型 schema 确保 API 契约
3. **按需查询**: 客户端可精确指定所需字段
4. **自文档化**: Schema 即文档，支持 GraphQL Playground
5. **更好的开发体验**: 内置查询验证和自动补全
6. **未来扩展性**: 支持订阅、批量操作等高级功能

## 客户端迁移指南

### REST API → GraphQL 映射

| 原 REST 端点         | 新 GraphQL 操作       | 说明         |
| -------------------- | --------------------- | ------------ |
| `POST /auth/login`   | `mutation login`      | 用户登录     |
| `POST /auth/logout`  | `mutation logout`     | 用户登出     |
| `GET /auth/validate` | `query validateToken` | 验证 token   |
| `GET /auth/me`       | `query me`            | 获取当前用户 |

### 示例迁移

**原 REST API 调用:**

```javascript
// 登录
const response = await fetch("/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
```

**新 GraphQL 调用:**

```javascript
// 登录
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        role
      }
      expiresIn
    }
  }
`;

const { data } = await client.mutate({
  mutation: LOGIN_MUTATION,
  variables: { input: { username, password } },
});
```

## 开发和测试

### 启动开发服务器

```bash
cd packages/backend
npm run dev
```

### 访问 GraphQL Playground

打开浏览器访问: `http://localhost:3001/graphql`

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 文件结构变化

### 新增文件

- `src/graphql/resolvers/authResolvers.ts` - 认证相关 resolvers
- `src/types/auth.ts` - GraphQL 认证类型定义
- `docs/graphql-examples.md` - GraphQL 使用示例

### 删除文件

- `src/routes/auth.ts` - REST 认证路由
- `src/controllers/AuthController.ts` - REST 认证控制器

### 修改文件

- `src/graphql/schema.ts` - 扩展了认证相关 schema
- `src/graphql/resolvers/index.ts` - 集成认证 resolvers
- `src/index.ts` - 更新了状态端点描述

## 注意事项

1. **认证方式不变**: 仍使用 JWT token 通过 Authorization header 传递
2. **错误处理**: 遵循 GraphQL 标准错误格式
3. **向后兼容**: 健康检查等监控端点保持 REST 格式
4. **开发工具**: GraphQL Playground 提供交互式 API 探索

## 下一步计划

1. **实时功能**: 实现 GraphQL 订阅用于实时预订更新
2. **批量操作**: 利用 GraphQL 的批量查询能力
3. **缓存优化**: 实现 GraphQL 查询缓存
4. **性能监控**: 添加 GraphQL 特定的性能指标

## 支持

如有问题，请参考：

- `docs/graphql-examples.md` - 详细的使用示例
- GraphQL Playground - 交互式 API 文档
- 项目 README 文件
