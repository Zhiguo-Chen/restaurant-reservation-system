import { MongoClient, Db, MongoClientOptions } from "mongodb";

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options?: MongoClientOptions;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: DatabaseConfig;

  private constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Get singleton instance of database connection
   */
  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error(
          "Database configuration is required for first initialization"
        );
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to MongoDB database
   */
  async connect(): Promise<void> {
    try {
      if (this.client && this.db) {
        // Already connected
        return;
      }

      const options: MongoClientOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        ...this.config.options,
      };

      this.client = new MongoClient(this.config.uri, options);
      await this.client.connect();

      this.db = this.client.db(this.config.dbName);

      // Test the connection
      await this.db.admin().ping();

      console.log(`Connected to MongoDB database: ${this.config.dbName}`);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log("Disconnected from MongoDB");
      }
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  /**
   * Get MongoDB client instance
   */
  getClient(): MongoClient {
    if (!this.client) {
      throw new Error("Database client not initialized. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message: string;
    timestamp: Date;
  }> {
    try {
      if (!this.db) {
        return {
          status: "unhealthy",
          message: "Database not connected",
          timestamp: new Date(),
        };
      }

      // Ping the database
      await this.db.admin().ping();

      return {
        status: "healthy",
        message: "Database connection is healthy",
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Database health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Create database indexes for optimal performance
   */
  async createIndexes(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not connected");
    }

    try {
      const reservationsCollection = this.db.collection("reservations");

      // Create indexes for common queries
      await reservationsCollection.createIndex({ arrivalTime: 1 });
      await reservationsCollection.createIndex({ status: 1 });
      await reservationsCollection.createIndex({ guestEmail: 1 });
      await reservationsCollection.createIndex({ arrivalTime: 1, status: 1 });
      await reservationsCollection.createIndex({ createdAt: 1 });

      const usersCollection = this.db.collection("users");

      // Create unique index for username
      await usersCollection.createIndex({ username: 1 }, { unique: true });

      console.log("Database indexes created successfully");
    } catch (error) {
      console.error("Failed to create database indexes:", error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.db) {
      throw new Error("Database not connected");
    }

    try {
      const stats = await this.db.stats();
      return {
        database: this.config.dbName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      throw error;
    }
  }
}
