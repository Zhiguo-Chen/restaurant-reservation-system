import {
  Reservation as IReservation,
  ReservationStatus,
  ValidationResult,
  ValidationError,
} from "../types";

export class ReservationModel implements IReservation {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: Date;
  tableSize: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  notes?: string;

  constructor(data: IReservation) {
    this.id = data.id;
    this.guestName = data.guestName;
    this.guestPhone = data.guestPhone;
    this.guestEmail = data.guestEmail;
    this.arrivalTime = data.arrivalTime;
    this.tableSize = data.tableSize;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.updatedBy = data.updatedBy;
    this.notes = data.notes;
  }

  /**
   * Validates the reservation data
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate guest name
    if (!this.guestName || this.guestName.trim().length === 0) {
      errors.push({
        field: "guestName",
        message: "Guest name is required",
        code: "REQUIRED",
      });
    } else if (this.guestName.trim().length < 2) {
      errors.push({
        field: "guestName",
        message: "Guest name must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    } else if (this.guestName.trim().length > 100) {
      errors.push({
        field: "guestName",
        message: "Guest name must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    }

    // Validate phone number
    if (!this.guestPhone || this.guestPhone.trim().length === 0) {
      errors.push({
        field: "guestPhone",
        message: "Phone number is required",
        code: "REQUIRED",
      });
    } else if (!this.isValidPhoneNumber(this.guestPhone)) {
      errors.push({
        field: "guestPhone",
        message: "Invalid phone number format",
        code: "INVALID_FORMAT",
      });
    }

    // Validate email
    if (!this.guestEmail || this.guestEmail.trim().length === 0) {
      errors.push({
        field: "guestEmail",
        message: "Email address is required",
        code: "REQUIRED",
      });
    } else if (!this.isValidEmail(this.guestEmail)) {
      errors.push({
        field: "guestEmail",
        message: "Invalid email address format",
        code: "INVALID_FORMAT",
      });
    }

    // Validate arrival time
    if (!this.arrivalTime) {
      errors.push({
        field: "arrivalTime",
        message: "Arrival time is required",
        code: "REQUIRED",
      });
    } else if (this.arrivalTime <= new Date()) {
      errors.push({
        field: "arrivalTime",
        message: "Arrival time must be in the future",
        code: "INVALID_DATE",
      });
    }

    // Validate table size
    if (!this.tableSize || this.tableSize <= 0) {
      errors.push({
        field: "tableSize",
        message: "Table size must be a positive number",
        code: "INVALID_NUMBER",
      });
    } else if (this.tableSize > 20) {
      errors.push({
        field: "tableSize",
        message: "Table size cannot exceed 20 people",
        code: "MAX_VALUE",
      });
    }

    // Validate status
    if (!Object.values(ReservationStatus).includes(this.status)) {
      errors.push({
        field: "status",
        message: "Invalid reservation status",
        code: "INVALID_ENUM",
      });
    }

    // Validate notes length if provided
    if (this.notes && this.notes.length > 500) {
      errors.push({
        field: "notes",
        message: "Notes must not exceed 500 characters",
        code: "MAX_LENGTH",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates email format using regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates phone number format (supports various international formats)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters except + at the beginning
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Check for valid phone number patterns
    const phoneRegex = /^(\+\d{1,3})?[\d\s\-\(\)]{7,15}$/;
    return (
      phoneRegex.test(phone.trim()) &&
      cleanPhone.length >= 7 &&
      cleanPhone.length <= 18
    );
  }

  /**
   * Converts the model to a plain object
   */
  toJSON(): IReservation {
    return {
      id: this.id,
      guestName: this.guestName,
      guestPhone: this.guestPhone,
      guestEmail: this.guestEmail,
      arrivalTime: this.arrivalTime,
      tableSize: this.tableSize,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
      notes: this.notes,
    };
  }

  /**
   * Creates a new reservation with default values
   */
  static create(
    data: Omit<IReservation, "id" | "status" | "createdAt" | "updatedAt">
  ): ReservationModel {
    const now = new Date();
    return new ReservationModel({
      ...data,
      id: "", // Will be set by repository
      status: ReservationStatus.REQUESTED,
      createdAt: now,
      updatedAt: now,
    });
  }
}
