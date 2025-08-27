import { DatabaseConnection, DatabaseConfig } from "../database";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("DatabaseConnection Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let dbConnection: DatabaseConnection;
  let config: DatabaseConfig;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    config = {
      uri,
      dbName: "test-restaurant-reservations",
    };
  });

  afterAll(async () => {
    // Clean up
    if (dbConnection && dbConnection.isConnected()) {
      await dbConnection.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(() => {
    // Reset singleton instance for each test
    (DatabaseConnection as any).instance = null;
  });

  describe("Singleton Pattern", () => {
    it("should create singleton instance with config", () => {
      const instance1 = DatabaseConnection.getInstance(config);
      const instance2 = DatabaseConnection.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should throw error when getting instance without initial config", () => {
      expect(() => {
        DatabaseConnection.getInstance();
      }).toThrow("Database configuration is required for first initialization");
    });
  });

  describe("Connection Management", () => {
    beforeEach(() => {
      dbConnection = DatabaseConnection.getInstance(config);
    });

    it("should connect to database successfully", async () => {
      expect(dbConnection.isConnected()).toBe(false);

      await dbConnection.connect();

      expect(dbConnection.isConnected()).toBe(true);
      expect(dbConnection.getDatabase()).toBeDefined();
      expect(dbConnection.getClient()).toBeDefined();
    });

    it("should handle multiple connect calls gracefully", async () => {
      await dbConnection.connect();
      expect(dbConnection.isConnected()).toBe(true);

      // Second connect should not throw
      await dbConnection.connect();
      expect(dbConnection.isConnected()).toBe(true);
    });

    it("should disconnect from database successfully", async () => {
      await dbConnection.connect();
      expect(dbConnection.isConnected()).toBe(true);

      await dbConnection.disconnect();
      expect(dbConnection.isConnected()).toBe(false);
    });

    it("should throw error when getting database before connection", () => {
      expect(() => {
        dbConnection.getDatabase();
      }).toThrow("Database not connected. Call connect() first.");
    });

    it("should throw error when getting client before connection", () => {
      expect(() => {
        dbConnection.getClient();
      }).toThrow("Database client not initialized. Call connect() first.");
    });
  });

  describe("Health Check", () => {
    beforeEach(async () => {
      dbConnection = DatabaseConnection.getInstance(config);
    });

    it("should return unhealthy when not connected", async () => {
      const health = await dbConnection.healthCheck();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toBe("Database not connected");
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it("should return healthy when connected", async () => {
      await dbConnection.connect();

      const health = await dbConnection.healthCheck();

      expect(health.status).toBe("healthy");
      expect(health.message).toBe("Database connection is healthy");
      expect(health.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Index Creation", () => {
    beforeEach(async () => {
      dbConnection = DatabaseConnection.getInstance(config);
      await dbConnection.connect();
    });

    it("should create indexes successfully", async () => {
      await expect(dbConnection.createIndexes()).resolves.not.toThrow();

      // Verify indexes were created
      const db = dbConnection.getDatabase();
      const reservationsIndexes = await db.collection("reservations").indexes();
      const usersIndexes = await db.collection("users").indexes();

      expect(reservationsIndexes.length).toBeGreaterThan(1);
      expect(usersIndexes.length).toBeGreaterThan(1);

      // Check for specific indexes
      const reservationIndexNames = reservationsIndexes.map((idx) =>
        Object.keys(idx.key).join("_")
      );
      expect(reservationIndexNames).toContain("arrivalTime");
      expect(reservationIndexNames).toContain("status");
      expect(reservationIndexNames).toContain("guestEmail");

      const userIndexNames = usersIndexes.map((idx) =>
        Object.keys(idx.key).join("_")
      );
      expect(userIndexNames).toContain("username");
    });

    it("should throw error when creating indexes without connection", async () => {
      await dbConnection.disconnect();

      await expect(dbConnection.createIndexes()).rejects.toThrow(
        "Database not connected"
      );
    });
  });

  describe("Database Statistics", () => {
    beforeEach(async () => {
      dbConnection = DatabaseConnection.getInstance(config);
      await dbConnection.connect();
    });

    it("should get database statistics", async () => {
      const stats = await dbConnection.getStats();

      expect(stats).toHaveProperty("database");
      expect(stats).toHaveProperty("collections");
      expect(stats).toHaveProperty("dataSize");
      expect(stats).toHaveProperty("storageSize");
      expect(stats.database).toBe(config.dbName);
    });

    it("should throw error when getting stats without connection", async () => {
      await dbConnection.disconnect();

      await expect(dbConnection.getStats()).rejects.toThrow(
        "Database not connected"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle connection errors gracefully", async () => {
      const badConfig: DatabaseConfig = {
        uri: "mongodb://invalid-host:27017",
        dbName: "test-db",
      };

      const badConnection = DatabaseConnection.getInstance(badConfig);

      await expect(badConnection.connect()).rejects.toThrow();
    });
  });
});
