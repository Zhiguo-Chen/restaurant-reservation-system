// Test setup file
import { config } from "../config/environment";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error"; // Reduce log noise during tests

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});
