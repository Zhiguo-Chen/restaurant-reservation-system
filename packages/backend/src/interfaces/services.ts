import {
  Reservation,
  ReservationStatus,
  ReservationFilter,
  CreateReservationData,
  UpdateReservationData,
  ValidationResult,
  UserInfo,
  LoginRequest,
  AuthResponse,
  ErrorResponse,
} from "@restaurant-reservation/shared";

export interface ReservationService {
  createReservation(data: CreateReservationData): Promise<Reservation>;
  updateReservation(
    id: string,
    data: UpdateReservationData
  ): Promise<Reservation>;
  cancelReservation(id: string): Promise<Reservation>;
  getReservationsByDateAndStatus(
    date: Date,
    status?: ReservationStatus
  ): Promise<Reservation[]>;
  updateStatus(
    id: string,
    status: ReservationStatus,
    updatedBy: string
  ): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | null>;
  getReservationsByEmail(email: string): Promise<Reservation[]>;
  getReservationsWithPagination(
    filter: ReservationFilter,
    page: number,
    limit: number
  ): Promise<{
    reservations: Reservation[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export interface ValidationService {
  validateReservationData(data: CreateReservationData): ValidationResult;
  validateUpdateReservationData(data: UpdateReservationData): ValidationResult;
  validateEmail(email: string): ValidationResult;
  validatePhone(phone: string): ValidationResult;
  validateArrivalTime(arrivalTime: Date): ValidationResult;
  validateTableSize(tableSize: number): ValidationResult;
  validateTimeSlot(arrivalTime: Date, tableSize: number): Promise<boolean>;
  validateStatusTransition(
    currentStatus: ReservationStatus,
    newStatus: ReservationStatus
  ): boolean;
  validateReservationId(id: string): ValidationResult;
  validatePaginationParams(page: number, limit: number): ValidationResult;
  validateDateRange(startDate?: Date, endDate?: Date): ValidationResult;
  validateSearchQuery(query: string): ValidationResult;
  sanitizeInput(input: string): string;
  validateMultipleFields(
    validations: Array<{ field: string; validation: ValidationResult }>
  ): ValidationResult;
  validateBusinessHours(date: Date): ValidationResult;
  validateFutureDate(date: Date, fieldName?: string): ValidationResult;
  validateReservationCapacity(
    tableSize: number,
    arrivalTime: Date
  ): ValidationResult;
}

export interface AuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  logout(token: string): Promise<void>;
  validateToken(token: string): Promise<UserInfo>;
  generateToken(user: UserInfo): string;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface ErrorHandlingService {
  createErrorResponse(
    error: StructuredError,
    requestId?: string
  ): ErrorResponse;
  createValidationError(
    message: string,
    details?: any,
    context?: Record<string, any>
  ): StructuredError;
  createBusinessRuleError(
    message: string,
    rule: string,
    context?: Record<string, any>
  ): StructuredError;
  createNotFoundError(
    resource: string,
    identifier?: string,
    context?: Record<string, any>
  ): StructuredError;
  createUnauthorizedError(
    message?: string,
    context?: Record<string, any>
  ): StructuredError;
  createForbiddenError(
    message?: string,
    context?: Record<string, any>
  ): StructuredError;
  createConflictError(
    message: string,
    conflictType: string,
    context?: Record<string, any>
  ): StructuredError;
  createRateLimitError(
    message?: string,
    limit?: number,
    resetTime?: Date,
    context?: Record<string, any>
  ): StructuredError;
  createInternalError(
    message?: string,
    originalError?: Error,
    context?: Record<string, any>
  ): StructuredError;
  createDatabaseError(
    message: string,
    operation: string,
    originalError?: Error,
    context?: Record<string, any>
  ): StructuredError;
  createExternalServiceError(
    service: string,
    message: string,
    statusCode?: number,
    context?: Record<string, any>
  ): StructuredError;
  handleUnknownError(
    error: unknown,
    context?: Record<string, any>
  ): StructuredError;
  isRetryableError(error: StructuredError): boolean;
  getHttpStatusCode(errorType: ErrorType): number;
  sanitizeErrorForClient(error: StructuredError): StructuredError;
  createErrorMetrics(error: StructuredError): {
    errorType: string;
    errorCode: string;
    severity: string;
    timestamp: string;
    count: number;
  };
}

export interface StructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code: string;
  details?: any;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
