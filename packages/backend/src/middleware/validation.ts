import { Request, Response, NextFunction } from "express";
import { ValidationError, ValidationResult } from "../types/shared";

/**
 * Request validation middleware
 */
export class ValidationMiddleware {
  /**
   * Validate login request body
   */
  static validateLoginRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const validation = ValidationMiddleware.validateLogin(req.body);

    if (validation.errors.length > 0) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validation.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      });
      return;
    }

    next();
  }

  /**
   * Validate that request has JSON content type
   */
  static requireJsonContent(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const contentType = req.headers["content-type"];

    if (!contentType || !contentType.includes("application/json")) {
      res.status(400).json({
        error: {
          code: "INVALID_CONTENT_TYPE",
          message: "Content-Type must be application/json",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      });
      return;
    }

    next();
  }

  /**
   * Add request ID if not present
   */
  static addRequestId(req: Request, res: Response, next: NextFunction): void {
    if (!req.headers["x-request-id"]) {
      req.headers["x-request-id"] = generateRequestId();
    }
    next();
  }

  /**
   * Validate login data
   */
  private static validateLogin(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!data) {
      errors.push({
        field: "body",
        message: "Request body is required",
        code: "REQUIRED",
      });
      return { isValid: false, errors };
    }

    // Validate username
    if (!data.username) {
      errors.push({
        field: "username",
        message: "Username is required",
        code: "REQUIRED",
      });
    } else if (typeof data.username !== "string") {
      errors.push({
        field: "username",
        message: "Username must be a string",
        code: "INVALID_TYPE",
      });
    } else if (data.username.trim().length === 0) {
      errors.push({
        field: "username",
        message: "Username cannot be empty",
        code: "EMPTY",
      });
    } else if (data.username.length > 50) {
      errors.push({
        field: "username",
        message: "Username must not exceed 50 characters",
        code: "MAX_LENGTH",
      });
    }

    // Validate password
    if (!data.password) {
      errors.push({
        field: "password",
        message: "Password is required",
        code: "REQUIRED",
      });
    } else if (typeof data.password !== "string") {
      errors.push({
        field: "password",
        message: "Password must be a string",
        code: "INVALID_TYPE",
      });
    } else if (data.password.length === 0) {
      errors.push({
        field: "password",
        message: "Password cannot be empty",
        code: "EMPTY",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
