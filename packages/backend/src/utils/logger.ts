// Simple console logger to replace winston
const logger = {
  error: (message: string, meta?: any) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      meta || ""
    );
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  info: (message: string, meta?: any) => {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  debug: (message: string, meta?: any) => {
    console.debug(
      `[DEBUG] ${new Date().toISOString()} - ${message}`,
      meta || ""
    );
  },
};

// Helper functions for compatibility
export const createLogger = (context: string) => ({
  error: (message: string, meta?: any) =>
    logger.error(`[${context}] ${message}`, meta),
  warn: (message: string, meta?: any) =>
    logger.warn(`[${context}] ${message}`, meta),
  info: (message: string, meta?: any) =>
    logger.info(`[${context}] ${message}`, meta),
  debug: (message: string, meta?: any) =>
    logger.debug(`[${context}] ${message}`, meta),
});

export const logPerformance = (
  operation: string,
  duration: number,
  level?: string,
  meta?: any
) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    level,
    ...meta,
  });
};

export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: Error
) => {
  logger.info(`API: ${method} ${url} - ${statusCode} (${duration}ms)`, {
    userId,
    error: error?.message,
  });
};

export const logSecurity = (event: string, level?: string, meta?: any) => {
  logger.warn(`Security: ${event}`, { level, ...meta });
};

export { logger };
export default logger;
