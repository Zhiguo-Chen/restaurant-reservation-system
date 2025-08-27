import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export enum ErrorCodes {
  // Authentication & Authorization
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_REQUIRED = "TOKEN_REQUIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  FORBIDDEN = "FORBIDDEN",
  USER_NOT_FOUND = "USER_NOT_FOUND",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Business Logic
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  RESERVATION_CONFLICT = "RESERVATION_CONFLICT",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  TABLE_NOT_AVAILABLE = "TABLE_NOT_AVAILABLE",

  // Resource
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESERVATION_NOT_FOUND = "RESERVATION_NOT_FOUND",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

/**
 * Global error handler middleware for Express
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID if not present
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();

  // Classify error type
  const errorClassification = classifyError(error);

  // Log the error with appropriate level
  const logLevel = errorClassification.statusCode >= 500 ? "error" : "warn";
  logger[logLevel]("API Error", {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: errorClassification.statusCode,
      isOperational: error.isOperational,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeRequestBody(req.body),
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
    requestId,
    timestamp: new Date().toISOString(),
  });

  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Create error response
  const errorResponse = {
    error: {
      code: errorClassification.code,
      message: getErrorMessage(error, errorClassification.statusCode),
      details: shouldExposeDetails(errorClassification.statusCode)
        ? error.details
        : undefined,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Send error response
  res.status(errorClassification.statusCode).json(errorResponse);

  // Alert on critical errors
  if (errorClassification.statusCode >= 500 && error.isOperational !== false) {
    alertOnCriticalError(error, requestId, req);
  }
}

/**
 * Classify error and determine appropriate response
 */
function classifyError(error: ApiError): { statusCode: number; code: string } {
  // If error already has classification, use it
  if (error.statusCode && error.code) {
    return { statusCode: error.statusCode, code: error.code };
  }

  // Classify based on error type or message
  if (
    error.name === "ValidationError" ||
    error.message.includes("validation")
  ) {
    return { statusCode: 400, code: ErrorCodes.VALIDATION_ERROR };
  }

  if (error.name === "CastError" || error.message.includes("Cast to")) {
    return { statusCode: 400, code: ErrorCodes.INVALID_INPUT };
  }

  if (error.name === "MongoError" || error.message.includes("mongo")) {
    return { statusCode: 500, code: ErrorCodes.DATABASE_ERROR };
  }

  if (error.message.includes("not found")) {
    return { statusCode: 404, code: ErrorCodes.NOT_FOUND };
  }

  if (
    error.message.includes("unauthorized") ||
    error.message.includes("authentication")
  ) {
    return { statusCode: 401, code: ErrorCodes.INVALID_CREDENTIALS };
  }

  if (
    error.message.includes("forbidden") ||
    error.message.includes("permission")
  ) {
    return { statusCode: 403, code: ErrorCodes.FORBIDDEN };
  }

  // Default to internal error
  return { statusCode: 500, code: ErrorCodes.INTERNAL_ERROR };
}

/**
 * Get appropriate error message based on error type and status code
 */
function getErrorMessage(error: ApiError, statusCode: number): string {
  // Don't expose internal error details in production
  if (statusCode >= 500 && process.env.NODE_ENV === "production") {
    return "An internal server error occurred";
  }

  return error.message || "An error occurred";
}

/**
 * Determine if error details should be exposed to client
 */
function shouldExposeDetails(statusCode: number): boolean {
  // Only expose details for client errors (4xx), not server errors (5xx)
  return statusCode < 500 && process.env.NODE_ENV !== "production";
}

/**
 * Sanitize request headers for logging (remove sensitive data)
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];

  sensitiveHeaders.forEach((header) => {
    if (sanitized[header]) {
      sanitized[header] = "[REDACTED]";
    }
  });

  return sanitized;
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ["password", "token", "secret", "key"];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });

  return sanitized;
}

/**
 * Alert on critical errors (placeholder for monitoring integration)
 */
function alertOnCriticalError(
  error: ApiError,
  requestId: string,
  req: Request
): void {
  // In a real application, this would integrate with monitoring services
  // like Sentry, DataDog, New Relic, etc.
  logger.error("CRITICAL ERROR ALERT", {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    requestId,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    alertLevel: "CRITICAL",
  });

  // TODO: Integrate with external monitoring service
  // Example: Sentry.captureException(error, { extra: { requestId, url: req.url } });
}

/**
 * Handle 404 errors for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.headers["x-request-id"] || "unknown",
    },
  });
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom API error
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any,
  isOperational: boolean = true
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = isOperational;
  return error;
}

/**
 * Create operational error (expected business logic error)
 */
export function createOperationalError(
  message: string,
  statusCode: number,
  code: string,
  details?: any
): ApiError {
  return createApiError(message, statusCode, code, details, true);
}

/**
 * Create programming error (unexpected system error)
 */
export function createProgrammingError(
  message: string,
  details?: any
): ApiError {
  return createApiError(
    message,
    500,
    ErrorCodes.INTERNAL_ERROR,
    details,
    false
  );
}

/**
 * Pre-defined error creators for common scenarios
 */
export const ErrorFactory = {
  // Authentication & Authorization
  invalidCredentials: (details?: any) =>
    createOperationalError(
      "Invalid username or password",
      401,
      ErrorCodes.INVALID_CREDENTIALS,
      details
    ),

  tokenRequired: (details?: any) =>
    createOperationalError(
      "Authentication token required",
      401,
      ErrorCodes.TOKEN_REQUIRED,
      details
    ),

  invalidToken: (details?: any) =>
    createOperationalError(
      "Invalid or expired token",
      401,
      ErrorCodes.INVALID_TOKEN,
      details
    ),

  forbidden: (message: string = "Insufficient permissions", details?: any) =>
    createOperationalError(message, 403, ErrorCodes.FORBIDDEN, details),

  userNotFound: (userId?: string) =>
    createOperationalError(
      userId ? `User with ID ${userId} not found` : "User not found",
      404,
      ErrorCodes.USER_NOT_FOUND
    ),

  // Validation
  validationError: (message: string, details?: any) =>
    createOperationalError(message, 400, ErrorCodes.VALIDATION_ERROR, details),

  invalidInput: (field: string, value?: any) =>
    createOperationalError(
      `Invalid input for field: ${field}`,
      400,
      ErrorCodes.INVALID_INPUT,
      { field, value }
    ),

  missingRequiredField: (field: string) =>
    createOperationalError(
      `Missing required field: ${field}`,
      400,
      ErrorCodes.MISSING_REQUIRED_FIELD,
      { field }
    ),

  // Business Logic
  businessRuleViolation: (message: string, details?: any) =>
    createOperationalError(
      message,
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      details
    ),

  reservationConflict: (
    message: string = "Reservation time conflict",
    details?: any
  ) =>
    createOperationalError(
      message,
      409,
      ErrorCodes.RESERVATION_CONFLICT,
      details
    ),

  invalidStatusTransition: (from: string, to: string) =>
    createOperationalError(
      `Cannot change reservation status from ${from} to ${to}`,
      400,
      ErrorCodes.INVALID_STATUS_TRANSITION,
      { from, to }
    ),

  tableNotAvailable: (tableSize: number, time: Date) =>
    createOperationalError(
      `No table available for ${tableSize} people at ${time.toISOString()}`,
      409,
      ErrorCodes.TABLE_NOT_AVAILABLE,
      { tableSize, requestedTime: time }
    ),

  // Resource
  notFound: (resource: string, id?: string) =>
    createOperationalError(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      ErrorCodes.NOT_FOUND,
      { resource, id }
    ),

  reservationNotFound: (id: string) =>
    createOperationalError(
      `Reservation with ID ${id} not found`,
      404,
      ErrorCodes.RESERVATION_NOT_FOUND,
      { reservationId: id }
    ),

  // System
  databaseError: (message: string, details?: any) =>
    createProgrammingError(`Database error: ${message}`, details),

  externalServiceError: (service: string, message: string, details?: any) =>
    createProgrammingError(
      `External service error (${service}): ${message}`,
      details
    ),

  rateLimitExceeded: (limit: number, windowMs: number) =>
    createOperationalError(
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      { limit, windowMs }
    ),
};

// Backward compatibility
export const AuthErrors = {
  invalidCredentials: ErrorFactory.invalidCredentials,
  tokenRequired: ErrorFactory.tokenRequired,
  invalidToken: ErrorFactory.invalidToken,
  insufficientPermissions: ErrorFactory.forbidden,
  userNotFound: ErrorFactory.userNotFound,
};
