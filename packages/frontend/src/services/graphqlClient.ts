import { authService } from "./authService";
import { clientLogger } from "./clientLogger";

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: Record<string, any>;
  code?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

export class GraphQLClientError extends Error {
  public readonly graphqlErrors: GraphQLError[];
  public readonly networkError?: Error;
  public readonly response?: Response;

  constructor(
    message: string,
    graphqlErrors: GraphQLError[] = [],
    networkError?: Error,
    response?: Response
  ) {
    super(message);
    this.name = "GraphQLClientError";
    this.graphqlErrors = graphqlErrors;
    this.networkError = networkError;
    this.response = response;
  }

  get isNetworkError(): boolean {
    return !!this.networkError;
  }

  get isGraphQLError(): boolean {
    return this.graphqlErrors.length > 0;
  }

  get isAuthenticationError(): boolean {
    return this.graphqlErrors.some(
      (error) =>
        error.extensions?.code === "UNAUTHENTICATED" ||
        error.message.toLowerCase().includes("authentication")
    );
  }

  get isAuthorizationError(): boolean {
    return this.graphqlErrors.some(
      (error) =>
        error.extensions?.code === "FORBIDDEN" ||
        error.message.toLowerCase().includes("forbidden") ||
        error.message.toLowerCase().includes("permission")
    );
  }

  get isValidationError(): boolean {
    return this.graphqlErrors.some(
      (error) =>
        error.extensions?.code === "BAD_USER_INPUT" ||
        error.extensions?.code === "VALIDATION_ERROR"
    );
  }
}

export interface GraphQLClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (error: GraphQLClientError) => void;
  onRequest?: (operation: string, variables?: any) => void;
  onResponse?: (operation: string, data: any, duration: number) => void;
}

export class GraphQLClient {
  private baseUrl: string;
  private options: GraphQLClientOptions;

  constructor(
    baseUrl: string = GRAPHQL_URL,
    options: GraphQLClientOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.options = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<T> {
    return this.executeWithRetry("query", query, variables, operationName);
  }

  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<T> {
    return this.executeWithRetry(
      "mutation",
      mutation,
      variables,
      operationName
    );
  }

  private async executeWithRetry<T>(
    type: "query" | "mutation",
    operation: string,
    variables?: Record<string, any>,
    operationName?: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await this.execute<T>(operation, variables, operationName);
    } catch (error) {
      const graphqlError = error as GraphQLClientError;

      // Don't retry on authentication, authorization, or validation errors
      if (
        graphqlError.isAuthenticationError ||
        graphqlError.isAuthorizationError ||
        graphqlError.isValidationError ||
        attempt >= (this.options.retries || 3)
      ) {
        throw error;
      }

      // Only retry on network errors or server errors
      if (
        graphqlError.isNetworkError ||
        (graphqlError.response && graphqlError.response.status >= 500)
      ) {
        clientLogger.warn(`GraphQL ${type} retry attempt ${attempt}`, {
          operation: operationName || "unknown",
          attempt,
          error: graphqlError.message,
        });

        const delay =
          (this.options.retryDelay || 1000) * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.executeWithRetry(
          type,
          operation,
          variables,
          operationName,
          attempt + 1
        );
      }

      throw error;
    }
  }

  private async execute<T>(
    operation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<T> {
    const startTime = Date.now();
    const opName = operationName || this.extractOperationName(operation);

    try {
      this.options.onRequest?.(opName, variables);

      const response = await this.request(operation, variables);
      const duration = Date.now() - startTime;

      if (response.errors && response.errors.length > 0) {
        const error = new GraphQLClientError(
          this.formatGraphQLErrors(response.errors),
          response.errors
        );

        clientLogger.logApiCall("POST", this.baseUrl, 200, duration, error);
        this.options.onError?.(error);
        throw error;
      }

      if (!response.data) {
        const error = new GraphQLClientError(
          "No data received from GraphQL server"
        );
        clientLogger.logApiCall("POST", this.baseUrl, 200, duration, error);
        throw error;
      }

      clientLogger.logApiCall("POST", this.baseUrl, 200, duration);
      this.options.onResponse?.(opName, response.data, duration);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof GraphQLClientError) {
        throw error;
      }

      const clientError = new GraphQLClientError(
        error instanceof Error ? error.message : String(error),
        [],
        error instanceof Error ? error : new Error(String(error))
      );

      clientLogger.logApiCall("POST", this.baseUrl, 0, duration, clientError);
      this.options.onError?.(clientError);
      throw clientError;
    }
  }

  private async request(
    query: string,
    variables?: Record<string, any>
  ): Promise<GraphQLResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.options.timeout || 30000);

    try {
      const headers = authService.getAuthHeaders();

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Try to get error details from response
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new GraphQLClientError(errorMessage, [], undefined, response);
      }

      const result: GraphQLResponse = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GraphQLClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new GraphQLClientError(
            `GraphQL request timed out after ${this.options.timeout}ms`,
            [],
            error
          );
        }

        if (error.message.includes("fetch")) {
          throw new GraphQLClientError(
            "Unable to connect to GraphQL server. Please check your connection.",
            [],
            error
          );
        }
      }

      throw new GraphQLClientError(
        error instanceof Error ? error.message : String(error),
        [],
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private formatGraphQLErrors(errors: GraphQLError[]): string {
    if (errors.length === 1) {
      return errors[0].message;
    }

    return `Multiple errors occurred:\n${errors
      .map((e) => `- ${e.message}`)
      .join("\n")}`;
  }

  private extractOperationName(query: string): string {
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Check if the client can reach the GraphQL server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ __typename }",
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get client configuration
   */
  getConfig(): { baseUrl: string; options: GraphQLClientOptions } {
    return {
      baseUrl: this.baseUrl,
      options: { ...this.options },
    };
  }
}

export const graphqlClient = new GraphQLClient(GRAPHQL_URL, {
  onError: (error) => {
    clientLogger.error("GraphQL Client Error", {
      message: error.message,
      graphqlErrors: error.graphqlErrors,
      networkError: error.networkError?.message,
      isAuthError: error.isAuthenticationError,
      isValidationError: error.isValidationError,
    });
  },
  onRequest: (operation, variables) => {
    clientLogger.debug(`GraphQL ${operation} started`, { variables });
  },
  onResponse: (operation, data, duration) => {
    clientLogger.debug(`GraphQL ${operation} completed`, { duration });
  },
});
