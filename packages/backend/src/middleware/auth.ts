import { Request, Response, NextFunction } from "express";
import { AuthService } from "../interfaces/services";
import { UserRole } from "@restaurant-reservation/shared";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  /**
   * Middleware to authenticate JWT tokens
   */
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication token required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      const user = await this.authService.validateToken(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired authentication token",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      });
    }
  };

  /**
   * Middleware to authorize specific roles
   */
  authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware for employee-only routes
   */
  requireEmployee = this.authorize([UserRole.EMPLOYEE, UserRole.ADMIN]);

  /**
   * Middleware for admin-only routes
   */
  requireAdmin = this.authorize([UserRole.ADMIN]);

  /**
   * Optional authentication - sets user if token is valid but doesn't fail if missing
   */
  optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (token) {
        const user = await this.authService.validateToken(token);
        req.user = user;
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
    }

    next();
  };

  /**
   * Extract JWT token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }
}
