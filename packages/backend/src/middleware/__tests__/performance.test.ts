import { Request, Response, NextFunction } from "express";
import {
  performanceMiddleware,
  DatabasePerformanceTracker,
  GraphQLPerformanceTracker,
  trackDatabaseOperation,
  trackGraphQLOperation,
} from "../performance";
import { logPerformance, logApiRequest } from "../../utils/logger";

// Mock logger functions
jest.mock("../../utils/logger", () => ({
  logPerformance: jest.fn(),
  logApiRequest: jest.fn(),
}));

// Mock requestId middleware
jest.mock("../requestId", () => ({
  getRequestId: jest.fn().mockReturnValue("test-request-id"),
}));

describe("Performance Monitoring", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      originalUrl: "/api/test",
      path: "/api/test",
      route: { path: "/api/test" },
      get: jest.fn().mockReturnValue("test-agent"),
      ip: "127.0.0.1",
    };

    mockRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("Performance Middleware", () => {
    it("should track request performance", (done) => {
      const originalEnd = mockRes.end;

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simulate response end after some time
      setTimeout(() => {
        mockRes.end!();

        expect(logApiRequest).toHaveBeenCalledWith(
          "GET",
          "/api/test",
          200,
          expect.any(Number),
          undefined,
          undefined
        );

        expect(mockRes.setHeader).toHaveBeenCalledWith(
          "x-response-time",
          expect.stringMatching(/\d+ms/)
        );

        done();
      }, 10);
    });

    it("should log slow requests", (done) => {
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Mock a slow response
      setTimeout(() => {
        mockRes.end!();

        expect(logPerformance).toHaveBeenCalledWith(
          "GET /api/test",
          expect.any(Number),
          "slow-request",
          expect.objectContaining({
            requestId: "test-request-id",
            statusCode: 200,
          })
        );

        done();
      }, 1100); // Longer than 1000ms threshold
    });

    it("should track error responses", (done) => {
      mockRes.statusCode = 500;

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();

        expect(logApiRequest).toHaveBeenCalledWith(
          "GET",
          "/api/test",
          500,
          expect.any(Number),
          undefined,
          expect.any(Error)
        );

        done();
      }, 10);
    });

    it("should handle requests with user context", (done) => {
      (mockReq as any).user = { id: "user-123" };

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();

        expect(logApiRequest).toHaveBeenCalledWith(
          "GET",
          "/api/test",
          200,
          expect.any(Number),
          "user-123",
          undefined
        );

        done();
      }, 10);
    });
  });

  describe("Database Performance Tracker", () => {
    it("should track database operation performance", () => {
      const tracker = new DatabasePerformanceTracker("find", "reservations");

      // Simulate some processing time
      setTimeout(() => {
        tracker.end();

        expect(logPerformance).toHaveBeenCalledWith(
          "db.reservations.find",
          expect.any(Number),
          "database",
          expect.objectContaining({
            collection: "reservations",
            operation: "find",
          })
        );
      }, 10);
    });

    it("should track database operation with error", () => {
      const tracker = new DatabasePerformanceTracker("insert", "users");
      const error = new Error("Connection timeout");

      setTimeout(() => {
        tracker.end(error);

        expect(logPerformance).toHaveBeenCalledWith(
          "db.users.insert",
          expect.any(Number),
          "database",
          expect.objectContaining({
            collection: "users",
            operation: "insert",
            error: "Connection timeout",
          })
        );
      }, 10);
    });

    it("should log slow database operations", () => {
      const tracker = new DatabasePerformanceTracker(
        "aggregate",
        "reservations"
      );

      // Mock slow operation
      setTimeout(() => {
        tracker.end();

        expect(logPerformance).toHaveBeenCalledWith(
          "SLOW DB: reservations.aggregate",
          expect.any(Number),
          "slow-database",
          expect.objectContaining({
            collection: "reservations",
            operation: "aggregate",
          })
        );
      }, 600); // Longer than 500ms threshold
    });

    it("should create tracker using factory function", () => {
      const tracker = trackDatabaseOperation("update", "users");

      expect(tracker).toBeInstanceOf(DatabasePerformanceTracker);

      tracker.end();

      expect(logPerformance).toHaveBeenCalledWith(
        "db.users.update",
        expect.any(Number),
        "database",
        expect.objectContaining({
          collection: "users",
          operation: "update",
        })
      );
    });
  });

  describe("GraphQL Performance Tracker", () => {
    it("should track GraphQL operation performance", () => {
      const tracker = new GraphQLPerformanceTracker("getReservations");

      setTimeout(() => {
        tracker.end();

        expect(logPerformance).toHaveBeenCalledWith(
          "graphql.getReservations",
          expect.any(Number),
          "graphql",
          expect.objectContaining({
            operationName: "getReservations",
          })
        );
      }, 10);
    });

    it("should track GraphQL operation with error", () => {
      const tracker = new GraphQLPerformanceTracker("createReservation");
      const error = new Error("Validation failed");

      setTimeout(() => {
        tracker.end(error);

        expect(logPerformance).toHaveBeenCalledWith(
          "graphql.createReservation",
          expect.any(Number),
          "graphql",
          expect.objectContaining({
            operationName: "createReservation",
            error: "Validation failed",
          })
        );
      }, 10);
    });

    it("should log slow GraphQL operations", () => {
      const tracker = new GraphQLPerformanceTracker("complexQuery");

      setTimeout(() => {
        tracker.end();

        expect(logPerformance).toHaveBeenCalledWith(
          "SLOW GraphQL: complexQuery",
          expect.any(Number),
          "slow-graphql",
          expect.objectContaining({
            operationName: "complexQuery",
          })
        );
      }, 1100); // Longer than 1000ms threshold
    });

    it("should create tracker using factory function", () => {
      const tracker = trackGraphQLOperation("updateReservation");

      expect(tracker).toBeInstanceOf(GraphQLPerformanceTracker);

      tracker.end();

      expect(logPerformance).toHaveBeenCalledWith(
        "graphql.updateReservation",
        expect.any(Number),
        "graphql",
        expect.objectContaining({
          operationName: "updateReservation",
        })
      );
    });
  });

  describe("Performance Thresholds", () => {
    it("should not log fast requests as slow", (done) => {
      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();

        expect(logPerformance).not.toHaveBeenCalledWith(
          expect.stringContaining("GET /api/test"),
          expect.any(Number),
          "slow-request",
          expect.anything()
        );

        done();
      }, 100); // Less than 1000ms threshold
    });

    it("should not log fast database operations as slow", () => {
      const tracker = new DatabasePerformanceTracker("find", "users");

      setTimeout(() => {
        tracker.end();

        expect(logPerformance).not.toHaveBeenCalledWith(
          expect.stringContaining("SLOW DB"),
          expect.any(Number),
          "slow-database",
          expect.anything()
        );
      }, 100); // Less than 500ms threshold
    });

    it("should not log fast GraphQL operations as slow", () => {
      const tracker = new GraphQLPerformanceTracker("simpleQuery");

      setTimeout(() => {
        tracker.end();

        expect(logPerformance).not.toHaveBeenCalledWith(
          expect.stringContaining("SLOW GraphQL"),
          expect.any(Number),
          "slow-graphql",
          expect.anything()
        );
      }, 500); // Less than 1000ms threshold
    });
  });

  describe("Error Handling", () => {
    it("should handle missing route path gracefully", (done) => {
      delete mockReq.route;

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();

        expect(logPerformance).toHaveBeenCalledWith(
          "GET /api/test",
          expect.any(Number),
          "slow-request",
          expect.anything()
        );

        done();
      }, 1100);
    });

    it("should handle missing user agent gracefully", (done) => {
      (mockReq.get as jest.Mock).mockReturnValue(undefined);

      performanceMiddleware(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        mockRes.end!();

        expect(logApiRequest).toHaveBeenCalledWith(
          "GET",
          "/api/test",
          200,
          expect.any(Number),
          undefined,
          undefined
        );

        done();
      }, 10);
    });
  });
});
