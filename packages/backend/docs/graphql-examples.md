# GraphQL API 使用示例

现在后台已完全迁移到 Apollo GraphQL，所有 API 功能都通过 GraphQL 端点提供。

## 端点

- GraphQL Endpoint: `http://localhost:3001/graphql`
- GraphQL Playground: `http://localhost:3001/graphql` (开发环境)

## 认证相关操作

### 1. 用户登录

```graphql
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
```

变量:

```json
{
  "input": {
    "username": "admin",
    "password": "password123"
  }
}
```

### 2. 验证 Token

```graphql
query ValidateToken {
  validateToken {
    valid
    user {
      id
      username
      role
    }
    timestamp
  }
}
```

Headers:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### 3. 获取当前用户信息

```graphql
query Me {
  me {
    id
    username
    role
  }
}
```

### 4. 用户登出

```graphql
mutation Logout {
  logout {
    message
    timestamp
  }
}
```

## 预订相关操作

### 1. 创建预订

```graphql
mutation CreateReservation($input: CreateReservationInput!) {
  createReservation(input: $input) {
    id
    guestName
    guestPhone
    guestEmail
    arrivalTime
    tableSize
    status
    createdAt
    notes
  }
}
```

变量:

```json
{
  "input": {
    "guestName": "张三",
    "guestPhone": "+86 138 0013 8000",
    "guestEmail": "zhangsan@example.com",
    "arrivalTime": "2024-12-25T19:00:00Z",
    "tableSize": 4,
    "notes": "靠窗座位"
  }
}
```

### 2. 查询预订列表

```graphql
query Reservations($filter: ReservationFilter, $pagination: PaginationInput) {
  reservations(filter: $filter, pagination: $pagination) {
    data {
      id
      guestName
      guestPhone
      guestEmail
      arrivalTime
      tableSize
      status
      createdAt
      updatedAt
      notes
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
```

变量:

```json
{
  "filter": {
    "status": "REQUESTED",
    "startDate": "2024-12-25T00:00:00Z",
    "endDate": "2024-12-25T23:59:59Z"
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

### 3. 根据邮箱查询预订（客人查询）

```graphql
query ReservationsByEmail($email: String!) {
  reservationsByEmail(email: $email) {
    id
    guestName
    arrivalTime
    tableSize
    status
    notes
  }
}
```

### 4. 更新预订状态（员工操作）

```graphql
mutation UpdateReservationStatus($id: ID!, $status: ReservationStatus!) {
  updateReservationStatus(id: $id, status: $status) {
    id
    status
    updatedAt
    updatedBy
  }
}
```

Headers (需要认证):

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## JavaScript/TypeScript 客户端示例

### 使用 Apollo Client

```typescript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// 创建 HTTP 链接
const httpLink = createHttpLink({
  uri: "http://localhost:3001/graphql",
});

// 认证链接
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// 创建 Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// 登录示例
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        role
      }
    }
  }
`;

async function login(username: string, password: string) {
  try {
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: { username, password },
      },
    });

    // 保存 token
    localStorage.setItem("token", data.login.token);
    return data.login;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}
```

### 使用 fetch API

```typescript
async function graphqlRequest(query: string, variables?: any, token?: string) {
  const response = await fetch("http://localhost:3001/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// 使用示例
const loginQuery = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        role
      }
    }
  }
`;

const loginData = await graphqlRequest(loginQuery, {
  input: { username: "admin", password: "password123" },
});
```

## 迁移说明

### 从 REST API 迁移到 GraphQL

| REST 端点            | GraphQL 操作          |
| -------------------- | --------------------- |
| `POST /auth/login`   | `mutation login`      |
| `POST /auth/logout`  | `mutation logout`     |
| `GET /auth/validate` | `query validateToken` |
| `GET /auth/me`       | `query me`            |

### 主要优势

1. **单一端点**: 所有操作通过 `/graphql` 端点
2. **类型安全**: 强类型 schema 定义
3. **按需查询**: 客户端可以精确指定需要的字段
4. **实时订阅**: 支持 WebSocket 订阅（已预留）
5. **开发工具**: GraphQL Playground 提供交互式查询界面
6. **自文档化**: Schema 即文档

### 注意事项

- 所有请求都使用 POST 方法
- 认证通过 Authorization header 传递 JWT token
- 错误处理遵循 GraphQL 标准格式
- 支持批量查询和变更操作
