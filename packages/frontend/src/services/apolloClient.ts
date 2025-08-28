import { GraphQLClient, gql } from "graphql-request";
import { clientLogger } from "./clientLogger";

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:3001/graphql";

// 创建 GraphQL 客户端
export const graphqlClient = new GraphQLClient(GRAPHQL_URL, {
  requestMiddleware: (request) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      request.headers = {
        ...request.headers,
        authorization: `Bearer ${token}`,
      };
    }

    // 记录请求开始
    clientLogger.debug(`GraphQL request started`, {
      query: request.query,
      variables: request.variables,
    });

    return request;
  },
  responseMiddleware: (response) => {
    // 记录响应
    clientLogger.debug(`GraphQL response received`, {
      hasErrors: !!response.errors,
      data: response.data,
    });

    // 处理认证错误
    if (response.errors) {
      response.errors.forEach((error) => {
        clientLogger.error("GraphQL Error", {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: error.extensions,
        });

        if (
          error.extensions?.code === "UNAUTHENTICATED" ||
          error.message.toLowerCase().includes("authentication")
        ) {
          // 清除无效 token
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_token_expiry");
        }
      });
    }
  },
});

// 健康检查函数
export async function checkGraphQLHealth(): Promise<boolean> {
  try {
    await graphqlClient.request(gql`
      query HealthCheck {
        __typename
      }
    `);
    return true;
  } catch {
    return false;
  }
}

// 导出 gql 标签函数以便使用
export { gql };
