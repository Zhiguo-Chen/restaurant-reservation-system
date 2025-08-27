import { ErrorMonitor } from "../errorMonitoring";
import { ErrorFactory, ErrorCodes } from "../../middleware/errorHandler";
import { logger } from "../logger";

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch for webhook tests
global.fetch = jest.fn();

describe("Error Monitoring", () => {
  let errorMonitor: ErrorMonitor;

  beforeEach(() => {
    errorMonitor = new ErrorMonitor({
      errorThreshold: 3,
      timeWindowMs: 60000, // 1 minute
      criticalErrorTypes: ["DATABASE_ERROR", "INTERNAL_ERROR"],
      alertWebhookUrl: "https://example.com/webhook",
      slackWebhookUrl: "https://hooks.slack.com/webhook",
    });

    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe("Error Recording", () => {
    it("should record error correctly", () => {
      const error = ErrorFactory.validationError("Test error");

      errorMonitor.recordError(error, "/api/test");

      const metrics = errorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(1);
      expect(metrics.errorsByType[ErrorCodes.VALIDATION_ERROR]).toBe(1);
      expect(metrics.errorsByEndpoint["/api/test"]).toBe(1);
      expect(metrics.lastError).toBeInstanceOf(Date);
    });

    it("should increment error counts for multiple errors", () => {
      const error1 = ErrorFactory.validationError("Error 1");
      const error2 = ErrorFactory.validationError("Error 2");
      const error3 = ErrorFactory.notFound("Resource", "123");

      errorMonitor.recordError(error1, "/api/test1");
      errorMonitor.recordError(error2, "/api/test1");
      errorMonitor.recordError(error3, "/api/test2");

      const metrics = errorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(3);
      expect(metrics.errorsByType[ErrorCodes.VALIDATION_ERROR]).toBe(2);
      expect(metrics.errorsByType[ErrorCodes.NOT_FOUND]).toBe(1);
      expect(metrics.errorsByEndpoint["/api/test1"]).toBe(2);
      expect(metrics.errorsByEndpoint["/api/test2"]).toBe(1);
    });

    it("should calculate error rate correctly", () => {
      const error = ErrorFactory.validationError("Test error");

      // Record 5 errors
      for (let i = 0; i < 5; i++) {
        errorMonitor.recordError(error, "/api/test");
      }

      const metrics = errorMonitor.getMetrics();
      expect(metrics.errorRate).toBe(5); // 5 errors in the last minute
    });
  });

  describe("Error History", () => {
    it("should return error history for time window", () => {
      const error1 = ErrorFactory.validationError("Error 1");
      const error2 = ErrorFactory.notFound("Resource", "123");

      errorMonitor.recordError(error1, "/api/test1");
      errorMonitor.recordError(error2, "/api/test2");

      const history = errorMonitor.getErrorHistory(60000); // 1 minute
      expect(history).toHaveLength(2);
      expect(history[0].error).toBe(error1);
      expect(history[0].endpoint).toBe("/api/test1");
      expect(history[1].error).toBe(error2);
      expect(history[1].endpoint).toBe("/api/test2");
    });

    it("should filter history by time window", () => {
      const error = ErrorFactory.validationError("Test error");

      errorMonitor.recordError(error, "/api/test");

      // Get history for very short time window
      const recentHistory = errorMonitor.getErrorHistory(1); // 1ms
      expect(recentHistory).toHaveLength(0);

      // Get history for longer time window
      const fullHistory = errorMonitor.getErrorHistory(60000); // 1 minute
      expect(fullHistory).toHaveLength(1);
    });
  });

  describe("Metrics Reset", () => {
    it("should reset all metrics", () => {
      const error = ErrorFactory.validationError("Test error");

      errorMonitor.recordError(error, "/api/test");

      let metrics = errorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(1);

      errorMonitor.resetMetrics();

      metrics = errorMonitor.getMetrics();
      expect(metrics.errorCount).toBe(0);
      expect(metrics.errorsByType).toEqual({});
      expect(metrics.errorsByEndpoint).toEqual({});
      expect(errorMonitor.getErrorHistory(60000)).toHaveLength(0);
    });
  });

  describe("Alert Conditions", () => {
    it("should trigger alert when error threshold exceeded", () => {
      const error = ErrorFactory.validationError("Test error");

      // Record errors up to threshold
      for (let i = 0; i < 3; i++) {
        errorMonitor.recordError(error, "/api/test");
      }

      expect(logger.error).toHaveBeenCalledWith(
        "ALERT TRIGGERED",
        expect.objectContaining({
          alert: expect.objectContaining({
            alertType: "ERROR_THRESHOLD_EXCEEDED",
            details: expect.objectContaining({
              errorCount: 3,
              timeWindow: 60000,
              endpoint: "/api/test",
            }),
          }),
        })
      );
    });

    it("should trigger alert for critical error types", () => {
      const error = ErrorFactory.databaseError("Connection failed");

      errorMonitor.recordError(error, "/api/database");

      expect(logger.error).toHaveBeenCalledWith(
        "ALERT TRIGGERED",
        expect.objectContaining({
          alert: expect.objectContaining({
            alertType: "CRITICAL_ERROR_TYPE",
            details: expect.objectContaining({
              errorType: "DATABASE_ERROR",
              errorMessage: "Database error: Connection failed",
              endpoint: "/api/database",
            }),
          }),
        })
      );
    });

    it("should trigger alert for high error rate", () => {
      const error = ErrorFactory.validationError("Test error");

      // Record many errors to trigger high error rate
      for (let i = 0; i < 15; i++) {
        errorMonitor.recordError(error, "/api/test");
      }

      expect(logger.error).toHaveBeenCalledWith(
        "ALERT TRIGGERED",
        expect.objectContaining({
          alert: expect.objectContaining({
            alertType: "HIGH_ERROR_RATE",
            details: expect.objectContaining({
              errorRate: 15,
              endpoint: "/api/test",
            }),
          }),
        })
      );
    });
  });

  describe("External Service Integration", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });
    });

    it("should send webhook alert", async () => {
      const error = ErrorFactory.databaseError("Connection failed");

      errorMonitor.recordError(error, "/api/database");

      // Wait for async alert sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("CRITICAL_ERROR_TYPE"),
        })
      );
    });

    it("should send Slack alert", async () => {
      const error = ErrorFactory.databaseError("Connection failed");

      errorMonitor.recordError(error, "/api/database");

      // Wait for async alert sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("Alert: CRITICAL_ERROR_TYPE"),
        })
      );
    });

    it("should handle webhook failures gracefully", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const error = ErrorFactory.databaseError("Connection failed");

      errorMonitor.recordError(error, "/api/database");

      // Wait for async alert sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to send alert to external services",
        expect.objectContaining({
          context: "error-monitoring",
          error: "Network error",
        })
      );
    });
  });

  describe("Memory Management", () => {
    it("should clean up old error history", () => {
      const error = ErrorFactory.validationError("Test error");

      // Mock Date.now to simulate old errors
      const originalNow = Date.now;
      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      Date.now = jest.fn().mockReturnValue(oldTime);
      errorMonitor.recordError(error, "/api/test");

      Date.now = originalNow;

      // Trigger cleanup manually (normally done by interval)
      (errorMonitor as any).cleanupErrorHistory();

      const history = errorMonitor.getErrorHistory(24 * 60 * 60 * 1000); // 24 hours
      expect(history).toHaveLength(0);
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", () => {
      const customMonitor = new ErrorMonitor({
        errorThreshold: 5,
        timeWindowMs: 30000, // 30 seconds
        criticalErrorTypes: ["CUSTOM_ERROR"],
      });

      const error = ErrorFactory.validationError("Test error");

      // Should not trigger alert with threshold of 5
      for (let i = 0; i < 3; i++) {
        customMonitor.recordError(error, "/api/test");
      }

      expect(logger.error).not.toHaveBeenCalledWith(
        "ALERT TRIGGERED",
        expect.anything()
      );
    });
  });
});
