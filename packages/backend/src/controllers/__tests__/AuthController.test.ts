import { Request, Response } from "express";
import { AuthControllerImpl } from "../AuthController";
import { AuthService } from "../../interfaces/services";
import {
  LoginRequest,
  AuthResponse,
  UserInfo,
  UserRole,
} from "@restaurant-reservation/shared";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("AuthController", () => {
  let authController: AuthControllerImpl;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUserInfo: UserInfo = {
    id: "user-123",
    username: "testuser",
    role: UserRole.EMPLOYEE,
  };

  const mockAuthResponse: AuthResponse = {
    token: "jwt-token",
    user: mockUserInfo,
    expiresIn: 86400,
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

    authController = new AuthControllerImpl(mockAuthService);

    mockRequest = {
      body: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("login", () => {
    const validLoginRequest: LoginRequest = {
      username: "testuser",
      password: "password123",
    };

    it("should login successfully with valid credentials", async () => {
      // Arrange
      mockRequest.body = validLoginRequest;
      mockRequest.headers = { "x-request-id": "req-123" };
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(validLoginRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAuthResponse);
    });

    it("should return 400 for missing username", async () => {
      // Arrange
      mockRequest.body = { password: "password123" };
      mockRequest.headers = { "x-request-id": "req-123" };

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login request",
          details: [
            {
              field: "username",
              message: "Username is required and must be a string",
              code: "REQUIRED",
            },
          ],
          timestamp: expect.any(String),
          requestId: "req-123",
        },
      });
    });

    it("should return 400 for empty username", async () => {
      // Arrange
      mockRequest.body = { username: "   ", password: "password123" };

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login request",
          details: [
            {
              field: "username",
              message: "Username cannot be empty",
              code: "EMPTY",
            },
          ],
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });

    it("should return 400 for missing password", async () => {
      // Arrange
      mockRequest.body = { username: "testuser" };

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login request",
          details: [
            {
              field: "password",
              message: "Password is required and must be a string",
              code: "REQUIRED",
            },
          ],
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });

    it("should return 401 for invalid credentials", async () => {
      // Arrange
      mockRequest.body = validLoginRequest;
      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Arrange
      mockRequest.body = validLoginRequest;
      mockAuthService.login.mockRejectedValue(new Error("Database error"));

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred during login",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully with valid token", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer valid-token" };
      mockAuthService.logout.mockResolvedValue();

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith("valid-token");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
        timestamp: expect.any(String),
      });
    });

    it("should return 400 for missing authorization header", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "MISSING_TOKEN",
          message: "Authorization token required for logout",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });

    it("should return 400 for malformed authorization header", async () => {
      // Arrange
      mockRequest.headers = { authorization: "InvalidFormat token" };

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 for invalid token", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer invalid-token" };
      mockAuthService.logout.mockRejectedValue(new Error("Invalid token"));

      // Act
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });
  });

  describe("validateToken", () => {
    it("should validate token successfully", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer valid-token" };
      mockAuthService.validateToken.mockResolvedValue(mockUserInfo);

      // Act
      await authController.validateToken(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.validateToken).toHaveBeenCalledWith("valid-token");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        valid: true,
        user: mockUserInfo,
        timestamp: expect.any(String),
      });
    });

    it("should return 400 for missing authorization header", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authController.validateToken(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "MISSING_TOKEN",
          message: "Authorization token required",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });

    it("should return 401 for invalid token", async () => {
      // Arrange
      mockRequest.headers = { authorization: "Bearer invalid-token" };
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token")
      );

      // Act
      await authController.validateToken(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
          timestamp: expect.any(String),
          requestId: "unknown",
        },
      });
    });
  });
});
