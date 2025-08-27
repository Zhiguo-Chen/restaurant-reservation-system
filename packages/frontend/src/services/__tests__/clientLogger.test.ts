import { clientLogger } from "../clientLogger";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
const originalConsole = { ...console };
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

describe("ClientLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  describe("Basic Logging", () => {
    it("should log debug messages", () => {
      clientLogger.debug("Debug message", { data: "test" });

      const logs = clientLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("debug");
      expect(logs[0].message).toBe("Debug message");
      expect(logs[0].data).toEqual({ data: "test" });
    });

    it("should log info messages", () => {
      clientLogger.info("Info message");

      const logs = clientLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("info");
      expect(logs[0].message).toBe("Info message");
    });

    it("should log warning messages", () => {
      clientLogger.warn("Warning message");

      const logs = clientLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("warn");
      expect(logs[0].message).toBe("Warning message");
    });

    it("should log error messages", () => {
      clientLogger.error("Error message");

      const logs = clientLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe("error");
      expect(logs[0].message).toBe("Error message");
    });
  });

  describe("Log Entry Properties", () => {
    it("should include timestamp in log entries", () => {
      const beforeLog = new Date();
      clientLogger.info("Test message");
      const afterLog = new Date();

      const logs = clientLogger.getLogs();
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeLog.getTime()
      );
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(
        afterLog.getTime()
      );
    });

    it("should include URL and user agent", () => {
      clientLogger.info("Test message");

      const logs = clientLogger.getLogs();
      expect(logs[0].url).toBe(window.location.href);
      expect(logs[0].userAgent).toBe(navigator.userAgent);
    });

    it("should include session ID", () => {
      clientLogger.info("Test message");

      const logs = clientLogger.getLogs();
      expect(logs[0].sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe("Specialized Logging Methods", () => {
    it("should log user actions", () => {
      clientLogger.logUserAction("button_click", { buttonId: "submit" });

      const logs = clientLogger.getLogs();
      expect(logs[0].level).toBe("info");
      expect(logs[0].message).toBe("User Action: button_click");
      expect(logs[0].data).toEqual({
        action: "button_click",
        details: { buttonId: "submit" },
        timestamp: expect.any(String),
      });
    });

    it("should log API calls", () => {
      clientLogger.logApiCall("GET", "/api/users", 200, 150);

      const logs = clientLogger.getLogs();
      expect(logs[0].level).toBe("info");
      expect(logs[0].message).toBe("API Call: GET /api/users");
      expect(logs[0].data).toEqual({
        method: "GET",
        url: "/api/users",
        status: 200,
        duration: 150,
        error: undefined,
      });
    });

    it("should log API call errors", () => {
      const error = new Error("Network error");
      clientLogger.logApiCall("POST", "/api/users", 500, 1000, error);

      const logs = clientLogger.getLogs();
      expect(logs[0].level).toBe("error");
      expect(logs[0].data.error).toBe("Network error");
    });

    it("should log performance metrics", () => {
      clientLogger.logPerformance("page_load", 1500, "ms");

      const logs = clientLogger.getLogs();
      expect(logs[0].level).toBe("debug");
      expect(logs[0].message).toBe("Performance: page_load");
      expect(logs[0].data).toEqual({
        metric: "page_load",
        value: 1500,
        unit: "ms",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Log Filtering and Retrieval", () => {
    beforeEach(() => {
      clientLogger.clearLogs();
      clientLogger.debug("Debug message");
      clientLogger.info("Info message");
      clientLogger.warn("Warning message");
      clientLogger.error("Error message");
    });

    it("should get logs by level", () => {
      const errorLogs = clientLogger.getLogsByLevel("error");
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe("Error message");

      const warnLogs = clientLogger.getLogsByLevel("warn");
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].message).toBe("Warning message");
    });

    it("should get recent logs", () => {
      const recentLogs = clientLogger.getRecentLogs(2);
      expect(recentLogs).toHaveLength(2);
      expect(recentLogs[0].message).toBe("Warning message"); // Second to last
      expect(recentLogs[1].message).toBe("Error message"); // Last
    });

    it("should get error summary", () => {
      clientLogger.error("Network error", { errorType: "NetworkError" });
      clientLogger.error("Validation error", { errorType: "ValidationError" });
      clientLogger.error("Another network error", {
        errorType: "NetworkError",
      });

      const summary = clientLogger.getErrorSummary();
      expect(summary.totalErrors).toBe(4); // Including the one from beforeEach
      expect(summary.errorsByType).toEqual({
        Unknown: 1, // From beforeEach
        NetworkError: 2,
        ValidationError: 1,
      });
      expect(summary.recentErrors).toHaveLength(4);
    });
  });

  describe("Storage Management", () => {
    it("should save logs to localStorage", () => {
      clientLogger.info("Test message");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "client_logs",
        expect.stringContaining("Test message")
      );
    });

    it("should load logs from localStorage", () => {
      const storedLogs = {
        sessionId: "test_session",
        logs: [
          {
            level: "info",
            message: "Stored message",
            timestamp: new Date().toISOString(),
            url: "http://test.com",
            userAgent: "test-agent",
            sessionId: "test_session",
          },
        ],
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedLogs));

      // Create new logger instance to trigger loading
      const { ClientLogger } = require("../clientLogger");
      const newLogger = new ClientLogger();

      const logs = newLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Stored message");
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should not throw
      expect(() => {
        const { ClientLogger } = require("../clientLogger");
        new ClientLogger();
      }).not.toThrow();
    });

    it("should clear logs", () => {
      clientLogger.info("Test message");
      expect(clientLogger.getLogs()).toHaveLength(1);

      clientLogger.clearLogs();
      expect(clientLogger.getLogs()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("client_logs");
    });
  });

  describe("Export Functionality", () => {
    it("should export logs as JSON", () => {
      clientLogger.info("Test message");

      const exported = clientLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty("sessionId");
      expect(parsed).toHaveProperty("exportTime");
      expect(parsed).toHaveProperty("logs");
      expect(parsed.logs).toHaveLength(1);
      expect(parsed.logs[0].message).toBe("Test message");
    });
  });

  describe("Configuration", () => {
    it("should respect log level configuration", () => {
      const { ClientLogger } = require("../clientLogger");
      const logger = new ClientLogger({
        logLevels: ["error"],
      });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Error message");
    });

    it("should respect max entries limit", () => {
      const { ClientLogger } = require("../clientLogger");
      const logger = new ClientLogger({
        maxEntries: 2,
      });

      logger.info("Message 1");
      logger.info("Message 2");
      logger.info("Message 3");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe("Message 2");
      expect(logs[1].message).toBe("Message 3");
    });
  });

  describe("Remote Logging", () => {
    it("should send errors to remote endpoint", async () => {
      const { ClientLogger } = require("../clientLogger");
      const logger = new ClientLogger({
        enableRemote: true,
        remoteEndpoint: "https://api.example.com/logs",
      });

      logger.error("Remote error");

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalledWith(
        "https://api.example.com/logs",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("Remote error"),
        })
      );
    });

    it("should handle remote logging failures gracefully", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { ClientLogger } = require("../clientLogger");
      const logger = new ClientLogger({
        enableRemote: true,
        remoteEndpoint: "https://api.example.com/logs",
      });

      // Should not throw
      expect(() => {
        logger.error("Remote error");
      }).not.toThrow();
    });
  });
});
