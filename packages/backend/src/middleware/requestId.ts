import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Middleware to add unique request ID to each request
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if request ID already exists (from load balancer, proxy, etc.)
  const existingRequestId = req.headers["x-request-id"] as string;

  // Generate new request ID if not present
  const requestId = existingRequestId || uuidv4();

  // Set request ID in headers
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);

  // Add to request object for easy access
  (req as any).requestId = requestId;

  next();
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string {
  return (
    (req as any).requestId ||
    (req.headers["x-request-id"] as string) ||
    "unknown"
  );
}
