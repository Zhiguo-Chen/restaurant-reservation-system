import { Request, Response, NextFunction } from "express";
import { DatabaseConnection } from "../config/database";
import { createLogger } from "../utils/logger";

const logger = createLogger("database-middleware");

/**
 * Middleware to ensure database connection is available
 */
export const ensureDatabaseConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dbConnection = DatabaseConnection.getInstance();

    if (!dbConnection.isConnected()) {
      logger.error("Database connection not available");
      res.status(503).json({
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database service is currently unavailable",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      });
      return;
    }

    // Add database instance to request for use in controllers
    (req as any).db = dbConnection.getDatabase();
    next();
  } catch (error) {
    logger.error("Database middleware error:", error);
    res.status(503).json({
      error: {
        code: "DATABASE_ERROR",
        message: "Database service error",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || "unknown",
      },
    });
  }
};

/**
 * Health check endpoint for database
 */
export const databaseHealthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const dbConnection = DatabaseConnection.getInstance();
    const health = await dbConnection.healthCheck();

    const statusCode = health.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      database: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Database health check error:", error);
    res.status(503).json({
      database: {
        status: "unhealthy",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
    });
  }
};
