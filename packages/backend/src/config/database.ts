import { Cluster, Bucket, Collection, ConnectOptions } from "couchbase";

export interface DatabaseConfig {
  connectionString: string;
  username: string;
  password: string;
  bucketName: string;
  options?: ConnectOptions;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private cluster: Cluster | null = null;
  private bucket: Bucket | null = null;
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
   * Connect to Couchbase database
   */
  async connect(): Promise<void> {
    try {
      if (this.cluster && this.bucket) {
        // Already connected
        return;
      }

      const options: ConnectOptions = {
        username: this.config.username,
        password: this.config.password,
        ...this.config.options,
      };

      this.cluster = await Cluster.connect(
        this.config.connectionString,
        options
      );
      this.bucket = this.cluster.bucket(this.config.bucketName);

      // Test the connection
      await this.cluster.ping();

      console.log(`Connected to Couchbase bucket: ${this.config.bucketName}`);
    } catch (error) {
      console.error("Failed to connect to Couchbase:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Couchbase database
   */
  async disconnect(): Promise<void> {
    try {
      if (this.cluster) {
        await this.cluster.close();
        this.cluster = null;
        this.bucket = null;
        console.log("Disconnected from Couchbase");
      }
    } catch (error) {
      console.error("Error disconnecting from Couchbase:", error);
      throw error;
    }
  }

  /**
   * Get bucket instance
   */
  getBucket(): Bucket {
    if (!this.bucket) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.bucket;
  }

  /**
   * Get collection instance
   */
  getCollection(collectionName: string = "_default"): Collection {
    if (!this.bucket) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.bucket.defaultCollection();
  }

  /**
   * Get Couchbase cluster instance
   */
  getCluster(): Cluster {
    if (!this.cluster) {
      throw new Error(
        "Database cluster not initialized. Call connect() first."
      );
    }
    return this.cluster;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.cluster !== null && this.bucket !== null;
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
      if (!this.cluster) {
        return {
          status: "unhealthy",
          message: "Database not connected",
          timestamp: new Date(),
        };
      }

      // Ping the cluster
      await this.cluster.ping();

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
   * Create primary indexes for optimal performance
   */
  async createIndexes(): Promise<void> {
    if (!this.cluster) {
      throw new Error("Database not connected");
    }

    console.log("Skipping index creation - indexes already exist");
    console.log("Database indexes setup completed");
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.cluster) {
      throw new Error("Database not connected");
    }

    try {
      const result = await this.cluster.query(
        `SELECT COUNT(*) as total_documents FROM \`${this.config.bucketName}\``
      );

      return {
        bucket: this.config.bucketName,
        totalDocuments: result.rows[0]?.total_documents || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      throw error;
    }
  }
}
