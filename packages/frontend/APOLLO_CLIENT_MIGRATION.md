# 前端 Apollo Client 迁移指南

## 迁移概述

前端已成功从自定义 GraphQL 客户端和 REST API 调用迁移到 Apollo Client，实现了与后端 GraphQL API 的完整集成。

## 主要变化

### 1. 依赖更新

- ✅ 移除: `graphql-request`
- ✅ 添加: `@apollo/client`

### 2. 新增文件结构

```
src/
├── services/
│   ├── apolloClient.ts          # Apollo Client 配置
│   └── graphql/
│       └── queries.ts           # GraphQL 查询和变更定义
├── hooks/
│   ├── useApollo.ts            # Apollo Client SolidJS hooks
│   ├── useAuth.ts              # 认证相关 hooks
│   └── useReservations.ts      # 预订相关 hooks
├── types/
│   └── graphql.ts              # GraphQL 类型定义
└── components/
    └── examples/
        └── ApolloExamples.tsx  # 使用示例组件
```

### 3. 服务层迁移

- ✅ `authService.ts` - 从 REST API 迁移到 GraphQL mutations/queries
- ✅ `reservationService.ts` - 完全使用 Apollo Client
- ✅ `apolloClient.ts` - 新的 Apollo Client 配置

## 核心功能

### Apollo Client 配置特性

- **认证链接**: 自动添加 JWT token 到请求头
- **错误处理**: 统一的 GraphQL 和网络错误处理
- **缓存管理**: 智能缓存策略和自动更新
- **日志记录**: 完整的请求/响应日志
- **重试机制**: 网络错误自动重试

### SolidJS 集成

- **响应式 Hooks**: 与 SolidJS 信号系统完美集成
- **自动订阅**: 查询结果自动更新 UI
- **内存管理**: 自动清理订阅，防止内存泄漏

## 使用示例

### 1. 认证操作

```typescript
import { useAuth } from "../hooks/useAuth";

const LoginComponent = () => {
  const { login, logout, user, isAuthenticated, loginError } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ username: "admin", password: "password" });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <Show when={isAuthenticated()}>
      <div>欢迎, {user()?.username}!</div>
      <button onClick={logout}>登出</button>
    </Show>
  );
};
```

### 2. 查询预订

```typescript
import { useReservations } from "../hooks/useReservations";

const ReservationsList = () => {
  const { reservations, loading, error, refetch } = useReservations({
    filter: { status: ReservationStatus.REQUESTED },
    pagination: { limit: 20, offset: 0 },
  });

  return (
    <Show when={!loading()} fallback={<div>加载中...</div>}>
      <For each={reservations()}>
        {(reservation) => (
          <div>
            {reservation.guestName} - {reservation.arrivalTime}
          </div>
        )}
      </For>
    </Show>
  );
};
```

### 3. 创建预订

```typescript
import { useCreateReservation } from "../hooks/useReservations";

const CreateReservation = () => {
  const { createReservation, loading, error } = useCreateReservation();

  const handleSubmit = async (formData: CreateReservationInput) => {
    try {
      await createReservation(formData);
      alert("预订创建成功！");
    } catch (error) {
      console.error("创建失败:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <button type="submit" disabled={loading()}>
        {loading() ? "创建中..." : "创建预订"}
      </button>
    </form>
  );
};
```

### 4. 直接使用 Apollo Client

```typescript
import { apolloClient, gql } from "../services/apolloClient";

// 直接查询
const result = await apolloClient.query({
  query: gql`
    query GetReservations {
      reservations {
        data {
          id
          guestName
          status
        }
      }
    }
  `,
});

// 直接变更
const mutationResult = await apolloClient.mutate({
  mutation: gql`
    mutation CreateReservation($input: CreateReservationInput!) {
      createReservation(input: $input) {
        id
        guestName
      }
    }
  `,
  variables: { input: reservationData },
});
```

## 环境配置

### 环境变量

```bash
# .env
VITE_GRAPHQL_URL=http://localhost:3001/graphql
VITE_NODE_ENV=development
```

### 开发服务器

```bash
# 启动前端开发服务器
npm run dev

# 启动后端 GraphQL 服务器
cd ../backend && npm run dev
```

## 错误处理

### GraphQL 错误

```typescript
const { error } = useQuery(SOME_QUERY);

// 检查错误类型
if (error()?.graphQLErrors) {
  error().graphQLErrors.forEach((err) => {
    if (err.extensions?.code === "UNAUTHENTICATED") {
      // 处理认证错误
      redirectToLogin();
    }
  });
}
```

### 网络错误

```typescript
const { error } = useQuery(SOME_QUERY);

if (error()?.networkError) {
  // 处理网络连接问题
  showNetworkErrorMessage();
}
```

## 缓存策略

### 查询缓存

- `cache-first`: 优先使用缓存（默认）
- `cache-and-network`: 使用缓存同时发起网络请求
- `network-only`: 总是发起网络请求
- `cache-only`: 只使用缓存

### 变更后更新

```typescript
const { mutate } = useMutation(CREATE_RESERVATION_MUTATION);

await mutate({
  variables: { input },
  // 自动重新获取相关查询
  refetchQueries: [{ query: GET_RESERVATIONS_QUERY }],
  // 或者手动更新缓存
  update: (cache, { data }) => {
    // 更新缓存逻辑
  },
});
```

## 性能优化

### 1. 查询优化

- 只请求需要的字段
- 使用分页避免大量数据
- 合理使用缓存策略

### 2. 批量操作

```typescript
// Apollo Client 自动批量处理同时发起的查询
const [result1, result2] = await Promise.all([
  apolloClient.query({ query: QUERY1 }),
  apolloClient.query({ query: QUERY2 }),
]);
```

### 3. 预加载

```typescript
// 预加载数据
apolloClient.query({
  query: RESERVATIONS_QUERY,
  fetchPolicy: "cache-and-network",
});
```

## 调试工具

### 1. Apollo Client DevTools

安装 Apollo Client DevTools 浏览器扩展进行调试

### 2. 日志记录

所有 GraphQL 操作都会记录到控制台，包括：

- 请求开始/完成时间
- 变量和响应数据
- 错误信息

### 3. 网络面板

在浏览器开发者工具的网络面板中查看 GraphQL 请求

## 迁移检查清单

- ✅ 安装 `@apollo/client` 依赖
- ✅ 配置 Apollo Client
- ✅ 创建 GraphQL 查询和变更定义
- ✅ 实现 SolidJS hooks
- ✅ 更新认证服务
- ✅ 更新预订服务
- ✅ 更新环境变量
- ✅ 测试所有功能
- ✅ 更新文档

## 故障排除

### 常见问题

1. **CORS 错误**

   - 确保后端 CORS 配置正确
   - 检查 GraphQL 端点 URL

2. **认证失败**

   - 检查 token 是否正确存储
   - 验证 Authorization header 格式

3. **缓存问题**

   - 使用 `fetchPolicy: 'network-only'` 强制网络请求
   - 清除缓存: `apolloClient.clearStore()`

4. **类型错误**
   - 确保 GraphQL 类型定义与后端 schema 一致
   - 检查变量类型匹配

### 调试步骤

1. 检查网络请求是否成功发送
2. 验证 GraphQL 查询语法
3. 检查变量是否正确传递
4. 查看 Apollo Client 缓存状态
5. 检查错误处理逻辑

## 下一步计划

1. **实时功能**: 实现 GraphQL 订阅
2. **离线支持**: 添加离线缓存策略
3. **性能监控**: 添加查询性能指标
4. **类型生成**: 使用 GraphQL Code Generator 自动生成类型
