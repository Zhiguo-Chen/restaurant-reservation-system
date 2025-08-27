import { Db, Filter, FindOptions } from "mongodb";
import { User, UserRole } from "@restaurant-reservation/shared";
import { UserRepository as IUserRepository } from "../interfaces/repositories";
import { BaseRepository } from "./BaseRepository";
import { createLogger } from "../utils/logger";

const logger = createLogger("UserRepository");

/**
 * MongoDB implementation of UserRepository
 */
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  constructor(db: Db) {
    super(db, "users");
  }

  /**
   * Convert MongoDB document to User entity
   */
  protected toDomainEntity(doc: any): User {
    return {
      id: doc._id,
      username: doc.username,
      passwordHash: doc.passwordHash,
      role: doc.role as UserRole,
      createdAt: new Date(doc.createdAt),
    };
  }

  /**
   * Convert User entity to MongoDB document
   */
  protected toMongoDocument(entity: User): any {
    return {
      _id: entity.id,
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

      const doc = await this.collection.findOne({ username });

      if (!doc) {
        logger.debug("User not found by username", { username });
        return null;
      }

      const user = this.toDomainEntity(doc);
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

      const filter: Filter<any> = { role };
      const options: FindOptions = {
        sort: { createdAt: -1 },
      };

      return this.findWithFilter(filter, options);
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

      const filter: Filter<any> = { username };

      if (excludeId) {
        filter._id = { $ne: excludeId };
      }

      const count = await this.collection.countDocuments(filter, { limit: 1 });
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

      const [total, byRoleResult, recentUsers] = await Promise.all([
        this.countWithFilter({}),
        this.collection
          .aggregate([
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
        this.findWithFilter(
          {},
          {
            sort: { createdAt: -1 },
            limit: 10,
          }
        ),
      ]);

      // Initialize role counts
      const byRole: Record<UserRole, number> = {
        [UserRole.EMPLOYEE]: 0,
        [UserRole.ADMIN]: 0,
      };

      // Populate actual counts
      byRoleResult.forEach((item) => {
        if (item._id in byRole) {
          byRole[item._id as UserRole] = item.count;
        }
      });

      return {
        total,
        byRole,
        recentUsers,
      };
    } catch (error) {
      logger.error("Error getting user statistics:", error);
      throw error;
    }
  }
}
