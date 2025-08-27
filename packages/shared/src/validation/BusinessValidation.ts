import {
  ReservationStatus,
  ValidationResult,
  ValidationError,
  BUSINESS_RULES,
  STATUS_TRANSITIONS,
  BusinessErrorCode,
  LargePartyWarning,
} from "../types";

/**
 * Business validation rules for reservation system
 */
export class BusinessValidation {
  /**
   * Validates if a reservation time slot is available
   * Business rules:
   * - Reservations must be at least 1 hour in the future
   * - Reservations cannot be more than 30 days in advance
   * - Reservations must be during business hours (11 AM - 10 PM)
   * - No reservations on Mondays (restaurant closed)
   */
  static validateTimeSlot(
    arrivalTime: Date,
    tableSize: number
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const now = new Date();

    // Check if arrival time is at least 1 hour in the future
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    if (arrivalTime <= oneHourFromNow) {
      errors.push({
        field: "arrivalTime",
        message: "Reservations must be made at least 1 hour in advance",
        code: "MIN_ADVANCE_TIME",
      });
    }

    // Check if arrival time is not more than 30 days in advance
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    if (arrivalTime > thirtyDaysFromNow) {
      errors.push({
        field: "arrivalTime",
        message: "Reservations cannot be made more than 30 days in advance",
        code: "MAX_ADVANCE_TIME",
      });
    }

    // Check business hours (11 AM - 10 PM)
    const hour = arrivalTime.getHours();
    if (hour < 11 || hour >= 22) {
      errors.push({
        field: "arrivalTime",
        message:
          "Reservations are only available between 11:00 AM and 10:00 PM",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    }

    // Check if it's Monday (restaurant closed)
    const dayOfWeek = arrivalTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (dayOfWeek === 1) {
      errors.push({
        field: "arrivalTime",
        message: "Restaurant is closed on Mondays",
        code: "RESTAURANT_CLOSED",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates table size constraints
   * Business rules:
   * - Minimum table size is 1
   * - Maximum table size is 20
   * - Tables for 8+ people require special approval (warning, not error)
   */
  static validateTableSize(tableSize: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (tableSize < 1) {
      errors.push({
        field: "tableSize",
        message: "Table size must be at least 1 person",
        code: "MIN_TABLE_SIZE",
      });
    }

    if (tableSize > 20) {
      errors.push({
        field: "tableSize",
        message: "Table size cannot exceed 20 people",
        code: "MAX_TABLE_SIZE",
      });
    }

    // Note: Large party warning is handled separately in business logic

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates status transitions
   * Business rules:
   * - REQUESTED can go to: APPROVED, CANCELLED
   * - APPROVED can go to: CANCELLED, COMPLETED
   * - CANCELLED cannot change to any other status
   * - COMPLETED cannot change to any other status
   */
  static validateStatusTransition(
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Define valid transitions
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.REQUESTED]: [
        ReservationStatus.APPROVED,
        ReservationStatus.CANCELLED,
      ],
      [ReservationStatus.APPROVED]: [
        ReservationStatus.CANCELLED,
        ReservationStatus.COMPLETED,
      ],
      [ReservationStatus.CANCELLED]: [], // No transitions allowed
      [ReservationStatus.COMPLETED]: [], // No transitions allowed
    };

    // Check if transition is valid
    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      errors.push({
        field: "status",
        message: `Cannot change status from ${currentStatus} to ${newStatus}`,
        code: "INVALID_STATUS_TRANSITION",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates if a reservation can be modified
   * Business rules:
   * - Only REQUESTED and APPROVED reservations can be modified by guests
   * - CANCELLED and COMPLETED reservations cannot be modified
   * - Reservations cannot be modified within 2 hours of arrival time
   */
  static validateReservationModification(
    status: ReservationStatus,
    arrivalTime: Date,
    isEmployeeAction: boolean = false
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Employees can modify any reservation except COMPLETED
    if (isEmployeeAction) {
      if (status === ReservationStatus.COMPLETED) {
        errors.push({
          field: "status",
          message: "Completed reservations cannot be modified",
          code: "RESERVATION_COMPLETED",
        });
      }
      return {
        isValid: errors.length === 0,
        errors,
      };
    }

    // Guest modifications
    if (status === ReservationStatus.CANCELLED) {
      errors.push({
        field: "status",
        message: "Cancelled reservations cannot be modified",
        code: "RESERVATION_CANCELLED",
      });
    }

    if (status === ReservationStatus.COMPLETED) {
      errors.push({
        field: "status",
        message: "Completed reservations cannot be modified",
        code: "RESERVATION_COMPLETED",
      });
    }

    // Check if modification is within 2 hours of arrival
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (arrivalTime <= twoHoursFromNow) {
      errors.push({
        field: "arrivalTime",
        message:
          "Reservations cannot be modified within 2 hours of arrival time",
        code: "TOO_CLOSE_TO_ARRIVAL",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates if a reservation can be cancelled
   * Business rules:
   * - Only REQUESTED and APPROVED reservations can be cancelled
   * - Reservations can be cancelled up to 30 minutes before arrival
   */
  static validateReservationCancellation(
    status: ReservationStatus,
    arrivalTime: Date
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (status === ReservationStatus.CANCELLED) {
      errors.push({
        field: "status",
        message: "Reservation is already cancelled",
        code: "ALREADY_CANCELLED",
      });
    }

    if (status === ReservationStatus.COMPLETED) {
      errors.push({
        field: "status",
        message: "Completed reservations cannot be cancelled",
        code: "RESERVATION_COMPLETED",
      });
    }

    // Check if cancellation is at least 30 minutes before arrival
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    if (arrivalTime <= thirtyMinutesFromNow) {
      errors.push({
        field: "arrivalTime",
        message:
          "Reservations cannot be cancelled within 30 minutes of arrival time",
        code: "TOO_CLOSE_TO_ARRIVAL",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if a large party requires special handling
   * Returns warning for parties of 8 or more people
   */
  static checkLargePartyWarning(tableSize: number): {
    requiresApproval: boolean;
    message?: string;
  } {
    if (tableSize >= 8) {
      return {
        requiresApproval: true,
        message:
          "Large parties (8+ people) may require special arrangements and longer preparation time",
      };
    }

    return { requiresApproval: false };
  }

  /**
   * Validates reservation timing conflicts
   * This would typically check against existing reservations in the database
   * For now, it validates basic timing rules
   */
  static validateReservationTiming(
    arrivalTime: Date,
    tableSize: number,
    existingReservations: Array<{ arrivalTime: Date; tableSize: number }> = []
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic time slot validation
    const timeSlotValidation = this.validateTimeSlot(arrivalTime, tableSize);
    if (!timeSlotValidation.isValid) {
      errors.push(...timeSlotValidation.errors);
    }

    // Check for potential conflicts (simplified logic)
    // In a real system, this would check table availability
    const conflictWindow = 2 * 60 * 60 * 1000; // 2 hours
    const conflicts = existingReservations.filter((existing) => {
      const timeDiff = Math.abs(
        existing.arrivalTime.getTime() - arrivalTime.getTime()
      );
      return timeDiff < conflictWindow && existing.tableSize + tableSize > 15; // Simplified capacity check
    });

    if (conflicts.length > 0) {
      errors.push({
        field: "arrivalTime",
        message:
          "This time slot may have limited availability due to other large reservations",
        code: "POTENTIAL_CONFLICT",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
