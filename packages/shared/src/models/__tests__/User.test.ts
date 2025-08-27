import { UserModel } from "../User";
import { UserRole } from "../../types";

describe("UserModel", () => {
  const validUserData = {
    id: "test-id",
    username: "testuser",
    role: UserRole.EMPLOYEE,
    createdAt: new Date(),
  };

  describe("constructor", () => {
    it("should create a user model with valid data", () => {
      const user = new UserModel(validUserData);

      expect(user.id).toBe(validUserData.id);
      expect(user.username).toBe(validUserData.username);
      expect(user.role).toBe(validUserData.role);
      expect(user.createdAt).toBe(validUserData.createdAt);
    });
  });

  describe("validate", () => {
    it("should return valid result for valid user data", () => {
      const user = new UserModel(validUserData);
      const result = user.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate username is required", () => {
      const user = new UserModel({
        ...validUserData,
        username: "",
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "username",
        message: "Username is required",
        code: "REQUIRED",
      });
    });

    it("should validate username minimum length", () => {
      const user = new UserModel({
        ...validUserData,
        username: "ab",
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "username",
        message: "Username must be at least 3 characters long",
        code: "MIN_LENGTH",
      });
    });

    it("should validate username maximum length", () => {
      const user = new UserModel({
        ...validUserData,
        username: "a".repeat(51),
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "username",
        message: "Username must not exceed 50 characters",
        code: "MAX_LENGTH",
      });
    });

    it("should validate username format", () => {
      const user = new UserModel({
        ...validUserData,
        username: "user@name",
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "username",
        message: "Username can only contain letters, numbers, and underscores",
        code: "INVALID_FORMAT",
      });
    });

    it("should validate role is valid enum value", () => {
      const user = new UserModel({
        ...validUserData,
        role: "INVALID_ROLE" as UserRole,
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "role",
        message: "Invalid user role",
        code: "INVALID_ENUM",
      });
    });

    it("should validate createdAt is not in the future", () => {
      const user = new UserModel({
        ...validUserData,
        createdAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
      });
      const result = user.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "createdAt",
        message: "Created date cannot be in the future",
        code: "INVALID_DATE",
      });
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin role", () => {
      const user = new UserModel({
        ...validUserData,
        role: UserRole.ADMIN,
      });

      expect(user.isAdmin()).toBe(true);
    });

    it("should return false for employee role", () => {
      const user = new UserModel({
        ...validUserData,
        role: UserRole.EMPLOYEE,
      });

      expect(user.isAdmin()).toBe(false);
    });
  });

  describe("isEmployee", () => {
    it("should return true for employee role", () => {
      const user = new UserModel({
        ...validUserData,
        role: UserRole.EMPLOYEE,
      });

      expect(user.isEmployee()).toBe(true);
    });

    it("should return true for admin role", () => {
      const user = new UserModel({
        ...validUserData,
        role: UserRole.ADMIN,
      });

      expect(user.isEmployee()).toBe(true);
    });
  });

  describe("create", () => {
    it("should create a new user with default values", () => {
      const data = {
        username: "newuser",
        role: UserRole.EMPLOYEE,
      };

      const user = UserModel.create(data);

      expect(user.username).toBe(data.username);
      expect(user.role).toBe(data.role);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.id).toBe(""); // Will be set by repository
    });
  });

  describe("toJSON", () => {
    it("should convert model to plain object", () => {
      const user = new UserModel(validUserData);
      const json = user.toJSON();

      expect(json).toEqual(validUserData);
    });
  });
});
