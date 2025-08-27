import { Router } from "express";
import { AuthControllerImpl } from "../controllers/AuthController";
import { AuthServiceImpl } from "../services/AuthService";
import { AuthMiddleware } from "../middleware/auth";
import { ValidationMiddleware } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { UserRepository } from "../interfaces/repositories";

export function createAuthRoutes(userRepository: UserRepository): Router {
  const router = Router();

  // Create service and controller instances
  const authService = new AuthServiceImpl(userRepository);
  const authController = new AuthControllerImpl(authService);
  const authMiddleware = new AuthMiddleware(authService);

  /**
   * POST /auth/login
   * Authenticate user with username and password
   *
   * Request body:
   * {
   *   "username": "string",
   *   "password": "string"
   * }
   *
   * Response:
   * {
   *   "token": "string",
   *   "user": {
   *     "id": "string",
   *     "username": "string",
   *     "role": "EMPLOYEE" | "ADMIN"
   *   },
   *   "expiresIn": number
   * }
   */
  router.post(
    "/login",
    ValidationMiddleware.addRequestId,
    ValidationMiddleware.requireJsonContent,
    ValidationMiddleware.validateLoginRequest,
    asyncHandler(async (req, res) => {
      await authController.login(req, res);
    })
  );

  /**
   * POST /auth/logout
   * Invalidate the current authentication token
   *
   * Headers:
   * Authorization: Bearer <token>
   *
   * Response:
   * {
   *   "message": "Logged out successfully",
   *   "timestamp": "string"
   * }
   */
  router.post(
    "/logout",
    ValidationMiddleware.addRequestId,
    asyncHandler(async (req, res) => {
      await authController.logout(req, res);
    })
  );

  /**
   * GET /auth/validate
   * Validate the current authentication token and return user info
   *
   * Headers:
   * Authorization: Bearer <token>
   *
   * Response:
   * {
   *   "valid": true,
   *   "user": {
   *     "id": "string",
   *     "username": "string",
   *     "role": "EMPLOYEE" | "ADMIN"
   *   },
   *   "timestamp": "string"
   * }
   */
  router.get(
    "/validate",
    ValidationMiddleware.addRequestId,
    asyncHandler(async (req, res) => {
      await authController.validateToken(req, res);
    })
  );

  /**
   * GET /auth/me
   * Get current user information (requires authentication)
   *
   * Headers:
   * Authorization: Bearer <token>
   *
   * Response:
   * {
   *   "user": {
   *     "id": "string",
   *     "username": "string",
   *     "role": "EMPLOYEE" | "ADMIN"
   *   },
   *   "timestamp": "string"
   * }
   */
  router.get(
    "/me",
    ValidationMiddleware.addRequestId,
    authMiddleware.authenticate,
    (req, res) => {
      res.status(200).json({
        user: req.user,
        timestamp: new Date().toISOString(),
      });
    }
  );

  return router;
}
