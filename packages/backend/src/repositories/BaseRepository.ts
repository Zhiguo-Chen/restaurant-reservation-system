import { Bucket, Collection } from "couchbase";
import { BaseRepository as IBaseRepository } from "../interfaces/repositories";
import { createLogger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const logger = createLogger("BaseRepository");

/**
 * Abstract base repository implementing common CRUD operations for Couchbase
 */
export abstract class BaseRepository<T extends { id: string }>
  implements IBaseRepository<T>
{
  protected bucket: Bucket;
  protected collection: Collection;
  protected collectionName: string;

  constructor(bucket: Bucket, collectionName: string) {
    this.bucket = bucket;
    this.collectionName = collectionName;
    this.collection = bucket.defaultCollection();
  }

  /**
   * Convert Couchbase document to domain entity
   */
  protected abstract toDomainEntity(doc: any): T;

  /**
   * Convert domain entity to Couchbase document
   */
  protected abstract toCouchbaseDocument(entity: T): any;

  /**
   * Generate new ID for entity
   */
  protected generateId(): string {
    return uuidv4();
  }

  /**
   * Generate document key for Couchbase
   */
  protected generateDocumentKey(id: string): string {
    return `${this.collectionName}::${id}`;
  }

  /**
   * Create a new entity
   */
  async create(entity: T): Promise<T> {
    try {
      const id = this.generateId();
      const entityWithId = { ...entity, id };
      const doc = this.toCouchbaseDocument(entityWithId);
      const key = this.generateDocumentKey(id);

      logger.info(`Creating ${this.collectionName} entity`, { id });

      await this.collection.insert(key, doc);

      logger.info(`Successfully created ${this.collectionName} entity`, { id });
      return entityWithId;
    } catch (error) {
      logger.error(`Error creating ${this.collectionName} entity:`, error);
      throw error;
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      logger.debug(`Finding ${this.collectionName} by ID`, { id });

      const key = this.generateDocumentKey(id);
      const result = await this.collection.get(key);

      if (!result) {
        logger.debug(`${this.collectionName} not found`, { id });
        return null;
      }

      const entity = this.toDomainEntity(result.content);
      logger.debug(`Found ${this.collectionName}`, { id });
      return entity;
    } catch (error: any) {
      if (error.name === "DocumentNotFoundError") {
        logger.debug(`${this.collectionName} not found`, { id });
        return null;
      }
      logger.error(`Error finding ${this.collectionName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      logger.info(`Updating ${this.collectionName}`, { id });

      const key = this.generateDocumentKey(id);

      // Get current document
      const current = await this.collection.get(key);
      if (!current) {
        throw new Error(`${this.collectionName} not found for update: ${id}`);
      }

      // Merge with update data
      const currentEntity = this.toDomainEntity(current.content);
      const updatedEntity = {
        ...currentEntity,
        ...data,
        id,
        updatedAt: new Date(),
      };
      const updateDoc = this.toCouchbaseDocument(updatedEntity);

      // Replace document
      await this.collection.replace(key, updateDoc);

      logger.info(`Successfully updated ${this.collectionName}`, { id });
      return updatedEntity;
    } catch (error: any) {
      if (error.name === "DocumentNotFoundError") {
        throw new Error(`${this.collectionName} not found for update: ${id}`);
      }
      logger.error(`Error updating ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    try {
      logger.info(`Deleting ${this.collectionName}`, { id });

      const key = this.generateDocumentKey(id);
      await this.collection.remove(key);

      logger.info(`Successfully deleted ${this.collectionName}`, { id });
    } catch (error: any) {
      if (error.name === "DocumentNotFoundError") {
        throw new Error(`${this.collectionName} not found for deletion: ${id}`);
      }
      logger.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Find entities with N1QL query
   */
  protected async findWithQuery(query: string, parameters?: any): Promise<T[]> {
    try {
      logger.debug(`Finding ${this.collectionName} with query`, {
        query,
        parameters,
      });

      const cluster = this.bucket.cluster;
      const result = await cluster.query(query, { parameters });

      const entities = result.rows.map((row) => this.toDomainEntity(row));
      logger.debug(`Found ${entities.length} ${this.collectionName} entities`);

      return entities;
    } catch (error) {
      logger.error(`Error finding ${this.collectionName} with query:`, error);
      throw error;
    }
  }

  /**
   * Count entities with N1QL query
   */
  protected async countWithQuery(
    query: string,
    parameters?: any
  ): Promise<number> {
    try {
      const cluster = this.bucket.cluster;
      const result = await cluster.query(query, { parameters });
      const count = result.rows[0]?.count || 0;
      logger.debug(`Counted ${count} ${this.collectionName} entities`);
      return count;
    } catch (error) {
      logger.error(`Error counting ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const key = this.generateDocumentKey(id);
      await this.collection.get(key);
      return true;
    } catch (error: any) {
      if (error.name === "DocumentNotFoundError") {
        return false;
      }
      logger.error(`Error checking ${this.collectionName} existence:`, error);
      throw error;
    }
  }

  /**
   * Find all entities
   */
  async findAll(): Promise<T[]> {
    const bucketName = this.bucket.name;
    const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type`;
    return this.findWithQuery(query, { type: this.collectionName });
  }
}
