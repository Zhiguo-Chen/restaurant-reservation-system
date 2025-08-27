import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  COUCHBASE_CONNECTION_STRING: string;
  COUCHBASE_USERNAME: string;
  COUCHBASE_PASSWORD: string;
  COUCHBASE_BUCKET: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
}

/**
 * Validate and parse environment variables
 */
function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    "COUCHBASE_CONNECTION_STRING",
    "COUCHBASE_USERNAME",
    "COUCHBASE_PASSWORD",
    "JWT_SECRET",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "4000", 10),
    COUCHBASE_CONNECTION_STRING: process.env.COUCHBASE_CONNECTION_STRING!,
    COUCHBASE_USERNAME: process.env.COUCHBASE_USERNAME!,
    COUCHBASE_PASSWORD: process.env.COUCHBASE_PASSWORD!,
    COUCHBASE_BUCKET: process.env.COUCHBASE_BUCKET || "restaurant-reservations",
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
  };
}

export const config = validateEnvironment();

export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
