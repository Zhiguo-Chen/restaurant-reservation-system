import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ApolloError,
} from "apollo-server-express";

/**
 * Authentication error for GraphQL operations
 */
export class GraphQLAuthenticationError extends AuthenticationError {
  constructor(message: string = "Authentication required") {
    super(message);
  }
}

/**
 * Authorization error for GraphQL operations
 */
export class GraphQLForbiddenError extends ForbiddenError {
  constructor(message: string = "Insufficient permissions") {
    super(message);
  }
}

/**
 * Input validation error for GraphQL operations
 */
export class GraphQLValidationError extends UserInputError {
  constructor(message: string, validationErrors?: any) {
    super(message, { validationErrors });
  }
}

/**
 * General business logic error for GraphQL operations
 */
export class GraphQLBusinessError extends ApolloError {
  constructor(message: string, code: string = "BUSINESS_ERROR") {
    super(message, code);
  }
}

// Export all errors as GraphQLErrors for backward compatibility
export const GraphQLErrors = {
  GraphQLAuthenticationError,
  GraphQLForbiddenError,
  GraphQLValidationError,
  GraphQLBusinessError,
};
