import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ApolloError,
} from "apollo-server-express";

/**
 * Custom GraphQL error types
 */
export class ValidationError extends UserInputError {
  constructor(message: string, validationErrors?: any) {
    super(message, { validationErrors });
  }
}

export class NotFoundError extends ApolloError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    super(message, "NOT_FOUND");
  }
}

export class ConflictError extends ApolloError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

export class BusinessRuleError extends ApolloError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_VIOLATION");
  }
}

/**
 * GraphQL error factory functions
 */
export const GraphQLErrors = {
  // Authentication errors
  unauthenticated: (message: string = "Authentication required") =>
    new AuthenticationError(message),

  forbidden: (message: string = "Insufficient permissions") =>
    new ForbiddenError(message),

  // Validation errors
  invalidInput: (message: string, validationErrors?: any) =>
    new ValidationError(message, validationErrors),

  // Resource errors
  notFound: (resource: string, id?: string) => new NotFoundError(resource, id),

  conflict: (message: string) => new ConflictError(message),

  // Business logic errors
  businessRule: (message: string) => new BusinessRuleError(message),

  // Reservation-specific errors
  reservationNotFound: (id: string) => new NotFoundError("Reservation", id),

  invalidReservationTime: (message: string = "Invalid reservation time") =>
    new BusinessRuleError(message),

  reservationConflict: (message: string = "Reservation time conflict") =>
    new ConflictError(message),

  invalidStatusTransition: (from: string, to: string) =>
    new BusinessRuleError(`Cannot change status from ${from} to ${to}`),

  tableNotAvailable: (tableSize: number, time: Date) =>
    new ConflictError(
      `No table available for ${tableSize} people at ${time.toISOString()}`
    ),
};
