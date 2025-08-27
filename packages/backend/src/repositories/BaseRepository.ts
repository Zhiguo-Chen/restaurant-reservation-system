import {
  Db,
  Collection,
  ObjectId,
  Filter,
  UpdateFilter,
  FindOptions,
} from "mongodb";
import { BaseRepository as IBaseRepository } from "../interfaces/repositories";
import { createLogger } from "../utils/logger";

const logger = createLogger("BaseRepository");

/**
 * Abstract base repository implementing common CRUD operations
 */
export abstract class BaseRepository<T extends { id: string }>
  implements IBaseRepository<T>
{
  protected db: Db;
  protected collection: Collection;
  protected collectionName: string;

  constructor(db: Db, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  /**
   * Convert MongoDB document to domain entity
   */
  protected abstract toDomainEntity(doc: any): T;

  /**
   * Convert domain entity to MongoDB document
   */
  protected abstract toMongoDocument(entity: T): any;

  /**
   * Generate new ID for entity
   */
  protected generateId(): string {
    return new ObjectId().toHexString();
  }

  /**
   * Create a new entity
   */
  async create(entity: T): Promise<T> {
    try {
      const id = this.generateId();
      const entityWithId = { ...entity, id };
      const doc = this.toMongoDocument(entityWithId);

      logger.info(`Creating ${this.collectionName} entity`, { id });

      const result = await this.collection.insertOne(doc);

      if (!result.acknowledged) {
        throw new Error(`Failed to create ${this.collectionName} entity`);
      }

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

      const doc = await this.collection.findOne({ _id: new ObjectId(id) });

      if (!doc) {
        logger.debug(`${this.collectionName} not found`, { id });
        return null;
      }

      const entity = this.toDomainEntity(doc);
      logger.debug(`Found ${this.collectionName}`, { id });
      return entity;
    } catch (error) {
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

      // Remove id from update data to prevent conflicts
      const { id: _, ...updateData } = data;
      const updateDoc = this.toMongoDocument(updateData as T);

      // Remove _id from update document
      delete updateDoc._id;

      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateDoc, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result || !result.value) {
        throw new Error(`${this.collectionName} not found for update: ${id}`);
      }

      const updatedEntity = this.toDomainEntity(result.value);
      logger.info(`Successfully updated ${this.collectionName}`, { id });
      return updatedEntity;
    } catch (error) {
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

      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        throw new Error(`${this.collectionName} not found for deletion: ${id}`);
      }

      logger.info(`Successfully deleted ${this.collectionName}`, { id });
    } catch (error) {
      logger.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Find entities with filter and options
   */
  protected async findWithFilter(
    filter: Filter<any> = {},
    options: FindOptions = {}
  ): Promise<T[]> {
    try {
      logger.debug(`Finding ${this.collectionName} with filter`, {
        filter,
        options,
      });

      const cursor = this.collection.find(filter, options);
      const docs = await cursor.toArray();

      const entities = docs.map((doc) => this.toDomainEntity(doc));
      logger.debug(`Found ${entities.length} ${this.collectionName} entities`);

      return entities;
    } catch (error) {
      logger.error(`Error finding ${this.collectionName} with filter:`, error);
      throw error;
    }
  }

  /**
   * Count entities with filter
   */
  protected async countWithFilter(filter: Filter<any> = {}): Promise<number> {
    try {
      const count = await this.collection.countDocuments(filter);
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
      const count = await this.collection.countDocuments(
        { _id: new ObjectId(id) },
        { limit: 1 }
      );
      return count > 0;
    } catch (error) {
      logger.error(`Error checking ${this.collectionName} existence:`, error);
      throw error;
    }
  }

  /**
   * Find all entities
   */
  async findAll(options: FindOptions = {}): Promise<T[]> {
    return this.findWithFilter({}, options);
  }
}
