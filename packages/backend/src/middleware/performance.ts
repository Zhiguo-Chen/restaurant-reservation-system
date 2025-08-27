import { Request, Response, NextFunction } from "express";
import { logPerformance, logApiRequest } from "../utils/logger";
import { getRequestId } from "./requestId";

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = getRequestId(req);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log API request performance
    logApiRequest(
      req.method,
      req.originalUrl,
      statusCode,
      duration,
      (req as any).user?.id,
      statusCode >= 400 ? new Error(`HTTP ${statusCode}`) : undefined
    );

    // Log performance metrics for slow requests
    if (duration > 1000) {
      // Log requests slower than 1 second
      logPerformance(
        `${req.method} ${req.route?.path || req.path}`,
        duration,
        "slow-request",
        {
          requestId,
          statusCode,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
        }
      );
    }

    // Set performance headers
    res.setHeader("x-response-time", `${duration}ms`);

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Database operation performance tracker
 */
export class DatabasePerformanceTracker {
  private operation: string;
  private collection: string;
  private startTime: number;

  constructor(operation: string, collection: string) {
    this.operation = operation;
    this.collection = collection;
    this.startTime = Date.now();
  }

  /**
   * End tracking and log performance
   */
  end(error?: Error): void {
    const duration = Date.now() - this.startTime;

    logPerformance(
      `db.${this.collection}.${this.operation}`,
      duration,
      "database",
      {
        collection: this.collection,
        operation: this.operation,
        error: error?.message,
      }
    );

    // Log slow database operations
    if (duration > 500) {
      // Log operations slower than 500ms
      logPerformance(
        `SLOW DB: ${this.collection}.${this.operation}`,
        duration,
        "slow-database",
        {
          collection: this.collection,
          operation: this.operation,
          error: error?.message,
        }
      );
    }
  }
}

/**
 * Create database performance tracker
 */
export function trackDatabaseOperation(
  operation: string,
  collection: string
): DatabasePerformanceTracker {
  return new DatabasePerformanceTracker(operation, collection);
}

/**
 * GraphQL operation performance tracker
 */
export class GraphQLPerformanceTracker {
  private operationName: string;
  private startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = Date.now();
  }

  /**
   * End tracking and log performance
   */
  end(error?: Error): void {
    const duration = Date.now() - this.startTime;

    logPerformance(`graphql.${this.operationName}`, duration, "graphql", {
      operationName: this.operationName,
      error: error?.message,
    });

    // Log slow GraphQL operations
    if (duration > 1000) {
      // Log operations slower than 1 second
      logPerformance(
        `SLOW GraphQL: ${this.operationName}`,
        duration,
        "slow-graphql",
        {
          operationName: this.operationName,
          error: error?.message,
        }
      );
    }
  }
}

/**
 * Create GraphQL performance tracker
 */
export function trackGraphQLOperation(
  operationName: string
): GraphQLPerformanceTracker {
  return new GraphQLPerformanceTracker(operationName);
}
