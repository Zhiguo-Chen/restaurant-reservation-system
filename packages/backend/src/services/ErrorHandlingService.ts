import { ApiError, ErrorResponse } from "../types/shared";
import {
  ErrorHandlingService as IErrorHandlingService,
  StructuredError,
  ErrorType,
  ErrorSeverity,
} from "../interfaces/services";
import logger from "../utils/logger";

// Re-export types for convenience
export { ErrorType, ErrorSeverity, StructuredError };

/**
 * ErrorHandlingService provides comprehensive error handling, formatting, and logging
 */
export class ErrorHandlingService implements IErrorHandlingService {
  /**
   * Create a structured error response
   */
  createErrorResponse(
    error: StructuredError,
    requestId?: string
  ): ErrorResponse {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };

    // Log the error based on severity
    this.logError(error, requestId);

    return errorResponse;
  }

  /**
   * Create a validation error
   */
  createValidationError(
    message: string,
    details?: any,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      message,
      code: "VALIDATION_ERROR",
      details,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a business rule violation error
   */
  createBusinessRuleError(
    message: string,
    rule: string,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.BUSINESS_RULE_VIOLATION,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "BUSINESS_RULE_VIOLATION",
      details: { rule },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a not found error
   */
  createNotFoundError(
    resource: string,
    identifier?: string,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.NOT_FOUND,
      severity: ErrorSeverity.LOW,
      message: `${resource} not found${
        identifier ? ` with identifier: ${identifier}` : ""
      }`,
      code: "NOT_FOUND",
      details: { resource, identifier },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an unauthorized error
   */
  createUnauthorizedError(
    message: string = "Authentication required",
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.UNAUTHORIZED,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "UNAUTHORIZED",
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a forbidden error
   */
  createForbiddenError(
    message: string = "Access denied",
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.FORBIDDEN,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "FORBIDDEN",
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a conflict error
   */
  createConflictError(
    message: string,
    conflictType: string,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.CONFLICT,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "CONFLICT",
      details: { conflictType },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a rate limit error
   */
  createRateLimitError(
    message: string = "Rate limit exceeded",
    limit: number,
    resetTime?: Date,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.RATE_LIMIT_EXCEEDED,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "RATE_LIMIT_EXCEEDED",
      details: { limit, resetTime },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an internal server error
   */
  createInternalError(
    message: string = "An unexpected error occurred",
    originalError?: Error,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.INTERNAL_ERROR,
      severity: ErrorSeverity.HIGH,
      message,
      code: "INTERNAL_ERROR",
      details: originalError
        ? {
            originalMessage: originalError.message,
            stack: originalError.stack,
          }
        : undefined,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a database error
   */
  createDatabaseError(
    message: string,
    operation: string,
    originalError?: Error,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.DATABASE_ERROR,
      severity: ErrorSeverity.HIGH,
      message,
      code: "DATABASE_ERROR",
      details: {
        operation,
        originalMessage: originalError?.message,
      },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an external service error
   */
  createExternalServiceError(
    service: string,
    message: string,
    statusCode?: number,
    context?: Record<string, any>
  ): StructuredError {
    return {
      type: ErrorType.EXTERNAL_SERVICE_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message,
      code: "EXTERNAL_SERVICE_ERROR",
      details: { service, statusCode },
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle and classify unknown errors
   */
  handleUnknownError(
    error: unknown,
    context?: Record<string, any>
  ): StructuredError {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === "ValidationError") {
        return this.createValidationError(error.message, undefined, context);
      }

      if (error.name === "MongoError" || error.name === "MongoServerError") {
        return this.createDatabaseError(
          "Database operation failed",
          "unknown",
          error,
          context
        );
      }

      if (error.message.includes("not found")) {
        return this.createNotFoundError("Resource", undefined, context);
      }

      if (
        error.message.includes("unauthorized") ||
        error.message.includes("authentication")
      ) {
        return this.createUnauthorizedError(error.message, context);
      }

      if (
        error.message.includes("forbidden") ||
        error.message.includes("access denied")
      ) {
        return this.createForbiddenError(error.message, context);
      }

      if (
        error.message.includes("conflict") ||
        error.message.includes("already exists")
      ) {
        return this.createConflictError(error.message, "unknown", context);
      }

      // Default to internal error
      return this.createInternalError(
        "An unexpected error occurred",
        error,
        context
      );
    }

    // Handle non-Error objects
    return this.createInternalError("An unexpected error occurred", undefined, {
      ...context,
      originalError: error,
    });
  }

  /**
   * Log error based on severity
   */
  private logError(error: StructuredError, requestId?: string): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      code: error.code,
      message: error.message,
      details: error.details,
      context: error.context,
      timestamp: error.timestamp,
      requestId: requestId || error.requestId,
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info("Low severity error", logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn("Medium severity error", logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error("High severity error", logData);
        break;
      case ErrorSeverity.CRITICAL:
        logger.error("CRITICAL ERROR", logData);
        // In a real system, this might trigger alerts
        break;
      default:
        logger.error("Unknown severity error", logData);
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Check if error should be retried
   */
  isRetryableError(error: StructuredError): boolean {
    const retryableTypes = [
      ErrorType.DATABASE_ERROR,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      ErrorType.RATE_LIMIT_EXCEEDED,
    ];

    return retryableTypes.includes(error.type);
  }

  /**
   * Get HTTP status code for error type
   */
  getHttpStatusCode(errorType: ErrorType): number {
    const statusCodes: Record<ErrorType, number> = {
      [ErrorType.VALIDATION_ERROR]: 400,
      [ErrorType.BUSINESS_RULE_VIOLATION]: 400,
      [ErrorType.NOT_FOUND]: 404,
      [ErrorType.UNAUTHORIZED]: 401,
      [ErrorType.FORBIDDEN]: 403,
      [ErrorType.CONFLICT]: 409,
      [ErrorType.RATE_LIMIT_EXCEEDED]: 429,
      [ErrorType.INTERNAL_ERROR]: 500,
      [ErrorType.DATABASE_ERROR]: 500,
      [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
    };

    return statusCodes[errorType] || 500;
  }

  /**
   * Sanitize error details for client response
   */
  sanitizeErrorForClient(error: StructuredError): StructuredError {
    // Remove sensitive information from error details
    const sanitizedError = { ...error };

    if (
      error.type === ErrorType.INTERNAL_ERROR ||
      error.type === ErrorType.DATABASE_ERROR
    ) {
      // Don't expose internal error details to clients
      sanitizedError.details = undefined;
      sanitizedError.message =
        "An unexpected error occurred. Please try again.";
    }

    // Remove sensitive context information
    if (sanitizedError.context) {
      const { password, token, secret, ...safeContext } =
        sanitizedError.context;
      sanitizedError.context = safeContext;
    }

    return sanitizedError;
  }

  /**
   * Create error metrics for monitoring
   */
  createErrorMetrics(error: StructuredError): {
    errorType: string;
    errorCode: string;
    severity: string;
    timestamp: string;
    count: number;
  } {
    return {
      errorType: error.type,
      errorCode: error.code,
      severity: error.severity,
      timestamp: error.timestamp,
      count: 1,
    };
  }
}
