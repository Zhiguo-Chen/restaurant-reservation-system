import { Request, Response, NextFunction } from "express";
import {
  errorHandler,
  createApiError,
  createOperationalError,
  createProgrammingError,
  ErrorFactory,
  ErrorCodes,
  ApiError,
} from "../errorHandler";
import { errorMonitor, ErrorMonitor } from "../../utils/errorMonitoring";
import { logger } from "../../utils/logger";

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Error Handling", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      url: "/test",
      headers: {},
      body: {},
      params: {},
      query: {},
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("test-agent"),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("Error Classification", () => {
    it("should create operational error correctly", () => {
      const error = createOperationalError(
        "Test error",
        400,
        ErrorCodes.VALIDATION_ERROR
      );

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it("should create programming error correctly", () => {
      const error = createProgrammingError("Internal error");

      expect(error.message).toBe("Internal error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(error.isOperational).toBe(false);
    });

    it("should create API error with default values", () => {
      const error = createApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });
  });

  describe("Error Factory", () => {
    it("should create authentication errors", () => {
      const error = ErrorFactory.invalidCredentials();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCodes.INVALID_CREDENTIALS);
      expect(error.message).toBe("Invalid username or password");
    });

    it("should create validation errors with details", () => {
      const details = { field: "email", value: "invalid" };
      const error = ErrorFactory.validationError("Invalid email", details);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.details).toEqual(details);
    });

    it("should create business rule errors", () => {
      const error = ErrorFactory.reservationConflict("Time slot taken");

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCodes.RESERVATION_CONFLICT);
      expect(error.message).toBe("Time slot taken");
    });

    it("should create not found errors with resource info", () => {
      const error = ErrorFactory.reservationNotFound("123");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCodes.RESERVATION_NOT_FOUND);
      expect(error.message).toBe("Reservation with ID 123 not found");
      expect(error.details).toEqual({ reservationId: "123" });
    });
  });

  describe("Error Handler Middleware", () => {
    it("should handle operational errors correctly", () => {
      const error = ErrorFactory.validationError("Invalid input");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid input",
          }),
        })
      );
    });

    it("should handle programming errors correctly", () => {
      const error = createProgrammingError("Database connection failed");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });

    it("should not handle if response already sent", () => {
      const error = ErrorFactory.validationError("Test error");
      mockRes.headersSent = true;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should sanitize sensitive headers", () => {
      const error = ErrorFactory.validationError("Test error");
      mockReq.headers = {
        authorization: "Bearer secret-token",
        "x-api-key": "secret-key",
        "user-agent": "test-agent",
      };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        "API Error",
        expect.objectContaining({
          request: expect.objectContaining({
            headers: expect.objectContaining({
              authorization: "[REDACTED]",
              "x-api-key": "[REDACTED]",
              "user-agent": "test-agent",
            }),
          }),
        })
      );
    });

    it("should sanitize sensitive request body", () => {
      const error = ErrorFactory.validationError("Test error");
      mockReq.body = {
        username: "test",
        password: "secret",
        email: "test@example.com",
      };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        "API Error",
        expect.objectContaining({
          request: expect.objectContaining({
            body: expect.objectContaining({
              username: "test",
              password: "[REDACTED]",
              email: "test@example.com",
            }),
          }),
        })
      );
    });
  });

  describe("Error Monitoring", () => {
    let testErrorMonitor: ErrorMonitor;

    beforeEach(() => {
      testErrorMonitor = new ErrorMonitor({
        errorThreshold: 3,
        timeWindowMs: 60000, // 1 minute
        criticalErrorTypes: ["DATABASE_ERROR", "INTERNAL_ERROR"],
      });
    });

    it("should record errors correctly", () => {
      const error = ErrorFactory.validationError("Test error");

      testErrorMonitor.recordError(error, "/test");

      const metrics = testErrorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(1);
      expect(metrics.errorsByType[ErrorCodes.VALIDATION_ERROR]).toBe(1);
      expect(metrics.errorsByEndpoint["/test"]).toBe(1);
    });

    it("should calculate error rate correctly", () => {
      const error = ErrorFactory.validationError("Test error");

      // Record multiple errors
      for (let i = 0; i < 5; i++) {
        testErrorMonitor.recordError(error, "/test");
      }

      const metrics = testErrorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(5);
      expect(metrics.errorRate).toBe(5); // 5 errors in the last minute
    });

    it("should get error history for time window", () => {
      const error = ErrorFactory.validationError("Test error");

      testErrorMonitor.recordError(error, "/test");

      const history = testErrorMonitor.getErrorHistory(60000);
      expect(history).toHaveLength(1);
      expect(history[0].error).toBe(error);
      expect(history[0].endpoint).toBe("/test");
    });

    it("should reset metrics correctly", () => {
      const error = ErrorFactory.validationError("Test error");

      testErrorMonitor.recordError(error, "/test");
      testErrorMonitor.resetMetrics();

      const metrics = testErrorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(0);
      expect(metrics.errorsByType).toEqual({});
      expect(metrics.errorsByEndpoint).toEqual({});
    });
  });

  describe("Error Classification by Message", () => {
    it("should classify validation errors", () => {
      const error = new Error("validation failed") as ApiError;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.VALIDATION_ERROR,
          }),
        })
      );
    });

    it("should classify not found errors", () => {
      const error = new Error("User not found") as ApiError;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.NOT_FOUND,
          }),
        })
      );
    });

    it("should classify database errors", () => {
      const error = new Error("mongo connection failed") as ApiError;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.DATABASE_ERROR,
          }),
        })
      );
    });
  });

  describe("Production Error Handling", () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should hide internal error details in production", () => {
      const error = createProgrammingError(
        "Database connection string exposed"
      );

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "An internal server error occurred",
            details: undefined,
          }),
        })
      );
    });

    it("should expose client error details in production", () => {
      const error = ErrorFactory.validationError("Invalid email format");

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Invalid email format",
          }),
        })
      );
    });
  });
});
