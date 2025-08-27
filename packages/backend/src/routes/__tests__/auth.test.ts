import request from "supertest";
import express from "express";
import { createAuthRoutes } from "../auth";
import { UserRepository } from "../../interfaces/repositories";
import { User, UserRole } from "@restaurant-reservation/shared";
import { PasswordUtils } from "../../utils/password";
import { errorHandler, notFoundHandler } from "../../middleware/errorHandler";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Auth Routes", () => {
  let app: express.Application;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: "user-123",
    username: "testuser",
    passwordHash: "hashed-password",
    role: UserRole.EMPLOYEE,
    createdAt: new Date("2024-01-01"),
  };

  beforeEach(async () => {
    // Create mock repository
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUsername: jest.fn(),
    };

    // Create Express app
    app = express();
    app.use(express.json());
    app.use("/auth", createAuthRoutes(mockUserRepository));
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "password123",
      };

      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtils, "comparePassword").mockResolvedValue(true);

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("expiresIn");
      expect(response.body.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        "testuser"
      );
    });

    it("should return 400 for missing username", async () => {
      // Arrange
      const loginData = {
        password: "password123",
      };

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(400);

      // Assert
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toContainEqual({
        field: "username",
        message: "Username is required",
        code: "REQUIRED",
      });
    });

    it("should return 400 for missing password", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
      };

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(400);

      // Assert
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toContainEqual({
        field: "password",
        message: "Password is required",
        code: "REQUIRED",
      });
    });

    it("should return 400 for invalid content type", async () => {
      // Act
      const response = await request(app)
        .post("/auth/login")
        .set("Content-Type", "text/plain")
        .send("invalid data")
        .expect(400);

      // Assert
      expect(response.body.error.code).toBe("INVALID_CONTENT_TYPE");
    });

    it("should return 401 for invalid credentials", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "wrongpassword",
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should return 401 for wrong password", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "wrongpassword",
      };

      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      jest.spyOn(PasswordUtils, "comparePassword").mockResolvedValue(false);

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully with valid token", async () => {
      // Arrange
      const token = "valid-jwt-token";

      // Act
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.message).toBe("Logged out successfully");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should return 400 for missing authorization header", async () => {
      // Act
      const response = await request(app).post("/auth/logout").expect(400);

      // Assert
      expect(response.body.error.code).toBe("MISSING_TOKEN");
    });

    it("should return 400 for malformed authorization header", async () => {
      // Act
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "InvalidFormat token")
        .expect(400);

      // Assert
      expect(response.body.error.code).toBe("MISSING_TOKEN");
    });
  });

  describe("GET /auth/validate", () => {
    it("should validate token successfully", async () => {
      // Arrange
      const token = "valid-jwt-token";
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .get("/auth/validate")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.valid).toBe(true);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should return 400 for missing authorization header", async () => {
      // Act
      const response = await request(app).get("/auth/validate").expect(400);

      // Assert
      expect(response.body.error.code).toBe("MISSING_TOKEN");
    });

    it("should return 401 for invalid token", async () => {
      // Act
      const response = await request(app)
        .get("/auth/validate")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      // Assert
      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("GET /auth/me", () => {
    it("should return user info for authenticated request", async () => {
      // Arrange
      const token = "valid-jwt-token";
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should return 401 for missing token", async () => {
      // Act
      const response = await request(app).get("/auth/me").expect(401);

      // Assert
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 401 for invalid token", async () => {
      // Act
      const response = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      // Assert
      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("Error handling", () => {
    it("should handle repository errors gracefully", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "password123",
      };

      mockUserRepository.findByUsername.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const response = await request(app)
        .post("/auth/login")
        .send(loginData)
        .expect(500);

      // Assert
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
    });

    it("should include request ID in error responses", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "password123",
      };

      mockUserRepository.findByUsername.mockRejectedValue(
        new Error("Database error")
      );

      // Act
      const response = await request(app)
        .post("/auth/login")
        .set("x-request-id", "test-request-123")
        .send(loginData)
        .expect(500);

      // Assert
      expect(response.body.error.requestId).toBe("test-request-123");
    });
  });
});
