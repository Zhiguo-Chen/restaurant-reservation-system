import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/environment";
import { DatabaseConnection } from "./config/database";
import { createGraphQLServer, applyGraphQLMiddleware } from "./graphql/server";
import { AuthServiceImpl, ReservationService } from "./services";
import { UserRepository, ReservationRepository } from "./repositories";
import logger from "./utils/logger";

const app = express();
const PORT = config.PORT;

async function startServer() {
  try {
    // Initialize database connection
    const dbConnection = DatabaseConnection.getInstance({
      connectionString: config.COUCHBASE_CONNECTION_STRING,
      username: config.COUCHBASE_USERNAME,
      password: config.COUCHBASE_PASSWORD,
      bucketName: config.COUCHBASE_BUCKET,
    });

    await dbConnection.connect();
    // Skip index creation - indexes already exist
    // await dbConnection.createIndexes();

    // Initialize repositories
    const userRepository = new UserRepository(dbConnection.getBucket());
    const reservationRepository = new ReservationRepository(
      dbConnection.getBucket()
    );

    // Initialize services
    const authService = new AuthServiceImpl(userRepository);
    const reservationService = new ReservationService(reservationRepository);

    // Middleware
    app.use(helmet());
    app.use(
      cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
      })
    );
    app.use(express.json());

    // Health check endpoint
    app.get("/health", async (req, res) => {
      const dbHealth = await dbConnection.healthCheck();
      res.json({
        status: dbHealth.status === "healthy" ? "ok" : "error",
        timestamp: new Date().toISOString(),
        database: dbHealth,
      });
    });

    // Basic API routes - only status endpoint for monitoring
    app.get("/api/status", (req, res) => {
      res.json({
        message: "Restaurant Reservation GraphQL API is running",
        version: "1.0.0",
        environment: config.NODE_ENV,
        graphql: "/graphql",
        note: "All API functionality is available through GraphQL endpoint",
      });
    });

    // Create and apply GraphQL server
    const graphqlServer = await createGraphQLServer({
      authService,
      reservationService,
    });

    await applyGraphQLMiddleware(app, graphqlServer);

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(
        `GraphQL playground available at http://localhost:${PORT}/graphql`
      );
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully");
      await dbConnection.disconnect();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down gracefully");
      await dbConnection.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
