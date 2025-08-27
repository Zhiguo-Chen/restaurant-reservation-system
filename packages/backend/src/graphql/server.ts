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
  // Set up resolver dependencies
  setReservationService(dependencies.reservationService);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }: any) =>
      createContext({ req, res }, dependencies.authService),
    introspection: isDevelopment,
    formatError: (error) => {
      logger.error("GraphQL Error:", {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: error.extensions,
      });

      // Don't expose internal errors in production
      if (!isDevelopment && error.message.startsWith("Internal")) {
        return new Error("Internal server error");
      }

      return error;
    },
  });

  return server;
}

/**
 * Apply GraphQL middleware to Express app
 */
export async function applyGraphQLMiddleware(
  app: any,
  server: ApolloServer,
  path: string = "/graphql"
): Promise<void> {
  await server.start();
  server.applyMiddleware({
    app,
    path,
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
  });

  logger.info(`GraphQL server ready at ${path}`);
}
