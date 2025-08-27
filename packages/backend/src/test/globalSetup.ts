// Global test setup
export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
  process.env.LOG_LEVEL = "error";
}
