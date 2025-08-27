import { ApolloServer } from "apollo-server-express";
import { Express } from "express";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { createContext, GraphQLContext } from "./context";
import { setReservationService } from "./resolvers/reservationResolvers";
import { AuthService, ReservationService } from "../interfaces/services";
import { logger } from "../utils/logger";
import { config, isDevelopment } from "../config/environment";

export interface GraphQLServerDependencies {
  authService: AuthService;
  reservationService: ReservationService;
}

/**
 * Create and configure Apollo Server
 */
export async function createGraphQLServer(
  dependencies: GraphQLServerDependencies
): Promise<ApolloServer> {
  const { authService, reservationService } = dependencies;

  // Inject dependencies into resolvers
  setReservationService(reservationService);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }: any) => {
      return createContext({ req, res }, authService);
    },

    // Enable GraphQL Playground in development
    introspection: isDevelopment,

    // Enhanced error formatting
    formatError: (error) => {
      const { message, locations, path, extensions } = error;

      // Classify GraphQL error
      const errorClassification = classifyGraphQLError(error);

      // Log the error with appropriate level
      const logLevel = errorClassification.statusCode >= 500 ? "error" : "warn";
      logger[logLevel]("GraphQL error", {
        error: {
          message,
          code: errorClassification.code,
          statusCode: errorClassification.statusCode,
          path,
          locations,
          extensions,
        },
        timestamp: new Date().toISOString(),
      });

      // Create formatted error response
      const formattedError = {
        message: getGraphQLErrorMessage(error, errorClassification.statusCode),
        code: errorClassification.code,
        path,
        locations,
        extensions: {
          code: errorClassification.code,
          statusCode: errorClassification.statusCode,
          timestamp: new Date().toISOString(),
          ...(shouldExposeGraphQLDetails(errorClassification.statusCode)
            ? extensions
            : {}),
        },
      };

      // Alert on critical GraphQL errors
      if (errorClassification.statusCode >= 500) {
        alertOnCriticalGraphQLError(error);
      }

      return formattedError;
    },

    // Request/response logging
    plugins: [],
  });

  return server;
}

/**
 * Apply GraphQL middleware to Express app
 */
export async function applyGraphQLMiddleware(
  app: Express,
  server: ApolloServer,
  path: string = "/graphql"
): Promise<void> {
  // Start the server
  await server.start();

  // Apply the Apollo GraphQL middleware
  server.applyMiddleware({
    app: app as any,
    path,
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
  });

  logger.info(
    `GraphQL server ready at http://localhost:${config.PORT}${server.graphqlPath}`
  );

  if (isDevelopment) {
    logger.info(
      `GraphQL Playground available at http://localhost:${config.PORT}${server.graphqlPath}`
    );
  }
}

/**
 * Classify GraphQL errors and determine appropriate response
 */
function classifyGraphQLError(error: any): {
  statusCode: number;
  code: string;
} {
  // Check for Apollo Server error types
  if (error.extensions?.code) {
    switch (error.extensions.code) {
      case "UNAUTHENTICATED":
        return { statusCode: 401, code: "UNAUTHENTICATED" };
      case "FORBIDDEN":
        return { statusCode: 403, code: "FORBIDDEN" };
      case "BAD_USER_INPUT":
        return { statusCode: 400, code: "VALIDATION_ERROR" };
      case "NOT_FOUND":
        return { statusCode: 404, code: "NOT_FOUND" };
      case "CONFLICT":
        return { statusCode: 409, code: "CONFLICT" };
      case "BUSINESS_RULE_VIOLATION":
        return { statusCode: 400, code: "BUSINESS_RULE_VIOLATION" };
      default:
        return { statusCode: 500, code: "INTERNAL_ERROR" };
    }
  }

  // Check error message patterns
  if (error.message.includes("validation")) {
    return { statusCode: 400, code: "VALIDATION_ERROR" };
  }

  if (error.message.includes("not found")) {
    return { statusCode: 404, code: "NOT_FOUND" };
  }

  if (
    error.message.includes("unauthorized") ||
    error.message.includes("authentication")
  ) {
    return { statusCode: 401, code: "UNAUTHENTICATED" };
  }

  if (
    error.message.includes("forbidden") ||
    error.message.includes("permission")
  ) {
    return { statusCode: 403, code: "FORBIDDEN" };
  }

  // Default to internal error
  return { statusCode: 500, code: "INTERNAL_ERROR" };
}

/**
 * Get appropriate GraphQL error message
 */
function getGraphQLErrorMessage(error: any, statusCode: number): string {
  // Don't expose internal error details in production
  if (statusCode >= 500 && !isDevelopment) {
    return "An internal server error occurred";
  }

  return error.message || "An error occurred";
}

/**
 * Determine if GraphQL error details should be exposed
 */
function shouldExposeGraphQLDetails(statusCode: number): boolean {
  return statusCode < 500 || isDevelopment;
}

/**
 * Alert on critical GraphQL errors
 */
function alertOnCriticalGraphQLError(error: any): void {
  logger.error("CRITICAL GRAPHQL ERROR ALERT", {
    error: {
      message: error.message,
      stack: error.stack,
      path: error.path,
      extensions: error.extensions,
    },
    timestamp: new Date().toISOString(),
    alertLevel: "CRITICAL",
  });

  // TODO: Integrate with external monitoring service
  // Example: Sentry.captureException(error, { tags: { type: "graphql" } });
}
