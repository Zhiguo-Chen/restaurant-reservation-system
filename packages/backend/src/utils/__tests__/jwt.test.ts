import jwt from "jsonwebtoken";
import { JwtUtils, JwtPayload } from "../jwt";
import { UserInfo, UserRole } from "@restaurant-reservation/shared";
import { config } from "../../config/environment";

// Mock the config
jest.mock("../../config/environment", () => ({
  config: {
    JWT_SECRET: "test-secret",
    JWT_EXPIRES_IN: "24h",
  },
}));

describe("JwtUtils", () => {
  const mockUser: UserInfo = {
    id: "user-123",
    username: "testuser",
    role: UserRole.EMPLOYEE,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      // Act
      const token = JwtUtils.generateToken(mockUser);

      // Assert
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

      // Verify the token can be decoded
      const decoded = jwt.decode(token) as JwtPayload;
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe("restaurant-reservation-system");
      expect(decoded.aud).toBe("restaurant-reservation-users");
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      // Arrange
      const token = JwtUtils.generateToken(mockUser);

      // Act
      const decoded = JwtUtils.verifyToken(token);

      // Assert
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.iss).toBe("restaurant-reservation-system");
      expect(decoded.aud).toBe("restaurant-reservation-users");
    });

    it("should throw error for invalid token", () => {
      // Arrange
      const invalidToken = "invalid.token.here";

      // Act & Assert
      expect(() => JwtUtils.verifyToken(invalidToken)).toThrow("Invalid token");
    });

    it("should throw error for expired token", () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: "user-123", username: "test", role: UserRole.EMPLOYEE },
        config.JWT_SECRET,
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      // Act & Assert
      expect(() => JwtUtils.verifyToken(expiredToken)).toThrow(
        "Token has expired"
      );
    });

    it("should throw error for token with wrong issuer", () => {
      // Arrange
      const wrongIssuerToken = jwt.sign(
        { id: "user-123", username: "test", role: UserRole.EMPLOYEE },
        config.JWT_SECRET,
        { issuer: "wrong-issuer" }
      );

      // Act & Assert
      expect(() => JwtUtils.verifyToken(wrongIssuerToken)).toThrow(
        "Invalid token"
      );
    });
  });

  describe("decodeToken", () => {
    it("should decode token without verification", () => {
      // Arrange
      const token = JwtUtils.generateToken(mockUser);

      // Act
      const decoded = JwtUtils.decodeToken(token);

      // Assert
      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe(mockUser.id);
      expect(decoded!.username).toBe(mockUser.username);
      expect(decoded!.role).toBe(mockUser.role);
    });

    it("should return null for invalid token", () => {
      // Arrange
      const invalidToken = "invalid-token";

      // Act
      const decoded = JwtUtils.decodeToken(invalidToken);

      // Assert
      expect(decoded).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for valid token", () => {
      // Arrange
      const token = JwtUtils.generateToken(mockUser);

      // Act
      const isExpired = JwtUtils.isTokenExpired(token);

      // Assert
      expect(isExpired).toBe(false);
    });

    it("should return true for expired token", () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: "user-123", username: "test", role: UserRole.EMPLOYEE },
        config.JWT_SECRET,
        { expiresIn: "-1h" }
      );

      // Act
      const isExpired = JwtUtils.isTokenExpired(expiredToken);

      // Assert
      expect(isExpired).toBe(true);
    });

    it("should return true for invalid token", () => {
      // Arrange
      const invalidToken = "invalid-token";

      // Act
      const isExpired = JwtUtils.isTokenExpired(invalidToken);

      // Assert
      expect(isExpired).toBe(true);
    });
  });

  describe("getTokenExpirationTime", () => {
    it("should return correct seconds for hours format", () => {
      // Mock config for this test
      jest.doMock("../../config/environment", () => ({
        config: { JWT_EXPIRES_IN: "2h" },
      }));

      // Act
      const seconds = JwtUtils.getTokenExpirationTime();

      // Assert
      expect(seconds).toBe(7200); // 2 hours = 7200 seconds
    });

    it("should return correct seconds for days format", () => {
      // Mock config for this test
      jest.doMock("../../config/environment", () => ({
        config: { JWT_EXPIRES_IN: "1d" },
      }));

      // Act
      const seconds = JwtUtils.getTokenExpirationTime();

      // Assert
      expect(seconds).toBe(86400); // 1 day = 86400 seconds
    });

    it("should return correct seconds for minutes format", () => {
      // Mock config for this test
      jest.doMock("../../config/environment", () => ({
        config: { JWT_EXPIRES_IN: "30m" },
      }));

      // Act
      const seconds = JwtUtils.getTokenExpirationTime();

      // Assert
      expect(seconds).toBe(1800); // 30 minutes = 1800 seconds
    });

    it("should return correct seconds for plain number", () => {
      // Mock config for this test
      jest.doMock("../../config/environment", () => ({
        config: { JWT_EXPIRES_IN: "3600" },
      }));

      // Act
      const seconds = JwtUtils.getTokenExpirationTime();

      // Assert
      expect(seconds).toBe(3600);
    });
  });

  describe("extractUserInfo", () => {
    it("should extract user info from JWT payload", () => {
      // Arrange
      const payload: JwtPayload = {
        id: "user-123",
        username: "testuser",
        role: UserRole.ADMIN,
        iat: 1234567890,
        exp: 1234567890,
        iss: "restaurant-reservation-system",
        aud: "restaurant-reservation-users",
      };

      // Act
      const userInfo = JwtUtils.extractUserInfo(payload);

      // Assert
      expect(userInfo).toEqual({
        id: "user-123",
        username: "testuser",
        role: UserRole.ADMIN,
      });
    });
  });
});
