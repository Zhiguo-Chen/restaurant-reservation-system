import { config, isDevelopment, isProduction, isTest } from "../environment";

// Mock environment variables for testing
const originalEnv = process.env;

describe("Environment Configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Required Environment Variables", () => {
    it("should throw error when MONGODB_URI is missing", () => {
      delete process.env.MONGODB_URI;
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.isolateModules(() => {
          require("../environment");
        });
      }).toThrow(
        "Missing required environment variables: MONGODB_URI, JWT_SECRET"
      );
    });

    it("should throw error when JWT_SECRET is missing", () => {
      process.env.MONGODB_URI = "mongodb://localhost:27017";
      delete process.env.JWT_SECRET;

      expect(() => {
        jest.isolateModules(() => {
          require("../environment");
        });
      }).toThrow("Missing required environment variables: JWT_SECRET");
    });

    it("should load successfully with required variables", () => {
      process.env.MONGODB_URI = "mongodb://localhost:27017";
      process.env.JWT_SECRET = "test-secret";

      expect(() => {
        jest.isolateModules(() => {
          require("../environment");
        });
      }).not.toThrow();
    });
  });

  describe("Default Values", () => {
    beforeEach(() => {
      process.env.MONGODB_URI = "mongodb://localhost:27017";
      process.env.JWT_SECRET = "test-secret";
    });

    it("should use default values when optional variables are not set", () => {
      const { config: testConfig } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testConfig.NODE_ENV).toBe("development");
      expect(testConfig.PORT).toBe(4000);
      expect(testConfig.MONGODB_DB_NAME).toBe("restaurant-reservations");
      expect(testConfig.JWT_EXPIRES_IN).toBe("24h");
      expect(testConfig.CORS_ORIGIN).toBe("http://localhost:3000");
      expect(testConfig.LOG_LEVEL).toBe("info");
    });

    it("should use provided values when optional variables are set", () => {
      process.env.NODE_ENV = "production";
      process.env.PORT = "8080";
      process.env.MONGODB_DB_NAME = "custom-db";
      process.env.JWT_EXPIRES_IN = "12h";
      process.env.CORS_ORIGIN = "https://example.com";
      process.env.LOG_LEVEL = "debug";

      const { config: testConfig } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testConfig.NODE_ENV).toBe("production");
      expect(testConfig.PORT).toBe(8080);
      expect(testConfig.MONGODB_DB_NAME).toBe("custom-db");
      expect(testConfig.JWT_EXPIRES_IN).toBe("12h");
      expect(testConfig.CORS_ORIGIN).toBe("https://example.com");
      expect(testConfig.LOG_LEVEL).toBe("debug");
    });
  });

  describe("Environment Flags", () => {
    beforeEach(() => {
      process.env.MONGODB_URI = "mongodb://localhost:27017";
      process.env.JWT_SECRET = "test-secret";
    });

    it("should correctly identify development environment", () => {
      process.env.NODE_ENV = "development";

      const {
        isDevelopment: testIsDev,
        isProduction: testIsProd,
        isTest: testIsTest,
      } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testIsDev).toBe(true);
      expect(testIsProd).toBe(false);
      expect(testIsTest).toBe(false);
    });

    it("should correctly identify production environment", () => {
      process.env.NODE_ENV = "production";

      const {
        isDevelopment: testIsDev,
        isProduction: testIsProd,
        isTest: testIsTest,
      } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testIsDev).toBe(false);
      expect(testIsProd).toBe(true);
      expect(testIsTest).toBe(false);
    });

    it("should correctly identify test environment", () => {
      process.env.NODE_ENV = "test";

      const {
        isDevelopment: testIsDev,
        isProduction: testIsProd,
        isTest: testIsTest,
      } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testIsDev).toBe(false);
      expect(testIsProd).toBe(false);
      expect(testIsTest).toBe(true);
    });
  });

  describe("Port Parsing", () => {
    beforeEach(() => {
      process.env.MONGODB_URI = "mongodb://localhost:27017";
      process.env.JWT_SECRET = "test-secret";
    });

    it("should parse PORT as integer", () => {
      process.env.PORT = "3000";

      const { config: testConfig } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testConfig.PORT).toBe(3000);
      expect(typeof testConfig.PORT).toBe("number");
    });

    it("should handle invalid PORT gracefully", () => {
      process.env.PORT = "invalid";

      const { config: testConfig } = jest.isolateModules(() => {
        return require("../environment");
      });

      expect(testConfig.PORT).toBe(NaN);
    });
  });
});
