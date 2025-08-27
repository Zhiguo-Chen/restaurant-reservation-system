import { AuthServiceImpl } from "../AuthService";
import { UserRepository } from "../../interfaces/repositories";
import {
  User,
  UserRole,
  LoginRequest,
  UserInfo,
} from "@restaurant-reservation/shared";
import { JwtUtils } from "../../utils/jwt";
import { PasswordUtils } from "../../utils/password";

// Mock the utilities
jest.mock("../../utils/jwt");
jest.mock("../../utils/password");

const mockJwtUtils = JwtUtils as jest.Mocked<typeof JwtUtils>;
const mockPasswordUtils = PasswordUtils as jest.Mocked<typeof PasswordUtils>;

describe("AuthService", () => {
  let authService: AuthServiceImpl;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: "user-123",
    username: "testuser",
    passwordHash: "hashed-password",
    role: UserRole.EMPLOYEE,
    createdAt: new Date("2024-01-01"),
  };

  const mockUserInfo: UserInfo = {
    id: mockUser.id,
    username: mockUser.username,
    role: mockUser.role,
  };

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUsername: jest.fn(),
    };

    authService = new AuthServiceImpl(mockUserRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginRequest: LoginRequest = {
      username: "testuser",
      password: "password123",
    };

    it("should successfully login with valid credentials", async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockPasswordUtils.comparePassword.mockResolvedValue(true);
      mockJwtUtils.generateToken.mockReturnValue("jwt-token");
      mockJwtUtils.getTokenExpirationTime.mockReturnValue(86400);

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        "testuser"
      );
      expect(mockPasswordUtils.comparePassword).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith(mockUserInfo);
      expect(result).toEqual({
        token: "jwt-token",
        user: mockUserInfo,
        expiresIn: 86400,
      });
    });

    it("should throw error when user not found", async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginRequest)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockPasswordUtils.comparePassword).not.toHaveBeenCalled();
    });

    it("should throw error when password is invalid", async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockPasswordUtils.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginRequest)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockJwtUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should successfully logout with valid token", async () => {
      // Arrange
      const token = "valid-token";
      mockJwtUtils.verifyToken.mockReturnValue({
        id: "user-123",
        username: "testuser",
        role: UserRole.EMPLOYEE,
      });

      // Act
      await authService.logout(token);

      // Assert
      expect(mockJwtUtils.verifyToken).toHaveBeenCalledWith(token);
    });

    it("should throw error with invalid token", async () => {
      // Arrange
      const token = "invalid-token";
      mockJwtUtils.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Act & Assert
      await expect(authService.logout(token)).rejects.toThrow("Invalid token");
    });
  });

  describe("validateToken", () => {
    const token = "valid-token";
    const decodedPayload = {
      id: "user-123",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    it("should successfully validate token and return user info", async () => {
      // Arrange
      mockJwtUtils.verifyToken.mockReturnValue(decodedPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockJwtUtils.extractUserInfo.mockReturnValue(mockUserInfo);

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(mockJwtUtils.verifyToken).toHaveBeenCalledWith(token);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockJwtUtils.extractUserInfo).toHaveBeenCalledWith(decodedPayload);
      expect(result).toEqual(mockUserInfo);
    });

    it("should throw error when token is invalid", async () => {
      // Arrange
      mockJwtUtils.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Act & Assert
      await expect(authService.validateToken(token)).rejects.toThrow(
        "Invalid or expired token"
      );
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw error when user no longer exists", async () => {
      // Arrange
      mockJwtUtils.verifyToken.mockReturnValue(decodedPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateToken(token)).rejects.toThrow(
        "Invalid or expired token"
      );
    });
  });

  describe("generateToken", () => {
    it("should generate token using JwtUtils", () => {
      // Arrange
      mockJwtUtils.generateToken.mockReturnValue("generated-token");

      // Act
      const result = authService.generateToken(mockUserInfo);

      // Assert
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith(mockUserInfo);
      expect(result).toBe("generated-token");
    });
  });

  describe("hashPassword", () => {
    it("should hash password using PasswordUtils", async () => {
      // Arrange
      const password = "password123";
      const hashedPassword = "hashed-password";
      mockPasswordUtils.hashPassword.mockResolvedValue(hashedPassword);

      // Act
      const result = await authService.hashPassword(password);

      // Assert
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith(password);
      expect(result).toBe(hashedPassword);
    });
  });

  describe("comparePassword", () => {
    it("should compare password using PasswordUtils", async () => {
      // Arrange
      const password = "password123";
      const hash = "hashed-password";
      mockPasswordUtils.comparePassword.mockResolvedValue(true);

      // Act
      const result = await authService.comparePassword(password, hash);

      // Assert
      expect(mockPasswordUtils.comparePassword).toHaveBeenCalledWith(
        password,
        hash
      );
      expect(result).toBe(true);
    });
  });
});
