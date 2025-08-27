import { Bucket } from "couchbase";
import { User, UserRole } from "../types/shared";
import { UserRepository as IUserRepository } from "../interfaces/repositories";
import { BaseRepository } from "./BaseRepository";
import { createLogger } from "../utils/logger";

const logger = createLogger("UserRepository");

/**
 * Couchbase implementation of UserRepository
 */
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  constructor(bucket: Bucket) {
    super(bucket, "user");
  }

  /**
   * Convert Couchbase document to User entity
   */
  protected toDomainEntity(doc: any): User {
    return {
      id: doc.id,
      username: doc.username,
      email: doc.email || "",
      passwordHash: doc.passwordHash,
      role: doc.role as UserRole,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt || doc.createdAt),
    };
  }

  /**
   * Convert User entity to Couchbase document
   */
  protected toCouchbaseDocument(entity: User): any {
    return {
      type: this.collectionName,
      id: entity.id,
      username: entity.username,
      passwordHash: entity.passwordHash,
      role: entity.role,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      logger.debug("Finding user by username", { username });

      const bucketName = this.bucket.name;
      const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND username = $username LIMIT 1`;
      const result = await this.findWithQuery(query, {
        type: this.collectionName,
        username,
      });

      if (result.length === 0) {
        logger.debug("User not found by username", { username });
        return null;
      }

      const user = result[0];
      logger.debug("Found user by username", { username, userId: user.id });
      return user;
    } catch (error) {
      logger.error("Error finding user by username:", error);
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    try {
      logger.debug("Finding users by role", { role });

      const bucketName = this.bucket.name;
      const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND role = $role ORDER BY createdAt DESC`;

      return this.findWithQuery(query, { type: this.collectionName, role });
    } catch (error) {
      logger.error("Error finding users by role:", error);
      throw error;
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      logger.debug("Checking if username exists", { username, excludeId });

      const bucketName = this.bucket.name;
      let query = `SELECT COUNT(*) as count FROM \`${bucketName}\` WHERE type = $type AND username = $username`;
      const parameters: any = { type: this.collectionName, username };

      if (excludeId) {
        query += ` AND id != $excludeId`;
        parameters.excludeId = excludeId;
      }

      const count = await this.countWithQuery(query, parameters);
      const exists = count > 0;

      logger.debug("Username existence check result", { username, exists });
      return exists;
    } catch (error) {
      logger.error("Error checking username existence:", error);
      throw error;
    }
  }

  /**
   * Create user with unique username validation
   */
  async create(entity: User): Promise<User> {
    try {
      // Check if username already exists
      const exists = await this.usernameExists(entity.username);
      if (exists) {
        throw new Error(`Username '${entity.username}' already exists`);
      }

      return super.create(entity);
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user with unique username validation
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      // If updating username, check if it already exists
      if (data.username) {
        const exists = await this.usernameExists(data.username, id);
        if (exists) {
          throw new Error(`Username '${data.username}' already exists`);
        }
      }

      return super.update(id, data);
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    recentUsers: User[];
  }> {
    try {
      logger.debug("Getting user statistics");

      const bucketName = this.bucket.name;

      const [totalResult, byRoleResult, recentUsers] = await Promise.all([
        this.countWithQuery(
          `SELECT COUNT(*) as count FROM \`${bucketName}\` WHERE type = $type`,
          { type: this.collectionName }
        ),
        this.bucket.cluster.query(
          `SELECT role, COUNT(*) as count FROM \`${bucketName}\` WHERE type = $type GROUP BY role`,
          { parameters: { type: this.collectionName } }
        ),
        this.findWithQuery(
          `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type ORDER BY createdAt DESC LIMIT 10`,
          { type: this.collectionName }
        ),
      ]);

      // Initialize role counts
      const byRole: Record<UserRole, number> = {
        [UserRole.GUEST]: 0,
        [UserRole.EMPLOYEE]: 0,
        [UserRole.MANAGER]: 0,
        [UserRole.ADMIN]: 0,
      };

      // Populate actual counts
      byRoleResult.rows.forEach((item: any) => {
        if (item.role in byRole) {
          byRole[item.role as UserRole] = item.count;
        }
      });

      return {
        total: totalResult,
        byRole,
        recentUsers,
      };
    } catch (error) {
      logger.error("Error getting user statistics:", error);
      throw error;
    }
  }
}
