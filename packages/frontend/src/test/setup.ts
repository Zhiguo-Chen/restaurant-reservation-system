import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_URL: "http://localhost:4000",
    VITE_GRAPHQL_URL: "http://localhost:4000/graphql",
    VITE_NODE_ENV: "test",
    DEV: false,
    PROD: false,
    MODE: "test",
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();
