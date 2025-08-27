import {
  User as IUser,
  UserRole,
  ValidationResult,
  ValidationError,
} from "../types";

export class UserModel implements IUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.username = data.username;
    this.passwordHash = data.passwordHash;
    this.role = data.role;
    this.createdAt = data.createdAt;
  }

  /**
   * Validates the user data
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate username
    if (!this.username || this.username.trim().length === 0) {
      errors.push({
        field: "username",
        message: "Username is required",
        code: "REQUIRED",
      });
    } else if (this.username.trim().length < 3) {
      errors.push({
        field: "username",
        message: "Username must be at least 3 characters long",
        code: "MIN_LENGTH",
      });
    } else if (this.username.trim().length > 50) {
      errors.push({
        field: "username",
        message: "Username must not exceed 50 characters",
        code: "MAX_LENGTH",
      });
    } else if (!this.isValidUsername(this.username)) {
      errors.push({
        field: "username",
        message: "Username can only contain letters, numbers, and underscores",
        code: "INVALID_FORMAT",
      });
    }

    // Validate role
    if (!Object.values(UserRole).includes(this.role)) {
      errors.push({
        field: "role",
        message: "Invalid user role",
        code: "INVALID_ENUM",
      });
    }

    // Validate createdAt
    if (!this.createdAt) {
      errors.push({
        field: "createdAt",
        message: "Created date is required",
        code: "REQUIRED",
      });
    } else if (this.createdAt > new Date()) {
      errors.push({
        field: "createdAt",
        message: "Created date cannot be in the future",
        code: "INVALID_DATE",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates username format (alphanumeric and underscores only)
   */
  private isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username.trim());
  }

  /**
   * Checks if user has admin privileges
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Checks if user is an employee (includes admin)
   */
  isEmployee(): boolean {
    return this.role === UserRole.EMPLOYEE || this.role === UserRole.ADMIN;
  }

  /**
   * Converts the model to a plain object
   */
  toJSON(): IUser {
    return {
      id: this.id,
      username: this.username,
      passwordHash: this.passwordHash,
      role: this.role,
      createdAt: this.createdAt,
    };
  }

  /**
   * Creates a new user with default values
   */
  static create(data: Omit<IUser, "id" | "createdAt">): UserModel {
    return new UserModel({
      ...data,
      id: "", // Will be set by repository
      createdAt: new Date(),
    });
  }
}
