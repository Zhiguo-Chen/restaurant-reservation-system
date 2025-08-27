import { Request, Response } from "express";
import { AuthService } from "../interfaces/services";
import { UserInfo } from "@restaurant-reservation/shared";
import { logger } from "../utils/logger";

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: UserInfo;
  authService: AuthService;
}

/**
 * Create GraphQL context from Express request/response
 */
export async function createContext(
  { req, res }: { req: Request; res: Response },
  authService: AuthService
): Promise<GraphQLContext> {
  const context: GraphQLContext = {
    req,
    res,
    authService,
  };

  // Extract and validate authentication token if present
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const user = await authService.validateToken(token);
      context.user = user;

      logger.debug("GraphQL request authenticated", {
        userId: user.id,
        username: user.username,
        role: user.role,
        operation: req.body?.operationName,
        requestId: req.headers["x-request-id"],
      });
    } catch (error) {
      // Log authentication failure but don't throw error
      // This allows queries that don't require authentication to proceed
      logger.warn("GraphQL authentication failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        operation: req.body?.operationName,
        requestId: req.headers["x-request-id"],
      });
    }
  }

  return context;
}

/**
 * Require authentication for GraphQL resolvers
 */
export function requireAuth(context: GraphQLContext): UserInfo {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

/**
 * Require specific role for GraphQL resolvers
 */
export function requireRole(
  context: GraphQLContext,
  allowedRoles: string[]
): UserInfo {
  const user = requireAuth(context);

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

/**
 * Check if user is authenticated (optional authentication)
 */
export function isAuthenticated(context: GraphQLContext): boolean {
  return !!context.user;
}

/**
 * Get current user or null if not authenticated
 */
export function getCurrentUser(context: GraphQLContext): UserInfo | null {
  return context.user || null;
}
