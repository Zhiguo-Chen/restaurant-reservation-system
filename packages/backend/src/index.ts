import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

import { createGraphQLServer, applyGraphQLMiddleware } from "./graphql/server";
import { AuthServiceImpl } from "./services/AuthService";
import { ReservationService } from "./services/ReservationService";
import { UserRepository } from "./repositories/UserRepository";
import { ReservationRepository } from "./repositories/ReservationRepository";
import { createAuthRoutes } from "./routes/auth";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
      })
    );

    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    });
    app.use(limiter);

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGODB_DB_NAME || "restaurant-reservations";

    logger.info("Connecting to MongoDB...", { mongoUri, dbName });
    const mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    logger.info("Connected to MongoDB successfully");

    // Initialize repositories
    const userRepository = new UserRepository(db);
    const reservationRepository = new ReservationRepository(db);

    // Initialize services
    const authService = new AuthServiceImpl(userRepository);
    const reservationService = new ReservationService(reservationRepository);

    // Setup REST API routes
    app.use("/api/auth", createAuthRoutes(userRepository));

    // Create and setup GraphQL server
    const graphqlServer = await createGraphQLServer({
      authService,
      reservationService,
    });

    await applyGraphQLMiddleware(app, graphqlServer);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          graphql: "ready",
        },
      });
    });

    // 404 handler
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });

    // Error handler
    app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        logger.error("Unhandled error:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Something went wrong",
        });
      }
    );

    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${PORT}`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully");
      await mongoClient.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down gracefully");
      await mongoClient.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
