import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
  gql,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { clientLogger } from "./clientLogger";

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:3001/graphql";

// HTTP Link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

// Auth Link - 添加认证 header
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("auth_token");

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Error Link - 处理错误
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        clientLogger.error("GraphQL Error", {
          message,
          locations,
          path,
          extensions,
          operation: operation.operationName,
        });

        // 处理认证错误
        if (
          extensions?.code === "UNAUTHENTICATED" ||
          message.toLowerCase().includes("authentication")
        ) {
          // 清除无效 token
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_token_expiry");

          // 可以在这里触发重定向到登录页面
          // window.location.href = '/login';
        }
      });
    }

    if (networkError) {
      clientLogger.error("Network Error", {
        message: networkError.message,
        operation: operation.operationName,
      });
    }
  }
);

// Logging Link - 记录请求
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();

  clientLogger.debug(`GraphQL ${operation.operationName} started`, {
    variables: operation.variables,
  });

  return forward(operation).map((response) => {
    const duration = Date.now() - startTime;

    clientLogger.debug(`GraphQL ${operation.operationName} completed`, {
      duration,
      hasErrors: !!response.errors,
    });

    return response;
  });
});

// 创建 Apollo Client
export const apolloClient = new ApolloClient({
  link: from([loggingLink, errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reservations: {
            // 合并分页结果
            keyArgs: ["filter"],
            merge(existing = { data: [], pagination: {} }, incoming) {
              return {
                data: [...existing.data, ...incoming.data],
                pagination: incoming.pagination,
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// 健康检查函数
export async function checkGraphQLHealth(): Promise<boolean> {
  try {
    const result = await apolloClient.query({
      query: gql`
        query HealthCheck {
          __typename
        }
      `,
      fetchPolicy: "network-only",
    });
    return !result.error;
  } catch {
    return false;
  }
}

// 导出 gql 标签函数以便使用
export { gql } from "@apollo/client";
