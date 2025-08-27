import winston from "winston";
import { config } from "../config";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for structured logging
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, context, ...meta } = info;

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: service || "restaurant-reservation-backend",
      context,
      message,
      ...meta,
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: "HH:mm:ss.SSS",
  }),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, ...meta } = info;
    const contextStr = context ? `[${context}] ` : "";
    const metaStr =
      Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : "";

    return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`;
  })
);

/**
 * Configure Winston logger with enhanced features
 */
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: structuredFormat,
  defaultMeta: {
    service: "restaurant-reservation-backend",
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),

    // Audit logs for security events
    new winston.transports.File({
      filename: path.join(logsDir, "audit.log"),
      level: "info",
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf((info) => {
          // Only log audit events
          if (info.audit) {
            return JSON.stringify(info);
          }
          return "";
        })
      ),
    }),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Add console transport for non-production environments
if (config.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: string, additionalMeta?: any) => {
  return logger.child({ context, ...additionalMeta });
};

/**
 * Log performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  context?: string,
  metadata?: any
) => {
  logger.info("Performance metric", {
    context: context || "performance",
    operation,
    duration,
    unit: "ms",
    ...metadata,
  });
};

/**
 * Log audit events (authentication, authorization, data changes)
 */
export const logAudit = (
  event: string,
  userId?: string,
  details?: any,
  context?: string
) => {
  logger.info("Audit event", {
    context: context || "audit",
    audit: true,
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log security events
 */
export const logSecurity = (
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  details?: any,
  context?: string
) => {
  const logLevel =
    severity === "critical" || severity === "high" ? "error" : "warn";

  logger[logLevel]("Security event", {
    context: context || "security",
    security: true,
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log database operations
 */
export const logDatabase = (
  operation: string,
  collection: string,
  duration?: number,
  error?: Error,
  context?: string
) => {
  const logLevel = error ? "error" : "debug";

  logger[logLevel]("Database operation", {
    context: context || "database",
    operation,
    collection,
    duration,
    error: error?.message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log API requests and responses
 */
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: Error
) => {
  const logLevel = statusCode >= 400 ? "warn" : "info";

  logger[logLevel]("API request", {
    context: "api",
    method,
    url,
    statusCode,
    duration,
    userId,
    error: error?.message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Enhanced logger interface
 */
export interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  performance: (operation: string, duration: number, meta?: any) => void;
  audit: (event: string, userId?: string, details?: any) => void;
  security: (
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    details?: any
  ) => void;
  database: (
    operation: string,
    collection: string,
    duration?: number,
    error?: Error
  ) => void;
}

/**
 * Create enhanced logger with additional methods
 */
export const createEnhancedLogger = (context: string): Logger => {
  const childLogger = createLogger(context);

  return {
    error: (message: string, meta?: any) => childLogger.error(message, meta),
    warn: (message: string, meta?: any) => childLogger.warn(message, meta),
    info: (message: string, meta?: any) => childLogger.info(message, meta),
    debug: (message: string, meta?: any) => childLogger.debug(message, meta),
    performance: (operation: string, duration: number, meta?: any) =>
      logPerformance(operation, duration, context, meta),
    audit: (event: string, userId?: string, details?: any) =>
      logAudit(event, userId, details, context),
    security: (
      event: string,
      severity: "low" | "medium" | "high" | "critical",
      details?: any
    ) => logSecurity(event, severity, details, context),
    database: (
      operation: string,
      collection: string,
      duration?: number,
      error?: Error
    ) => logDatabase(operation, collection, duration, error, context),
  };
};

export { logger };
export default logger;
