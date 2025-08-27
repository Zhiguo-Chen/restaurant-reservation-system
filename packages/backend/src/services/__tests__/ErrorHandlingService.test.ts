import {
  ErrorHandlingService,
  ErrorType,
  ErrorSeverity,
} from "../ErrorHandlingService";
import { StructuredError } from "../../interfaces/services";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("ErrorHandlingService", () => {
  let errorHandlingService: ErrorHandlingService;
  let mockLogger: any;

  beforeEach(() => {
    errorHandlingService = new ErrorHandlingService();
    mockLogger = require("../../utils/logger").default;
    jest.clearAllMocks();
  });

  describe("createErrorResponse", () => {
    it("should create a properly formatted error response", () => {
      const structuredError: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Test validation error",
        code: "VALIDATION_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const response = errorHandlingService.createErrorResponse(
        structuredError,
        "test-request-id"
      );

      expect(response).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Test validation error",
          details: undefined,
          timestamp: "2024-01-01T00:00:00.000Z",
          requestId: "test-request-id",
        },
      });
    });

    it("should generate request ID if not provided", () => {
      const structuredError: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Test error",
        code: "TEST_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const response =
        errorHandlingService.createErrorResponse(structuredError);

      expect(response.error.requestId).toMatch(/^req_\d+_[a-z0-9]{6}$/);
    });

    it("should log error based on severity", () => {
      const structuredError: StructuredError = {
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "High severity error",
        code: "INTERNAL_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      errorHandlingService.createErrorResponse(structuredError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "High severity error",
        expect.objectContaining({
          type: ErrorType.INTERNAL_ERROR,
          severity: ErrorSeverity.HIGH,
          code: "INTERNAL_ERROR",
        })
      );
    });
  });

  describe("createValidationError", () => {
    it("should create a validation error with correct properties", () => {
      const error = errorHandlingService.createValidationError(
        "Invalid input",
        { field: "email" },
        { userId: "123" }
      );

      expect(error).toEqual({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Invalid input",
        code: "VALIDATION_ERROR",
        details: { field: "email" },
        context: { userId: "123" },
        timestamp: expect.any(String),
      });
    });

    it("should create validation error without details and context", () => {
      const error = errorHandlingService.createValidationError("Invalid input");

      expect(error).toEqual({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Invalid input",
        code: "VALIDATION_ERROR",
        details: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe("createBusinessRuleError", () => {
    it("should create a business rule error", () => {
      const error = errorHandlingService.createBusinessRuleError(
        "Time slot not available",
        "time_slot_validation",
        { arrivalTime: "2024-01-01T19:00:00Z" }
      );

      expect(error).toEqual({
        type: ErrorType.BUSINESS_RULE_VIOLATION,
        severity: ErrorSeverity.MEDIUM,
        message: "Time slot not available",
        code: "BUSINESS_RULE_VIOLATION",
        details: { rule: "time_slot_validation" },
        context: { arrivalTime: "2024-01-01T19:00:00Z" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("createNotFoundError", () => {
    it("should create a not found error with identifier", () => {
      const error = errorHandlingService.createNotFoundError(
        "Reservation",
        "RES_123",
        { userId: "user-456" }
      );

      expect(error).toEqual({
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: "Reservation not found with identifier: RES_123",
        code: "NOT_FOUND",
        details: { resource: "Reservation", identifier: "RES_123" },
        context: { userId: "user-456" },
        timestamp: expect.any(String),
      });
    });

    it("should create not found error without identifier", () => {
      const error = errorHandlingService.createNotFoundError("User");

      expect(error).toEqual({
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: "User not found",
        code: "NOT_FOUND",
        details: { resource: "User", identifier: undefined },
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe("createUnauthorizedError", () => {
    it("should create unauthorized error with default message", () => {
      const error = errorHandlingService.createUnauthorizedError();

      expect(error).toEqual({
        type: ErrorType.UNAUTHORIZED,
        severity: ErrorSeverity.MEDIUM,
        message: "Authentication required",
        code: "UNAUTHORIZED",
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it("should create unauthorized error with custom message", () => {
      const error = errorHandlingService.createUnauthorizedError(
        "Invalid token",
        { token: "expired" }
      );

      expect(error).toEqual({
        type: ErrorType.UNAUTHORIZED,
        severity: ErrorSeverity.MEDIUM,
        message: "Invalid token",
        code: "UNAUTHORIZED",
        context: { token: "expired" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("createForbiddenError", () => {
    it("should create forbidden error with default message", () => {
      const error = errorHandlingService.createForbiddenError();

      expect(error).toEqual({
        type: ErrorType.FORBIDDEN,
        severity: ErrorSeverity.MEDIUM,
        message: "Access denied",
        code: "FORBIDDEN",
        context: undefined,
        timestamp: expect.any(String),
      });
    });

    it("should create forbidden error with custom message", () => {
      const error = errorHandlingService.createForbiddenError(
        "Insufficient permissions",
        { requiredRole: "admin" }
      );

      expect(error).toEqual({
        type: ErrorType.FORBIDDEN,
        severity: ErrorSeverity.MEDIUM,
        message: "Insufficient permissions",
        code: "FORBIDDEN",
        context: { requiredRole: "admin" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("createConflictError", () => {
    it("should create conflict error", () => {
      const error = errorHandlingService.createConflictError(
        "Reservation already exists",
        "duplicate_reservation",
        { email: "test@example.com" }
      );

      expect(error).toEqual({
        type: ErrorType.CONFLICT,
        severity: ErrorSeverity.MEDIUM,
        message: "Reservation already exists",
        code: "CONFLICT",
        details: { conflictType: "duplicate_reservation" },
        context: { email: "test@example.com" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("createRateLimitError", () => {
    it("should create rate limit error with default message", () => {
      const resetTime = new Date("2024-01-01T01:00:00Z");
      const error = errorHandlingService.createRateLimitError(
        undefined,
        100,
        resetTime,
        { clientId: "client-123" }
      );

      expect(error).toEqual({
        type: ErrorType.RATE_LIMIT_EXCEEDED,
        severity: ErrorSeverity.MEDIUM,
        message: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        details: { limit: 100, resetTime },
        context: { clientId: "client-123" },
        timestamp: expect.any(String),
      });
    });

    it("should create rate limit error with custom message", () => {
      const error = errorHandlingService.createRateLimitError(
        "Too many requests",
        50
      );

      expect(error).toEqual({
        type: ErrorType.RATE_LIMIT_EXCEEDED,
        severity: ErrorSeverity.MEDIUM,
        message: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
        details: { limit: 50, resetTime: undefined },
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe("createInternalError", () => {
    it("should create internal error with original error", () => {
      const originalError = new Error("Database connection failed");
      const error = errorHandlingService.createInternalError(
        "Service unavailable",
        originalError,
        { service: "database" }
      );

      expect(error).toEqual({
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "Service unavailable",
        code: "INTERNAL_ERROR",
        details: {
          originalMessage: "Database connection failed",
          stack: originalError.stack,
        },
        context: { service: "database" },
        timestamp: expect.any(String),
      });
    });

    it("should create internal error with default message", () => {
      const error = errorHandlingService.createInternalError();

      expect(error).toEqual({
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: undefined,
        context: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe("createDatabaseError", () => {
    it("should create database error", () => {
      const originalError = new Error("Connection timeout");
      const error = errorHandlingService.createDatabaseError(
        "Database operation failed",
        "findById",
        originalError,
        { collection: "reservations" }
      );

      expect(error).toEqual({
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "Database operation failed",
        code: "DATABASE_ERROR",
        details: {
          operation: "findById",
          originalMessage: "Connection timeout",
        },
        context: { collection: "reservations" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("createExternalServiceError", () => {
    it("should create external service error", () => {
      const error = errorHandlingService.createExternalServiceError(
        "email-service",
        "Failed to send notification",
        500,
        { recipient: "test@example.com" }
      );

      expect(error).toEqual({
        type: ErrorType.EXTERNAL_SERVICE_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: "Failed to send notification",
        code: "EXTERNAL_SERVICE_ERROR",
        details: { service: "email-service", statusCode: 500 },
        context: { recipient: "test@example.com" },
        timestamp: expect.any(String),
      });
    });
  });

  describe("handleUnknownError", () => {
    it("should handle Error objects", () => {
      const originalError = new Error("Something went wrong");
      const error = errorHandlingService.handleUnknownError(originalError, {
        operation: "test",
      });

      expect(error).toEqual({
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: {
          originalMessage: "Something went wrong",
          stack: originalError.stack,
        },
        context: { operation: "test" },
        timestamp: expect.any(String),
      });
    });

    it("should handle ValidationError", () => {
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";

      const error = errorHandlingService.handleUnknownError(validationError);

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe("Validation failed");
    });

    it("should handle MongoError", () => {
      const mongoError = new Error("Duplicate key error");
      mongoError.name = "MongoError";

      const error = errorHandlingService.handleUnknownError(mongoError);

      expect(error.type).toBe(ErrorType.DATABASE_ERROR);
      expect(error.message).toBe("Database operation failed");
    });

    it("should handle not found errors", () => {
      const notFoundError = new Error("Resource not found");

      const error = errorHandlingService.handleUnknownError(notFoundError);

      expect(error.type).toBe(ErrorType.NOT_FOUND);
    });

    it("should handle unauthorized errors", () => {
      const unauthorizedError = new Error("authentication failed");

      const error = errorHandlingService.handleUnknownError(unauthorizedError);

      expect(error.type).toBe(ErrorType.UNAUTHORIZED);
    });

    it("should handle forbidden errors", () => {
      const forbiddenError = new Error("access denied");

      const error = errorHandlingService.handleUnknownError(forbiddenError);

      expect(error.type).toBe(ErrorType.FORBIDDEN);
    });

    it("should handle conflict errors", () => {
      const conflictError = new Error("Resource already exists");

      const error = errorHandlingService.handleUnknownError(conflictError);

      expect(error.type).toBe(ErrorType.CONFLICT);
    });

    it("should handle non-Error objects", () => {
      const unknownError = { message: "Unknown error", code: 500 };

      const error = errorHandlingService.handleUnknownError(unknownError);

      expect(error).toEqual({
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: undefined,
        context: { originalError: unknownError },
        timestamp: expect.any(String),
      });
    });
  });

  describe("isRetryableError", () => {
    it("should identify retryable errors", () => {
      const retryableErrors = [
        ErrorType.DATABASE_ERROR,
        ErrorType.EXTERNAL_SERVICE_ERROR,
        ErrorType.RATE_LIMIT_EXCEEDED,
      ];

      retryableErrors.forEach((errorType) => {
        const error: StructuredError = {
          type: errorType,
          severity: ErrorSeverity.MEDIUM,
          message: "Test error",
          code: "TEST_ERROR",
          timestamp: "2024-01-01T00:00:00.000Z",
        };

        expect(errorHandlingService.isRetryableError(error)).toBe(true);
      });
    });

    it("should identify non-retryable errors", () => {
      const nonRetryableErrors = [
        ErrorType.VALIDATION_ERROR,
        ErrorType.BUSINESS_RULE_VIOLATION,
        ErrorType.NOT_FOUND,
        ErrorType.UNAUTHORIZED,
        ErrorType.FORBIDDEN,
        ErrorType.CONFLICT,
        ErrorType.INTERNAL_ERROR,
      ];

      nonRetryableErrors.forEach((errorType) => {
        const error: StructuredError = {
          type: errorType,
          severity: ErrorSeverity.MEDIUM,
          message: "Test error",
          code: "TEST_ERROR",
          timestamp: "2024-01-01T00:00:00.000Z",
        };

        expect(errorHandlingService.isRetryableError(error)).toBe(false);
      });
    });
  });

  describe("getHttpStatusCode", () => {
    it("should return correct HTTP status codes", () => {
      const statusCodes = [
        [ErrorType.VALIDATION_ERROR, 400],
        [ErrorType.BUSINESS_RULE_VIOLATION, 400],
        [ErrorType.NOT_FOUND, 404],
        [ErrorType.UNAUTHORIZED, 401],
        [ErrorType.FORBIDDEN, 403],
        [ErrorType.CONFLICT, 409],
        [ErrorType.RATE_LIMIT_EXCEEDED, 429],
        [ErrorType.INTERNAL_ERROR, 500],
        [ErrorType.DATABASE_ERROR, 500],
        [ErrorType.EXTERNAL_SERVICE_ERROR, 502],
      ];

      statusCodes.forEach(([errorType, expectedStatus]) => {
        const statusCode = errorHandlingService.getHttpStatusCode(
          errorType as ErrorType
        );
        expect(statusCode).toBe(expectedStatus);
      });
    });
  });

  describe("sanitizeErrorForClient", () => {
    it("should sanitize internal errors", () => {
      const internalError: StructuredError = {
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "Database connection failed with credentials",
        code: "INTERNAL_ERROR",
        details: { stack: "Error stack trace", credentials: "secret" },
        context: { password: "secret123", userId: "user-123" },
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const sanitized =
        errorHandlingService.sanitizeErrorForClient(internalError);

      expect(sanitized).toEqual({
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "An unexpected error occurred. Please try again.",
        code: "INTERNAL_ERROR",
        details: undefined,
        context: { userId: "user-123" },
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should sanitize database errors", () => {
      const databaseError: StructuredError = {
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "Query failed with connection string",
        code: "DATABASE_ERROR",
        details: { connectionString: "mongodb://secret:password@host" },
        context: { secret: "api-key", operation: "findById" },
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const sanitized =
        errorHandlingService.sanitizeErrorForClient(databaseError);

      expect(sanitized).toEqual({
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "An unexpected error occurred. Please try again.",
        code: "DATABASE_ERROR",
        details: undefined,
        context: { operation: "findById" },
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should not sanitize validation errors", () => {
      const validationError: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Invalid email format",
        code: "VALIDATION_ERROR",
        details: { field: "email" },
        context: { userId: "user-123" },
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const sanitized =
        errorHandlingService.sanitizeErrorForClient(validationError);

      expect(sanitized).toEqual(validationError);
    });

    it("should remove sensitive context fields", () => {
      const error: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Test error",
        code: "TEST_ERROR",
        context: {
          password: "secret123",
          token: "jwt-token",
          secret: "api-secret",
          userId: "user-123",
          operation: "test",
        },
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const sanitized = errorHandlingService.sanitizeErrorForClient(error);

      expect(sanitized.context).toEqual({
        userId: "user-123",
        operation: "test",
      });
    });
  });

  describe("createErrorMetrics", () => {
    it("should create error metrics", () => {
      const error: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Test error",
        code: "VALIDATION_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const metrics = errorHandlingService.createErrorMetrics(error);

      expect(metrics).toEqual({
        errorType: "VALIDATION_ERROR",
        errorCode: "VALIDATION_ERROR",
        severity: "LOW",
        timestamp: "2024-01-01T00:00:00.000Z",
        count: 1,
      });
    });
  });

  describe("logging behavior", () => {
    it("should log low severity errors as info", () => {
      const error: StructuredError = {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: "Low severity error",
        code: "TEST_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      errorHandlingService.createErrorResponse(error);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Low severity error",
        expect.objectContaining({
          type: ErrorType.VALIDATION_ERROR,
          severity: ErrorSeverity.LOW,
        })
      );
    });

    it("should log medium severity errors as warnings", () => {
      const error: StructuredError = {
        type: ErrorType.BUSINESS_RULE_VIOLATION,
        severity: ErrorSeverity.MEDIUM,
        message: "Medium severity error",
        code: "TEST_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      errorHandlingService.createErrorResponse(error);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Medium severity error",
        expect.objectContaining({
          type: ErrorType.BUSINESS_RULE_VIOLATION,
          severity: ErrorSeverity.MEDIUM,
        })
      );
    });

    it("should log high severity errors as errors", () => {
      const error: StructuredError = {
        type: ErrorType.INTERNAL_ERROR,
        severity: ErrorSeverity.HIGH,
        message: "High severity error",
        code: "TEST_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      errorHandlingService.createErrorResponse(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "High severity error",
        expect.objectContaining({
          type: ErrorType.INTERNAL_ERROR,
          severity: ErrorSeverity.HIGH,
        })
      );
    });

    it("should log critical severity errors as errors", () => {
      const error: StructuredError = {
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.CRITICAL,
        message: "CRITICAL ERROR",
        code: "TEST_ERROR",
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      errorHandlingService.createErrorResponse(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "CRITICAL ERROR",
        expect.objectContaining({
          type: ErrorType.DATABASE_ERROR,
          severity: ErrorSeverity.CRITICAL,
        })
      );
    });
  });
});
