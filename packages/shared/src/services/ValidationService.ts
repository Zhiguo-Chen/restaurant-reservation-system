import {
  ReservationStatus,
  ValidationResult,
  ValidationError,
  CreateReservationData,
  BUSINESS_RULES,
  STATUS_TRANSITIONS,
  BusinessErrorCode,
} from "../types";
import { ReservationModel } from "../models/Reservation";
import { BusinessValidation } from "../validation/BusinessValidation";
import { combineValidationResults } from "../utils/validation";

/**
 * Comprehensive validation service that combines model and business validation
 */
export class ValidationService {
  /**
   * Validates complete reservation data including business rules
   */
  static validateReservationData(
    data: CreateReservationData
  ): ValidationResult {
    // Create model and validate basic data integrity
    const reservation = new ReservationModel({
      ...data,
      id: "temp-id", // Temporary ID for validation
    });

    const modelValidation = reservation.validate();

    // Validate business rules
    const timeSlotValidation = BusinessValidation.validateTimeSlot(
      data.arrivalTime,
      data.tableSize
    );
    const tableSizeValidation = BusinessValidation.validateTableSize(
      data.tableSize
    );

    // Combine all validation results
    return combineValidationResults(
      modelValidation,
      timeSlotValidation,
      tableSizeValidation
    );
  }

  /**
   * Validates if a time slot is available (business rules only)
   */
  static async validateTimeSlot(
    arrivalTime: Date,
    tableSize: number,
    existingReservations: Array<{ arrivalTime: Date; tableSize: number }> = []
  ): Promise<ValidationResult> {
    const basicValidation = BusinessValidation.validateTimeSlot(
      arrivalTime,
      tableSize
    );
    const timingValidation = BusinessValidation.validateReservationTiming(
      arrivalTime,
      tableSize,
      existingReservations
    );

    return combineValidationResults(basicValidation, timingValidation);
  }

  /**
   * Validates status transitions
   */
  static validateStatusTransition(
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus
  ): ValidationResult {
    return BusinessValidation.validateStatusTransition(
      currentStatus,
      newStatus
    );
  }

  /**
   * Validates if a reservation can be modified
   */
  static validateReservationModification(
    status: ReservationStatus,
    arrivalTime: Date,
    isEmployeeAction: boolean = false
  ): ValidationResult {
    return BusinessValidation.validateReservationModification(
      status,
      arrivalTime,
      isEmployeeAction
    );
  }

  /**
   * Validates if a reservation can be cancelled
   */
  static validateReservationCancellation(
    status: ReservationStatus,
    arrivalTime: Date
  ): ValidationResult {
    return BusinessValidation.validateReservationCancellation(
      status,
      arrivalTime
    );
  }

  /**
   * Checks for large party warnings
   */
  static checkLargePartyWarning(tableSize: number) {
    return BusinessValidation.checkLargePartyWarning(tableSize);
  }

  /**
   * Validates complete reservation update
   */
  static validateReservationUpdate(
    currentReservation: {
      status: ReservationStatus;
      arrivalTime: Date;
    },
    updateData: {
      arrivalTime?: Date;
      tableSize?: number;
    },
    isEmployeeAction: boolean = false
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if modification is allowed
    const modificationValidation = this.validateReservationModification(
      currentReservation.status,
      currentReservation.arrivalTime,
      isEmployeeAction
    );

    if (!modificationValidation.isValid) {
      errors.push(...modificationValidation.errors);
    }

    // If updating arrival time, validate the new time
    if (updateData.arrivalTime) {
      const timeValidation = BusinessValidation.validateTimeSlot(
        updateData.arrivalTime,
        updateData.tableSize || 1
      );

      if (!timeValidation.isValid) {
        errors.push(...timeValidation.errors);
      }
    }

    // If updating table size, validate the new size
    if (updateData.tableSize) {
      const sizeValidation = BusinessValidation.validateTableSize(
        updateData.tableSize
      );

      if (!sizeValidation.isValid) {
        errors.push(...sizeValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
