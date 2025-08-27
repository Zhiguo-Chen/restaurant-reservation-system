import {
  Reservation,
  ReservationStatus,
  CreateReservationData,
  UpdateReservationData,
  ReservationFilter,
} from "../types/shared";
import { ReservationService as IReservationService } from "../interfaces/services";
import { ReservationRepository } from "../interfaces/repositories";
import logger from "../utils/logger";

/**
 * ReservationService implements business logic for reservation management
 * Includes conflict detection, audit trails, and notification logic
 */
export class ReservationService implements IReservationService {
  constructor(private reservationRepository: ReservationRepository) {}

  /**
   * Create a new reservation with business logic validation
   */
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    logger.info("Creating reservation", {
      guestEmail: data.guestEmail,
      arrivalTime: data.arrivalTime,
      tableSize: data.tableSize,
    });

    // Check for time slot conflicts first
    const hasConflict = await this.checkTimeSlotConflict(
      data.arrivalTime,
      data.tableSize || 2
    );

    if (hasConflict) {
      logger.warn("Reservation conflict detected", {
        arrivalTime: data.arrivalTime,
        tableSize: data.tableSize,
      });
      throw new Error(
        "The requested time slot is not available. Please choose a different time."
      );
    }

    // Generate unique ID
    const id = this.generateReservationId();

    const reservation: Reservation = {
      id,
      ...data,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const createdReservation = await this.reservationRepository.create(
        reservation
      );

      // Log audit trail
      await this.logAuditTrail(createdReservation.id, "CREATED", {
        action: "reservation_created",
        guestEmail: data.guestEmail,
        arrivalTime: data.arrivalTime,
        tableSize: data.tableSize,
      });

      // Send notification (placeholder for future implementation)
      await this.sendReservationNotification(createdReservation, "CREATED");

      logger.info("Reservation created successfully", {
        reservationId: createdReservation.id,
        guestEmail: data.guestEmail,
      });

      return createdReservation;
    } catch (error) {
      logger.error("Failed to create reservation", {
        error: error instanceof Error ? error.message : "Unknown error",
        data,
      });
      throw new Error("Failed to create reservation");
    }
  }

  /**
   * Update an existing reservation with conflict checking
   */
  async updateReservation(
    id: string,
    data: UpdateReservationData
  ): Promise<Reservation> {
    logger.info("Updating reservation", { reservationId: id, updates: data });

    const existingReservation = await this.reservationRepository.findById(id);
    if (!existingReservation) {
      throw new Error("Reservation not found");
    }

    // If arrival time or table size is being updated, check for conflicts
    if (data.arrivalTime || data.tableSize) {
      const newArrivalTime =
        data.arrivalTime || existingReservation.arrivalTime;
      const newTableSize = data.tableSize || existingReservation.tableSize || 2;

      const hasConflict = await this.checkTimeSlotConflict(
        newArrivalTime,
        newTableSize,
        id // Exclude current reservation from conflict check
      );

      if (hasConflict) {
        logger.warn("Reservation update conflict detected", {
          reservationId: id,
          newArrivalTime,
          newTableSize,
        });
        throw new Error(
          "The requested time slot is not available. Please choose a different time."
        );
      }
    }

    try {
      const updatedReservation = await this.reservationRepository.update(
        id,
        data
      );

      // Log audit trail
      await this.logAuditTrail(id, "UPDATED", {
        action: "reservation_updated",
        changes: data,
        updatedBy: data.updatedBy,
      });

      // Send notification
      await this.sendReservationNotification(updatedReservation, "UPDATED");

      logger.info("Reservation updated successfully", {
        reservationId: id,
        updatedBy: data.updatedBy,
      });

      return updatedReservation;
    } catch (error) {
      logger.error("Failed to update reservation", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId: id,
        data,
      });
      throw new Error("Failed to update reservation");
    }
  }

  /**
   * Cancel a reservation with audit trail
   */
  async cancelReservation(id: string): Promise<Reservation> {
    logger.info("Cancelling reservation", { reservationId: id });

    const existingReservation = await this.reservationRepository.findById(id);
    if (!existingReservation) {
      throw new Error("Reservation not found");
    }

    if (existingReservation.status === ReservationStatus.CANCELLED) {
      throw new Error("Reservation is already cancelled");
    }

    if (existingReservation.status === ReservationStatus.COMPLETED) {
      throw new Error("Cannot cancel completed reservation");
    }

    const updateData: UpdateReservationData = {
      updatedAt: new Date(),
    };

    try {
      // Update status to cancelled
      const cancelledReservation = await this.updateStatus(
        id,
        ReservationStatus.CANCELLED,
        "system"
      );

      // Log audit trail
      await this.logAuditTrail(id, "CANCELLED", {
        action: "reservation_cancelled",
        previousStatus: existingReservation.status,
      });

      // Send notification
      await this.sendReservationNotification(cancelledReservation, "CANCELLED");

      logger.info("Reservation cancelled successfully", { reservationId: id });

      return cancelledReservation;
    } catch (error) {
      logger.error("Failed to cancel reservation", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId: id,
      });
      throw new Error("Failed to cancel reservation");
    }
  }

  /**
   * Update reservation status with validation and audit trail
   */
  async updateStatus(
    id: string,
    status: ReservationStatus,
    updatedBy: string
  ): Promise<Reservation> {
    logger.info("Updating reservation status", {
      reservationId: id,
      newStatus: status,
      updatedBy,
    });

    const existingReservation = await this.reservationRepository.findById(id);
    if (!existingReservation) {
      throw new Error("Reservation not found");
    }

    // Validate status transition
    if (!this.isValidStatusTransition(existingReservation.status, status)) {
      throw new Error(
        `Invalid status transition from ${existingReservation.status} to ${status}`
      );
    }

    const updateData: UpdateReservationData = {
      updatedAt: new Date(),
      updatedBy,
    };

    try {
      // Update the reservation with new status
      const updatedReservation = await this.reservationRepository.update(id, {
        ...updateData,
        // Note: We need to add status to UpdateReservationData interface
        // For now, we'll handle this in the repository layer
      });

      // Manually set the status since it's not in the update interface
      updatedReservation.status = status;
      await this.reservationRepository.update(id, updatedReservation);

      // Log audit trail
      await this.logAuditTrail(id, "STATUS_UPDATED", {
        action: "status_updated",
        previousStatus: existingReservation.status,
        newStatus: status,
        updatedBy,
      });

      // Send notification
      await this.sendReservationNotification(
        updatedReservation,
        "STATUS_UPDATED"
      );

      logger.info("Reservation status updated successfully", {
        reservationId: id,
        newStatus: status,
        updatedBy,
      });

      return updatedReservation;
    } catch (error) {
      logger.error("Failed to update reservation status", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId: id,
        status,
        updatedBy,
      });
      throw new Error("Failed to update reservation status");
    }
  }

  /**
   * Get a single reservation by ID
   */
  async getReservation(id: string): Promise<Reservation | null> {
    try {
      return await this.reservationRepository.findById(id);
    } catch (error) {
      logger.error("Failed to get reservation", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId: id,
      });
      throw new Error("Failed to retrieve reservation");
    }
  }

  /**
   * Get reservations by date and status
   */
  async getReservationsByDateAndStatus(
    date: Date,
    status?: ReservationStatus
  ): Promise<Reservation[]> {
    try {
      return await this.reservationRepository.findByDateAndStatus(date, status);
    } catch (error) {
      logger.error("Failed to get reservations by date and status", {
        error: error instanceof Error ? error.message : "Unknown error",
        date,
        status,
      });
      throw new Error("Failed to retrieve reservations");
    }
  }

  /**
   * Get reservations by email
   */
  async getReservationsByEmail(email: string): Promise<Reservation[]> {
    try {
      return await this.reservationRepository.findByGuestEmail(email);
    } catch (error) {
      logger.error("Failed to get reservations by email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
      });
      throw new Error("Failed to retrieve reservations");
    }
  }

  /**
   * Get reservations with pagination
   */
  async getReservationsWithPagination(
    filter: ReservationFilter,
    page: number,
    limit: number
  ): Promise<{
    reservations: Reservation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Convert ReservationFilter to repository filter format
      const repositoryFilter = {
        startDate: filter.startDate,
        endDate: filter.endDate,
        status: filter.status,
        guestName: filter.guestName,
        guestEmail: filter.guestEmail,
      };

      // Use the repository's pagination method
      return await (this.reservationRepository as any).findWithPagination(
        repositoryFilter,
        page,
        limit
      );
    } catch (error) {
      logger.error("Failed to get reservations with pagination", {
        error: error instanceof Error ? error.message : "Unknown error",
        filter,
        page,
        limit,
      });
      throw new Error("Failed to retrieve reservations");
    }
  }

  /**
   * Check for time slot conflicts
   * Returns true if there's a conflict, false otherwise
   */
  private async checkTimeSlotConflict(
    arrivalTime: Date,
    tableSize: number,
    excludeReservationId?: string
  ): Promise<boolean> {
    try {
      // Define conflict window (e.g., 2 hours)
      const conflictWindowHours = 2;
      const conflictWindowMs = conflictWindowHours * 60 * 60 * 1000;

      const startTime = new Date(arrivalTime.getTime() - conflictWindowMs);
      const endTime = new Date(arrivalTime.getTime() + conflictWindowMs);

      // Get reservations in the conflict window
      const conflictingReservations =
        await this.reservationRepository.findByDateRange(startTime, endTime);

      // Filter out cancelled reservations and the current reservation (if updating)
      const activeReservations = conflictingReservations.filter(
        (reservation) =>
          reservation.status !== ReservationStatus.CANCELLED &&
          reservation.id !== excludeReservationId
      );

      // Simple conflict detection: assume restaurant has limited capacity
      // In a real system, this would be more sophisticated with table management
      const maxConcurrentReservations = 10; // Example capacity
      const totalTableSize = activeReservations.reduce(
        (sum, reservation) => sum + (reservation.tableSize || 2),
        0
      );

      const wouldExceedCapacity =
        totalTableSize + tableSize > maxConcurrentReservations * 4; // Assume avg 4 people per table

      if (wouldExceedCapacity) {
        logger.info("Time slot conflict detected", {
          arrivalTime,
          tableSize,
          activeReservations: activeReservations.length,
          totalTableSize,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error checking time slot conflict", {
        error: error instanceof Error ? error.message : "Unknown error",
        arrivalTime,
        tableSize,
      });
      // In case of error, assume no conflict to avoid blocking reservations
      return false;
    }
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus
  ): boolean {
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.REQUESTED]: [
        ReservationStatus.CONFIRMED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.CONFIRMED]: [
        ReservationStatus.SEATED,
        ReservationStatus.CANCELLED,
        ReservationStatus.NO_SHOW,
      ],
      [ReservationStatus.APPROVED]: [
        ReservationStatus.SEATED,
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.SEATED]: [
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.COMPLETED]: [], // Cannot transition from completed
      [ReservationStatus.CANCELLED]: [], // Cannot transition from cancelled
      [ReservationStatus.NO_SHOW]: [], // Cannot transition from no_show
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Generate unique reservation ID
   */
  private generateReservationId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `RES_${timestamp}_${randomStr}`.toUpperCase();
  }

  /**
   * Log audit trail for reservation changes
   */
  private async logAuditTrail(
    reservationId: string,
    action: string,
    details: any
  ): Promise<void> {
    try {
      // In a real system, this would write to an audit log table
      logger.info("Audit trail", {
        reservationId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });

      // TODO: Implement actual audit trail storage
      // await this.auditRepository.create({
      //   reservationId,
      //   action,
      //   details,
      //   timestamp: new Date(),
      // });
    } catch (error) {
      logger.error("Failed to log audit trail", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId,
        action,
      });
      // Don't throw error for audit logging failures
    }
  }

  /**
   * Send reservation notifications
   */
  private async sendReservationNotification(
    reservation: Reservation,
    type: "CREATED" | "UPDATED" | "CANCELLED" | "STATUS_UPDATED"
  ): Promise<void> {
    try {
      // In a real system, this would integrate with email/SMS services
      logger.info("Sending reservation notification", {
        reservationId: reservation.id,
        guestEmail: reservation.guestEmail,
        type,
        status: reservation.status,
      });

      // TODO: Implement actual notification service
      // await this.notificationService.sendReservationNotification({
      //   reservation,
      //   type,
      //   recipient: reservation.guestEmail,
      // });
    } catch (error) {
      logger.error("Failed to send reservation notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        reservationId: reservation.id,
        type,
      });
      // Don't throw error for notification failures
    }
  }
}
