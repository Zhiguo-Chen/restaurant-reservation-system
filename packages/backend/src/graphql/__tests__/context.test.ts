import { Request, Response } from "express";
import {
  createContext,
  requireAuth,
  requireRole,
  isAuthenticated,
  getCurrentUser,
} from "../context";
import { AuthService } from "../../interfaces/services";
import { UserInfo, UserRole } from "@restaurant-reservation/shared";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("GraphQL Context", () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

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

    mockRequest = {
      headers: {},
      body: {},
    };

    mockResponse = {};

    jest.clearAllMocks();
  });

  describe("createContext", () => {
    it("should create context without user when no auth header", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      const context = await createContext(
        { req: mockRequest as Request, res: mockResponse as Response },
        mockAuthService
      );

      // Assert
      expect(context.req).toBe(mockRequest);
      expect(context.res).toBe(mockResponse);
      expect(context.authService).toBe(mockAuthService);
      expect(context.user).toBeUndefined();
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });

    it("should create context with user when valid auth header", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      };
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      // Act
      const context = await createContext(
        { req: mockRequest as Request, res: mockResponse as Response },
        mockAuthService
      );

      // Assert
      expect(context.user).toEqual(mockUser);
      expect(mockAuthService.validateToken).toHaveBeenCalledWith("valid-token");
    });

    it("should create context without user when invalid auth header", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };
      mockAuthService.validateToken.mockRejectedValue(
        new Error("Invalid token")
      );

      // Act
      const context = await createContext(
        { req: mockRequest as Request, res: mockResponse as Response },
        mockAuthService
      );

      // Assert
      expect(context.user).toBeUndefined();
      expect(mockAuthService.validateToken).toHaveBeenCalledWith(
        "invalid-token"
      );
    });

    it("should ignore malformed auth header", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "InvalidFormat token",
      };

      // Act
      const context = await createContext(
        { req: mockRequest as Request, res: mockResponse as Response },
        mockAuthService
      );

      // Assert
      expect(context.user).toBeUndefined();
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
    });
  });

  describe("requireAuth", () => {
    it("should return user when authenticated", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
        user: mockUser,
      };

      // Act
      const result = requireAuth(context);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it("should throw error when not authenticated", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
      };

      // Act & Assert
      expect(() => requireAuth(context)).toThrow("Authentication required");
    });
  });

  describe("requireRole", () => {
    it("should return user when user has required role", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
        user: mockUser,
      };

      // Act
      const result = requireRole(context, [UserRole.EMPLOYEE, UserRole.ADMIN]);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it("should throw error when user does not have required role", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
        user: { ...mockUser, role: UserRole.EMPLOYEE },
      };

      // Act & Assert
      expect(() => requireRole(context, [UserRole.ADMIN])).toThrow(
        "Insufficient permissions"
      );
    });

    it("should throw error when not authenticated", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
      };

      // Act & Assert
      expect(() => requireRole(context, [UserRole.EMPLOYEE])).toThrow(
        "Authentication required"
      );
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user is present", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
        user: mockUser,
      };

      // Act
      const result = isAuthenticated(context);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when user is not present", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
      };

      // Act
      const result = isAuthenticated(context);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should return user when authenticated", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
        user: mockUser,
      };

      // Act
      const result = getCurrentUser(context);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it("should return null when not authenticated", () => {
      // Arrange
      const context = {
        req: mockRequest as Request,
        res: mockResponse as Response,
        authService: mockAuthService,
      };

      // Act
      const result = getCurrentUser(context);

      // Assert
      expect(result).toBeNull();
    });
  });
});
