import { Bucket } from "couchbase";
import { Reservation, ReservationStatus } from "../types/shared";
import { ReservationRepository as IReservationRepository } from "../interfaces/repositories";
import { BaseRepository } from "./BaseRepository";
import { createLogger } from "../utils/logger";

const logger = createLogger("ReservationRepository");

/**
 * Couchbase implementation of ReservationRepository
 */
export class ReservationRepository
  extends BaseRepository<Reservation>
  implements IReservationRepository
{
  constructor(bucket: Bucket) {
    super(bucket, "reservation");
  }

  /**
   * Convert Couchbase document to Reservation entity
   */
  protected toDomainEntity(doc: any): Reservation {
    return {
      id: doc.id,
      guestName: doc.guestName,
      guestPhone: doc.guestPhone,
      guestEmail: doc.guestEmail,
      partySize: doc.partySize,
      arrivalTime: new Date(doc.arrivalTime),
      tableSize: doc.tableSize,
      status: doc.status as ReservationStatus,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      updatedBy: doc.updatedBy,
      notes: doc.notes,
    };
  }

  /**
   * Convert Reservation entity to Couchbase document
   */
  protected toCouchbaseDocument(entity: Reservation): any {
    return {
      type: this.collectionName,
      id: entity.id,
      guestName: entity.guestName,
      guestPhone: entity.guestPhone,
      guestEmail: entity.guestEmail,
      arrivalTime: entity.arrivalTime,
      tableSize: entity.tableSize,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      updatedBy: entity.updatedBy,
      notes: entity.notes,
    };
  }

  /**
   * Find reservations by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Reservation[]> {
    try {
      logger.debug("Finding reservations by date range", {
        startDate,
        endDate,
      });

      const bucketName = this.bucket.name;
      const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND arrivalTime >= $startDate AND arrivalTime <= $endDate ORDER BY arrivalTime ASC`;

      return this.findWithQuery(query, {
        type: this.collectionName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } catch (error) {
      logger.error("Error finding reservations by date range:", error);
      throw error;
    }
  }

  /**
   * Find reservations by status
   */
  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    try {
      logger.debug("Finding reservations by status", { status });

      const bucketName = this.bucket.name;
      const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND status = $status ORDER BY arrivalTime ASC`;

      return this.findWithQuery(query, { type: this.collectionName, status });
    } catch (error) {
      logger.error("Error finding reservations by status:", error);
      throw error;
    }
  }

  /**
   * Find reservations by guest email
   */
  async findByGuestEmail(email: string): Promise<Reservation[]> {
    try {
      logger.debug("Finding reservations by guest email", { email });

      const bucketName = this.bucket.name;
      const query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND guestEmail = $email ORDER BY createdAt DESC`;

      return this.findWithQuery(query, { type: this.collectionName, email });
    } catch (error) {
      logger.error("Error finding reservations by guest email:", error);
      throw error;
    }
  }

  /**
   * Find reservations by date and optionally by status
   */
  async findByDateAndStatus(
    date: Date,
    status?: ReservationStatus
  ): Promise<Reservation[]> {
    try {
      logger.debug("Finding reservations by date and status", { date, status });

      // Create date range for the entire day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bucketName = this.bucket.name;
      let query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type AND arrivalTime >= $startOfDay AND arrivalTime <= $endOfDay`;
      const parameters: any = {
        type: this.collectionName,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
      };

      if (status) {
        query += ` AND status = $status`;
        parameters.status = status;
      }

      query += ` ORDER BY arrivalTime ASC`;

      return this.findWithQuery(query, parameters);
    } catch (error) {
      logger.error("Error finding reservations by date and status:", error);
      throw error;
    }
  }

  /**
   * Find reservations with pagination
   */
  async findWithPagination(
    filter: {
      startDate?: Date;
      endDate?: Date;
      status?: ReservationStatus;
      guestName?: string;
      guestEmail?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    reservations: Reservation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      logger.debug("Finding reservations with pagination", {
        filter,
        page,
        limit,
      });

      const bucketName = this.bucket.name;
      let whereClause = `WHERE type = $type`;
      const parameters: any = { type: this.collectionName };

      // Build WHERE clause dynamically
      if (filter.startDate) {
        whereClause += ` AND arrivalTime >= $startDate`;
        parameters.startDate = filter.startDate.toISOString();
      }

      if (filter.endDate) {
        whereClause += ` AND arrivalTime <= $endDate`;
        parameters.endDate = filter.endDate.toISOString();
      }

      if (filter.status) {
        whereClause += ` AND status = $status`;
        parameters.status = filter.status;
      }

      if (filter.guestName) {
        whereClause += ` AND LOWER(guestName) LIKE $guestName`;
        parameters.guestName = `%${filter.guestName.toLowerCase()}%`;
      }

      if (filter.guestEmail) {
        whereClause += ` AND guestEmail = $guestEmail`;
        parameters.guestEmail = filter.guestEmail;
      }

      const skip = (page - 1) * limit;

      // Build queries
      const dataQuery = `SELECT META().id, * FROM \`${bucketName}\` ${whereClause} ORDER BY arrivalTime ASC LIMIT $limit OFFSET $skip`;
      const countQuery = `SELECT COUNT(*) as count FROM \`${bucketName}\` ${whereClause}`;

      const [reservations, totalResult] = await Promise.all([
        this.findWithQuery(dataQuery, { ...parameters, limit, skip }),
        this.countWithQuery(countQuery, parameters),
      ]);

      const totalPages = Math.ceil(totalResult / limit);

      return {
        reservations,
        total: totalResult,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error("Error finding reservations with pagination:", error);
      throw error;
    }
  }

  /**
   * Find conflicting reservations for a given time slot
   */
  async findConflictingReservations(
    arrivalTime: Date,
    tableSize: number,
    excludeId?: string
  ): Promise<Reservation[]> {
    try {
      logger.debug("Finding conflicting reservations", {
        arrivalTime,
        tableSize,
        excludeId,
      });

      // Look for reservations within 2 hours of the requested time
      const conflictWindow = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const startTime = new Date(arrivalTime.getTime() - conflictWindow);
      const endTime = new Date(arrivalTime.getTime() + conflictWindow);

      const bucketName = this.bucket.name;
      let query = `SELECT META().id, * FROM \`${bucketName}\` WHERE type = $type 
                   AND arrivalTime >= $startTime AND arrivalTime <= $endTime 
                   AND status IN [$requestedStatus, $approvedStatus]`;

      const parameters: any = {
        type: this.collectionName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        requestedStatus: ReservationStatus.REQUESTED,
        approvedStatus: ReservationStatus.APPROVED,
      };

      // Exclude current reservation if updating
      if (excludeId) {
        query += ` AND id != $excludeId`;
        parameters.excludeId = excludeId;
      }

      return this.findWithQuery(query, parameters);
    } catch (error) {
      logger.error("Error finding conflicting reservations:", error);
      throw error;
    }
  }

  /**
   * Get reservation statistics for a date range
   */
  async getStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    byStatus: Record<ReservationStatus, number>;
    averageTableSize: number;
    totalGuests: number;
  }> {
    try {
      logger.debug("Getting reservation statistics", { startDate, endDate });

      const bucketName = this.bucket.name;
      const cluster = this.bucket.cluster;

      // Get basic statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(tableSize) as totalGuests,
          AVG(tableSize) as averageTableSize
        FROM \`${bucketName}\` 
        WHERE type = $type 
          AND arrivalTime >= $startDate 
          AND arrivalTime <= $endDate
      `;

      // Get status counts
      const statusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM \`${bucketName}\` 
        WHERE type = $type 
          AND arrivalTime >= $startDate 
          AND arrivalTime <= $endDate
        GROUP BY status
      `;

      const parameters = {
        type: this.collectionName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const [statsResult, statusResult] = await Promise.all([
        cluster.query(statsQuery, { parameters }),
        cluster.query(statusQuery, { parameters }),
      ]);

      const stats = statsResult.rows[0] || {
        total: 0,
        totalGuests: 0,
        averageTableSize: 0,
      };

      // Initialize status counts
      const byStatus: Record<ReservationStatus, number> = {
        [ReservationStatus.REQUESTED]: 0,
        [ReservationStatus.CONFIRMED]: 0,
        [ReservationStatus.APPROVED]: 0,
        [ReservationStatus.SEATED]: 0,
        [ReservationStatus.COMPLETED]: 0,
        [ReservationStatus.CANCELLED]: 0,
        [ReservationStatus.NO_SHOW]: 0,
      };

      // Populate actual counts
      statusResult.rows.forEach((row: any) => {
        if (row.status in byStatus) {
          byStatus[row.status as ReservationStatus] = row.count;
        }
      });

      return {
        total: stats.total || 0,
        byStatus,
        averageTableSize: Math.round((stats.averageTableSize || 0) * 100) / 100,
        totalGuests: stats.totalGuests || 0,
      };
    } catch (error) {
      logger.error("Error getting reservation statistics:", error);
      throw error;
    }
  }
}
