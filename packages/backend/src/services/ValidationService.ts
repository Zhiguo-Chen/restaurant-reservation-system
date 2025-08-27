import {
  ValidationResult,
  ValidationError,
  CreateReservationData,
  UpdateReservationData,
  ReservationStatus,
} from "../types/shared";
import { ValidationService as IValidationService } from "../interfaces/services";
import logger from "../utils/logger";

/**
 * ValidationService provides comprehensive input validation and business rule validation
 * Includes structured error formatting and logging integration
 */
export class ValidationService implements IValidationService {
  /**
   * Validate reservation data for creation
   */
  validateReservationData(data: CreateReservationData): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate guest name
    if (!data.guestName || !data.guestName.trim()) {
      errors.push({
        field: "guestName",
        message: "Guest name is required",
        code: "REQUIRED_FIELD",
      });
    } else if (data.guestName.trim().length < 2) {
      errors.push({
        field: "guestName",
        message: "Guest name must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    } else if (data.guestName.trim().length > 100) {
      errors.push({
        field: "guestName",
        message: "Guest name must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    }

    // Validate guest email
    const emailValidation = this.validateEmail(data.guestEmail);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Validate guest phone
    const phoneValidation = this.validatePhone(data.guestPhone);
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    }

    // Validate arrival time
    const arrivalTimeValidation = this.validateArrivalTime(data.arrivalTime);
    if (!arrivalTimeValidation.isValid) {
      errors.push(...arrivalTimeValidation.errors);
    }

    // Validate table size (optional)
    if (data.tableSize !== undefined) {
      const tableSizeValidation = this.validateTableSize(data.tableSize);
      if (!tableSizeValidation.isValid) {
        errors.push(...tableSizeValidation.errors);
      }
    }

    // Validate notes (optional)
    if (data.notes && data.notes.length > 500) {
      errors.push({
        field: "notes",
        message: "Notes must not exceed 500 characters",
        code: "MAX_LENGTH",
      });
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.warn("Reservation data validation failed", {
        errors,
        guestEmail: data.guestEmail,
      });
    }

    return { isValid, errors };
  }

  /**
   * Validate update reservation data
   */
  validateUpdateReservationData(data: UpdateReservationData): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate arrival time if provided
    if (data.arrivalTime) {
      const arrivalTimeValidation = this.validateArrivalTime(data.arrivalTime);
      if (!arrivalTimeValidation.isValid) {
        errors.push(...arrivalTimeValidation.errors);
      }
    }

    // Validate table size if provided
    if (data.tableSize !== undefined) {
      const tableSizeValidation = this.validateTableSize(data.tableSize);
      if (!tableSizeValidation.isValid) {
        errors.push(...tableSizeValidation.errors);
      }
    }

    // Validate notes if provided
    if (data.notes && data.notes.length > 500) {
      errors.push({
        field: "notes",
        message: "Notes must not exceed 500 characters",
        code: "MAX_LENGTH",
      });
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.warn("Update reservation data validation failed", {
        errors,
        updatedBy: data.updatedBy,
      });
    }

    return { isValid, errors };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!email || !email.trim()) {
      errors.push({
        field: "guestEmail",
        message: "Email is required",
        code: "REQUIRED_FIELD",
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push({
          field: "guestEmail",
          message: "Invalid email format",
          code: "INVALID_FORMAT",
        });
      } else if (email.trim().length > 254) {
        errors.push({
          field: "guestEmail",
          message: "Email must not exceed 254 characters",
          code: "MAX_LENGTH",
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!phone || !phone.trim()) {
      errors.push({
        field: "guestPhone",
        message: "Phone number is required",
        code: "REQUIRED_FIELD",
      });
    } else {
      // Remove common formatting characters
      const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");

      // Basic phone validation - should start with + or digit and be 10-15 digits
      const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.push({
          field: "guestPhone",
          message:
            "Invalid phone number format. Use international format (+1234567890) or local format (1234567890)",
          code: "INVALID_FORMAT",
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate arrival time
   */
  validateArrivalTime(arrivalTime: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (!arrivalTime) {
      errors.push({
        field: "arrivalTime",
        message: "Arrival time is required",
        code: "REQUIRED_FIELD",
      });
      return { isValid: false, errors };
    }

    const now = new Date();
    const arrival = new Date(arrivalTime);

    // Check if it's a valid date
    if (isNaN(arrival.getTime())) {
      errors.push({
        field: "arrivalTime",
        message: "Invalid date format",
        code: "INVALID_FORMAT",
      });
      return { isValid: false, errors };
    }

    // Check if arrival time is in the future
    if (arrival <= now) {
      errors.push({
        field: "arrivalTime",
        message: "Arrival time must be in the future",
        code: "INVALID_DATE_RANGE",
      });
    }

    // Check if arrival time is within business hours (10 AM - 10 PM)
    const hour = arrival.getHours();
    if (hour < 10 || hour >= 22) {
      errors.push({
        field: "arrivalTime",
        message:
          "Reservations are only available between 10:00 AM and 10:00 PM",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    }

    // Check if arrival time is not too far in the future (e.g., max 6 months)
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    if (arrival > maxFutureDate) {
      errors.push({
        field: "arrivalTime",
        message: "Reservations can only be made up to 6 months in advance",
        code: "TOO_FAR_FUTURE",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate table size
   */
  validateTableSize(tableSize: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (tableSize === undefined || tableSize === null) {
      errors.push({
        field: "tableSize",
        message: "Table size is required",
        code: "REQUIRED_FIELD",
      });
    } else if (!Number.isInteger(tableSize)) {
      errors.push({
        field: "tableSize",
        message: "Table size must be a whole number",
        code: "INVALID_TYPE",
      });
    } else if (tableSize < 1) {
      errors.push({
        field: "tableSize",
        message: "Table size must be at least 1",
        code: "MIN_VALUE",
      });
    } else if (tableSize > 12) {
      errors.push({
        field: "tableSize",
        message: "Table size cannot exceed 12 people",
        code: "MAX_VALUE",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate time slot availability (business rule)
   */
  async validateTimeSlot(
    arrivalTime: Date,
    tableSize: number
  ): Promise<boolean> {
    try {
      // Basic time slot validation
      const timeValidation = this.validateArrivalTime(arrivalTime);
      const sizeValidation = this.validateTableSize(tableSize);

      if (!timeValidation.isValid || !sizeValidation.isValid) {
        return false;
      }

      // Additional business rules for time slots
      const dayOfWeek = arrivalTime.getDay();
      const hour = arrivalTime.getHours();

      // Example: No large parties (>8) on Friday/Saturday evenings
      if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 18 && tableSize > 8) {
        logger.info("Large party rejected for weekend evening", {
          arrivalTime,
          tableSize,
          dayOfWeek,
          hour,
        });
        return false;
      }

      // Example: Lunch service ends at 3 PM
      if (hour >= 15 && hour < 17) {
        logger.info("Reservation rejected during break time", {
          arrivalTime,
          hour,
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error validating time slot", {
        error: error instanceof Error ? error.message : "Unknown error",
        arrivalTime,
        tableSize,
      });
      return false;
    }
  }

  /**
   * Validate status transitions (business rule)
   */
  validateStatusTransition(
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

    const isValid = validTransitions[currentStatus].includes(newStatus);

    if (!isValid) {
      logger.warn("Invalid status transition attempted", {
        currentStatus,
        newStatus,
        validTransitions: validTransitions[currentStatus],
      });
    }

    return isValid;
  }

  /**
   * Validate reservation ID format
   */
  validateReservationId(id: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!id || !id.trim()) {
      errors.push({
        field: "id",
        message: "Reservation ID is required",
        code: "REQUIRED_FIELD",
      });
    } else {
      // Validate ID format (should match our generated format)
      const idRegex = /^RES_[A-Z0-9_]+$/;
      if (!idRegex.test(id.trim())) {
        errors.push({
          field: "id",
          message: "Invalid reservation ID format",
          code: "INVALID_FORMAT",
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(page: number, limit: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (!Number.isInteger(page) || page < 1) {
      errors.push({
        field: "page",
        message: "Page must be a positive integer",
        code: "INVALID_VALUE",
      });
    }

    if (!Number.isInteger(limit) || limit < 1) {
      errors.push({
        field: "limit",
        message: "Limit must be a positive integer",
        code: "INVALID_VALUE",
      });
    } else if (limit > 100) {
      errors.push({
        field: "limit",
        message: "Limit cannot exceed 100",
        code: "MAX_VALUE",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate date range for queries
   */
  validateDateRange(startDate?: Date, endDate?: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (startDate && isNaN(startDate.getTime())) {
      errors.push({
        field: "startDate",
        message: "Invalid start date format",
        code: "INVALID_FORMAT",
      });
    }

    if (endDate && isNaN(endDate.getTime())) {
      errors.push({
        field: "endDate",
        message: "Invalid end date format",
        code: "INVALID_FORMAT",
      });
    }

    if (startDate && endDate && startDate > endDate) {
      errors.push({
        field: "dateRange",
        message: "Start date must be before end date",
        code: "INVALID_DATE_RANGE",
      });
    }

    // Limit date range to prevent performance issues
    if (startDate && endDate) {
      const daysDifference =
        Math.abs(endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDifference > 365) {
        errors.push({
          field: "dateRange",
          message: "Date range cannot exceed 365 days",
          code: "DATE_RANGE_TOO_LARGE",
        });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Create a formatted validation error response
   */
  formatValidationErrors(errors: ValidationError[]): {
    message: string;
    details: ValidationError[];
    code: string;
  } {
    const message =
      errors.length === 1
        ? errors[0].message
        : `Validation failed with ${errors.length} errors`;

    return {
      message,
      details: errors,
      code: "VALIDATION_ERROR",
    };
  }

  /**
   * Create a business rule violation error response
   */
  formatBusinessRuleError(
    rule: string,
    message: string
  ): {
    message: string;
    rule: string;
    code: string;
  } {
    logger.warn("Business rule violation", { rule, message });

    return {
      message,
      rule,
      code: "BUSINESS_RULE_VIOLATION",
    };
  }

  /**
   * Create a generic error response with logging
   */
  formatGenericError(
    error: Error | string,
    context?: Record<string, any>
  ): {
    message: string;
    code: string;
    timestamp: string;
  } {
    const errorMessage = error instanceof Error ? error.message : error;
    const timestamp = new Date().toISOString();

    logger.error("Generic error occurred", {
      error: errorMessage,
      context,
      timestamp,
    });

    return {
      message: "An unexpected error occurred. Please try again.",
      code: "INTERNAL_ERROR",
      timestamp,
    };
  }

  /**
   * Sanitize input data to prevent injection attacks
   */
  sanitizeInput(input: string): string {
    if (!input) return input;

    // Remove potentially dangerous characters
    return input
      .trim()
      .replace(/[<>]/g, "") // Remove HTML tags
      .replace(/['"]/g, "") // Remove quotes
      .replace(/[\\]/g, "") // Remove backslashes
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize search query
   */
  validateSearchQuery(query: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!query || !query.trim()) {
      errors.push({
        field: "query",
        message: "Search query is required",
        code: "REQUIRED_FIELD",
      });
    } else if (query.trim().length < 2) {
      errors.push({
        field: "query",
        message: "Search query must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    } else if (query.trim().length > 100) {
      errors.push({
        field: "query",
        message: "Search query must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate multiple fields at once and return combined result
   */
  validateMultipleFields(
    validations: Array<{ field: string; validation: ValidationResult }>
  ): ValidationResult {
    const allErrors: ValidationError[] = [];

    validations.forEach(({ validation }) => {
      if (!validation.isValid) {
        allErrors.push(...validation.errors);
      }
    });

    const isValid = allErrors.length === 0;

    if (!isValid) {
      logger.warn("Multiple field validation failed", {
        errorCount: allErrors.length,
        fields: allErrors.map((e) => e.field),
      });
    }

    return { isValid, errors: allErrors };
  }

  /**
   * Validate business hours for a given date
   */
  validateBusinessHours(date: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (!date || isNaN(date.getTime())) {
      errors.push({
        field: "date",
        message: "Invalid date provided",
        code: "INVALID_FORMAT",
      });
      return { isValid: false, errors };
    }

    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Check if it's within business hours (10 AM - 10 PM)
    if (hour < 10 || hour >= 22) {
      errors.push({
        field: "date",
        message: "Time must be within business hours (10:00 AM - 10:00 PM)",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    }

    // Check if it's a business day (assuming restaurant is closed on Mondays)
    if (dayOfWeek === 1) {
      errors.push({
        field: "date",
        message: "Restaurant is closed on Mondays",
        code: "CLOSED_DAY",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate that a date is not in the past
   */
  validateFutureDate(date: Date, fieldName: string = "date"): ValidationResult {
    const errors: ValidationError[] = [];

    if (!date || isNaN(date.getTime())) {
      errors.push({
        field: fieldName,
        message: "Invalid date provided",
        code: "INVALID_FORMAT",
      });
      return { isValid: false, errors };
    }

    const now = new Date();
    if (date <= now) {
      errors.push({
        field: fieldName,
        message: "Date must be in the future",
        code: "INVALID_DATE_RANGE",
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate reservation capacity constraints
   */
  validateReservationCapacity(
    tableSize: number,
    arrivalTime: Date
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic validation first
    const tableSizeValidation = this.validateTableSize(tableSize);
    const timeValidation = this.validateArrivalTime(arrivalTime);

    if (!tableSizeValidation.isValid) {
      errors.push(...tableSizeValidation.errors);
    }

    if (!timeValidation.isValid) {
      errors.push(...timeValidation.errors);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Business rule: Large parties (>8) require advance notice
    const hoursUntilReservation =
      (arrivalTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (tableSize > 8 && hoursUntilReservation < 24) {
      errors.push({
        field: "tableSize",
        message:
          "Large parties (9+ people) require at least 24 hours advance notice",
        code: "ADVANCE_NOTICE_REQUIRED",
      });
    }

    // Business rule: Very large parties (>10) need special approval
    if (tableSize > 10) {
      errors.push({
        field: "tableSize",
        message:
          "Parties larger than 10 people require special approval. Please call the restaurant.",
        code: "SPECIAL_APPROVAL_REQUIRED",
      });
    }

    return { isValid: errors.length === 0, errors };
  }
}
