import { Db, Filter, FindOptions } from "mongodb";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { ReservationRepository as IReservationRepository } from "../interfaces/repositories";
import { BaseRepository } from "./BaseRepository";
import { createLogger } from "../utils/logger";

const logger = createLogger("ReservationRepository");

/**
 * MongoDB implementation of ReservationRepository
 */
export class ReservationRepository
  extends BaseRepository<Reservation>
  implements IReservationRepository
{
  constructor(db: Db) {
    super(db, "reservations");
  }

  /**
   * Convert MongoDB document to Reservation entity
   */
  protected toDomainEntity(doc: any): Reservation {
    return {
      id: doc._id,
      guestName: doc.guestName,
      guestPhone: doc.guestPhone,
      guestEmail: doc.guestEmail,
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
   * Convert Reservation entity to MongoDB document
   */
  protected toMongoDocument(entity: Reservation): any {
    return {
      _id: entity.id,
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

      const filter: Filter<any> = {
        arrivalTime: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      const options: FindOptions = {
        sort: { arrivalTime: 1 },
      };

      return this.findWithFilter(filter, options);
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

      const filter: Filter<any> = { status };
      const options: FindOptions = {
        sort: { arrivalTime: 1 },
      };

      return this.findWithFilter(filter, options);
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

      const filter: Filter<any> = { guestEmail: email };
      const options: FindOptions = {
        sort: { createdAt: -1 },
      };

      return this.findWithFilter(filter, options);
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

      const filter: Filter<any> = {
        arrivalTime: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      if (status) {
        filter.status = status;
      }

      const options: FindOptions = {
        sort: { arrivalTime: 1 },
      };

      return this.findWithFilter(filter, options);
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

      const mongoFilter: Filter<any> = {};

      // Date range filter
      if (filter.startDate || filter.endDate) {
        mongoFilter.arrivalTime = {};
        if (filter.startDate) {
          mongoFilter.arrivalTime.$gte = filter.startDate;
        }
        if (filter.endDate) {
          mongoFilter.arrivalTime.$lte = filter.endDate;
        }
      }

      // Status filter
      if (filter.status) {
        mongoFilter.status = filter.status;
      }

      // Guest name filter (case-insensitive partial match)
      if (filter.guestName) {
        mongoFilter.guestName = {
          $regex: filter.guestName,
          $options: "i",
        };
      }

      // Guest email filter
      if (filter.guestEmail) {
        mongoFilter.guestEmail = filter.guestEmail;
      }

      const skip = (page - 1) * limit;
      const options: FindOptions = {
        sort: { arrivalTime: 1 },
        skip,
        limit,
      };

      const [reservations, total] = await Promise.all([
        this.findWithFilter(mongoFilter, options),
        this.countWithFilter(mongoFilter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        reservations,
        total,
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

      const filter: Filter<any> = {
        arrivalTime: {
          $gte: startTime,
          $lte: endTime,
        },
        status: {
          $in: [ReservationStatus.REQUESTED, ReservationStatus.APPROVED],
        },
      };

      // Exclude current reservation if updating
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }

      return this.findWithFilter(filter);
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

      const pipeline = [
        {
          $match: {
            arrivalTime: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalGuests: { $sum: "$tableSize" },
            statusCounts: {
              $push: "$status",
            },
            tableSizes: {
              $push: "$tableSize",
            },
          },
        },
      ];

      const result = await this.collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          total: 0,
          byStatus: {
            [ReservationStatus.REQUESTED]: 0,
            [ReservationStatus.APPROVED]: 0,
            [ReservationStatus.CANCELLED]: 0,
            [ReservationStatus.COMPLETED]: 0,
          },
          averageTableSize: 0,
          totalGuests: 0,
        };
      }

      const stats = result[0];

      // Count by status
      const byStatus = stats.statusCounts.reduce(
        (acc: Record<string, number>, status: string) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );

      // Ensure all statuses are present
      Object.values(ReservationStatus).forEach((status) => {
        if (!byStatus[status]) {
          byStatus[status] = 0;
        }
      });

      const averageTableSize =
        stats.total > 0 ? stats.totalGuests / stats.total : 0;

      return {
        total: stats.total,
        byStatus: byStatus as Record<ReservationStatus, number>,
        averageTableSize: Math.round(averageTableSize * 100) / 100,
        totalGuests: stats.totalGuests,
      };
    } catch (error) {
      logger.error("Error getting reservation statistics:", error);
      throw error;
    }
  }
}
