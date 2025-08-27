import bcrypt from "bcrypt";
import { PasswordUtils } from "../password";

// Mock bcrypt
jest.mock("bcrypt");
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("PasswordUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      // Arrange
      const password = "password123";
      const hashedPassword = "hashed-password";
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      // Act
      const result = await PasswordUtils.hashPassword(password);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it("should throw error when hashing fails", async () => {
      // Arrange
      const password = "password123";
      mockBcrypt.hash.mockRejectedValue(new Error("Hashing failed"));

      // Act & Assert
      await expect(PasswordUtils.hashPassword(password)).rejects.toThrow(
        "Failed to hash password"
      );
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      // Arrange
      const password = "password123";
      const hash = "hashed-password";
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await PasswordUtils.comparePassword(password, hash);

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      // Arrange
      const password = "password123";
      const hash = "hashed-password";
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await PasswordUtils.comparePassword(password, hash);

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it("should throw error when comparison fails", async () => {
      // Arrange
      const password = "password123";
      const hash = "hashed-password";
      mockBcrypt.compare.mockRejectedValue(new Error("Comparison failed"));

      // Act & Assert
      await expect(
        PasswordUtils.comparePassword(password, hash)
      ).rejects.toThrow("Failed to compare password");
    });
  });

  describe("validatePasswordStrength", () => {
    it("should return valid for strong password", () => {
      // Arrange
      const strongPassword = "StrongP@ssw0rd123";

      // Act
      const result = PasswordUtils.validatePasswordStrength(strongPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return invalid for short password", () => {
      // Arrange
      const shortPassword = "Sh0rt!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(shortPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should return invalid for password without lowercase", () => {
      // Arrange
      const password = "PASSWORD123!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should return invalid for password without uppercase", () => {
      // Arrange
      const password = "password123!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should return invalid for password without digit", () => {
      // Arrange
      const password = "Password!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one digit"
      );
    });

    it("should return invalid for password without special character", () => {
      // Arrange
      const password = "Password123";

      // Act
      const result = PasswordUtils.validatePasswordStrength(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character"
      );
    });

    it("should return invalid for password with common patterns", () => {
      // Arrange
      const password = "Password123456!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password contains common patterns and is not secure"
      );
    });

    it("should return invalid for too long password", () => {
      // Arrange
      const longPassword = "A".repeat(129) + "1!";

      // Act
      const result = PasswordUtils.validatePasswordStrength(longPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must not exceed 128 characters"
      );
    });
  });

  describe("generateRandomPassword", () => {
    it("should generate password with default length", () => {
      // Act
      const password = PasswordUtils.generateRandomPassword();

      // Assert
      expect(password).toHaveLength(16);
      expect(/[a-z]/.test(password)).toBe(true); // Contains lowercase
      expect(/[A-Z]/.test(password)).toBe(true); // Contains uppercase
      expect(/\d/.test(password)).toBe(true); // Contains digit
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // Contains special char
    });

    it("should generate password with custom length", () => {
      // Act
      const password = PasswordUtils.generateRandomPassword(20);

      // Assert
      expect(password).toHaveLength(20);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
    });

    it("should generate different passwords on multiple calls", () => {
      // Act
      const password1 = PasswordUtils.generateRandomPassword();
      const password2 = PasswordUtils.generateRandomPassword();

      // Assert
      expect(password1).not.toBe(password2);
    });
  });
});
