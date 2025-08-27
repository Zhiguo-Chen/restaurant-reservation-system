import { Request, Response, NextFunction } from "express";
import { AuthMiddleware } from "../auth";
import { AuthService } from "../../interfaces/services";
import { UserRole, UserInfo } from "@restaurant-reservation/shared";

describe("AuthMiddleware", () => {
  let authMiddleware: AuthMiddleware;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser: UserInfo = {
    id: "user-123",
    username: "testuser",
    role: UserRole.EMPLOYEE,
  };

  beforeEach(() => {
    mockAuthService = {
      login: jest.fn(),
      logout: jest.fn(),
      validateToken: jest.fn(),
      generateToken: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    authMiddleware = new AuthMiddleware(mockAuthService);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("should authenticate valid token and set user", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith("valid-token");
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 401 when no authorization header", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token required",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is malformed", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "InvalidFormat token",
      };

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token required",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token validation fails", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token")
      );

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "invalid-token"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired authentication token",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should use request ID from headers when available", async () => {
      // Arrange
      mockRequest.headers = {
        "x-request-id": "req-123",
      };

      // Act
      await authMiddleware.authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token required",
          timestamp: expect.any(String),
          requestId: "req-123",
        },
      });
    });
  });

  describe("authorize", () => {
    it("should allow access for authorized role", () => {
      // Arrange
      mockRequest.user = mockUser;
      const authorizeMiddleware = authMiddleware.authorize([
        UserRole.EMPLOYEE,
        UserRole.ADMIN,
      ]);

      // Act
      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", () => {
      // Arrange
      mockRequest.user = undefined;
      const authorizeMiddleware = authMiddleware.authorize([UserRole.EMPLOYEE]);

      // Act
      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 403 when user role is not authorized", () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.EMPLOYEE };
      const authorizeMiddleware = authMiddleware.authorize([UserRole.ADMIN]);

      // Act
      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("requireEmployee", () => {
    it("should allow access for employee role", () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.EMPLOYEE };

      // Act
      authMiddleware.requireEmployee(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow access for admin role", () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.ADMIN };

      // Act
      authMiddleware.requireEmployee(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("should allow access for admin role", () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.ADMIN };

      // Act
      authMiddleware.requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should deny access for employee role", () => {
      // Arrange
      mockRequest.user = { ...mockUser, role: UserRole.EMPLOYEE };

      // Act
      authMiddleware.requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    it("should set user when valid token is provided", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      // Act
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith("valid-token");
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should continue without user when no token is provided", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should continue without user when token validation fails", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token")
      );

      // Act
      await authMiddleware.optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "invalid-token"
      );
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
