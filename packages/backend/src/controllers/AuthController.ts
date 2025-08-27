import { Request, Response } from "express";
import { AuthController } from "../interfaces/controllers";
import { AuthService } from "../interfaces/services";
import {
  LoginRequest,
  AuthResponse,
  UserInfo,
  ValidationResult,
} from "@restaurant-reservation/shared";
import { logger } from "../utils/logger";

export class AuthControllerImpl implements AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      // Validate request body
      const validation = this.validateLoginRequest(loginData);
      if (!validation.isValid) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login request",
            details: validation.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      // Attempt login
      const authResponse: AuthResponse = await this.authService.login(
        loginData
      );

      logger.info("User logged in successfully", {
        userId: authResponse.user.id,
        username: authResponse.user.username,
        requestId: req.headers["x-request-id"],
      });

      res.status(200).json(authResponse);
    } catch (error) {
      logger.error("Login failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        username: req.body?.username,
        requestId: req.headers["x-request-id"],
      });

      if (error instanceof Error && error.message === "Invalid credentials") {
        res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid username or password",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
      } else {
        res.status(500).json({
          error: {
            code: "INTERNAL_ERROR",
            message: "An error occurred during login",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({
          error: {
            code: "MISSING_TOKEN",
            message: "Authorization token required for logout",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      await this.authService.logout(token);

      logger.info("User logged out successfully", {
        requestId: req.headers["x-request-id"],
      });

      res.status(200).json({
        message: "Logged out successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Logout failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: req.headers["x-request-id"],
      });

      if (error instanceof Error && error.message === "Invalid token") {
        res.status(401).json({
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired token",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
      } else {
        res.status(500).json({
          error: {
            code: "INTERNAL_ERROR",
            message: "An error occurred during logout",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
      }
    }
  }

  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({
          error: {
            code: "MISSING_TOKEN",
            message: "Authorization token required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      const token = authHeader.split(" ")[1];
      const userInfo: UserInfo = await this.authService.validateToken(token);

      logger.debug("Token validated successfully", {
        userId: userInfo.id,
        username: userInfo.username,
        requestId: req.headers["x-request-id"],
      });

      res.status(200).json({
        valid: true,
        user: userInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn("Token validation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: req.headers["x-request-id"],
      });

      res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      });
    }
  }

  /**
   * Validate login request data
   */
  private validateLoginRequest(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!data) {
      errors.push({
        field: "body",
        message: "Request body is required",
        code: "REQUIRED",
      });
      return { isValid: false, errors };
    }

    if (!data.username || typeof data.username !== "string") {
      errors.push({
        field: "username",
        message: "Username is required and must be a string",
        code: "REQUIRED",
      });
    } else if (data.username.trim().length === 0) {
      errors.push({
        field: "username",
        message: "Username cannot be empty",
        code: "EMPTY",
      });
    }

    if (!data.password || typeof data.password !== "string") {
      errors.push({
        field: "password",
        message: "Password is required and must be a string",
        code: "REQUIRED",
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
