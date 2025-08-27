import { GraphQLErrors } from "../errors";
import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
  ApolloError,
} from "apollo-server-express";

describe("GraphQL Error Handling", () => {
  describe("GraphQL Error Factory", () => {
    it("should create authentication error", () => {
      const error = GraphQLErrors.unauthenticated("Token required");

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Token required");
      expect(error.extensions?.code).toBe("UNAUTHENTICATED");
    });

    it("should create forbidden error", () => {
      const error = GraphQLErrors.forbidden("Access denied");

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe("Access denied");
      expect(error.extensions?.code).toBe("FORBIDDEN");
    });

    it("should create validation error with details", () => {
      const validationErrors = { email: "Invalid format" };
      const error = GraphQLErrors.invalidInput(
        "Validation failed",
        validationErrors
      );

      expect(error).toBeInstanceOf(UserInputError);
      expect(error.message).toBe("Validation failed");
      expect(error.extensions?.validationErrors).toEqual(validationErrors);
    });

    it("should create not found error", () => {
      const error = GraphQLErrors.notFound("User", "123");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("User with ID 123 not found");
      expect(error.extensions?.code).toBe("NOT_FOUND");
    });

    it("should create conflict error", () => {
      const error = GraphQLErrors.conflict("Resource already exists");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("Resource already exists");
      expect(error.extensions?.code).toBe("CONFLICT");
    });

    it("should create business rule error", () => {
      const error = GraphQLErrors.businessRule("Invalid operation");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("Invalid operation");
      expect(error.extensions?.code).toBe("BUSINESS_RULE_VIOLATION");
    });
  });

  describe("Reservation-Specific Errors", () => {
    it("should create reservation not found error", () => {
      const error = GraphQLErrors.reservationNotFound("res-123");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("Reservation with ID res-123 not found");
      expect(error.extensions?.code).toBe("NOT_FOUND");
    });

    it("should create invalid reservation time error", () => {
      const error = GraphQLErrors.invalidReservationTime("Time in the past");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("Time in the past");
      expect(error.extensions?.code).toBe("BUSINESS_RULE_VIOLATION");
    });

    it("should create reservation conflict error", () => {
      const error = GraphQLErrors.reservationConflict("Table already booked");

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe("Table already booked");
      expect(error.extensions?.code).toBe("CONFLICT");
    });

    it("should create invalid status transition error", () => {
      const error = GraphQLErrors.invalidStatusTransition(
        "COMPLETED",
        "REQUESTED"
      );

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe(
        "Cannot change status from COMPLETED to REQUESTED"
      );
      expect(error.extensions?.code).toBe("BUSINESS_RULE_VIOLATION");
    });

    it("should create table not available error", () => {
      const testDate = new Date("2024-01-15T19:00:00Z");
      const error = GraphQLErrors.tableNotAvailable(4, testDate);

      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe(
        "No table available for 4 people at 2024-01-15T19:00:00.000Z"
      );
      expect(error.extensions?.code).toBe("CONFLICT");
    });
  });

  describe("Error Extensions", () => {
    it("should include proper extensions in authentication error", () => {
      const error = GraphQLErrors.unauthenticated();

      expect(error.extensions).toEqual({
        code: "UNAUTHENTICATED",
      });
    });

    it("should include validation details in user input error", () => {
      const validationErrors = {
        email: "Required field",
        phone: "Invalid format",
      };
      const error = GraphQLErrors.invalidInput(
        "Multiple validation errors",
        validationErrors
      );

      expect(error.extensions).toEqual({
        code: "BAD_USER_INPUT",
        validationErrors,
      });
    });

    it("should include proper code in custom Apollo errors", () => {
      const error = GraphQLErrors.businessRule("Custom business rule");

      expect(error.extensions).toEqual({
        code: "BUSINESS_RULE_VIOLATION",
      });
    });
  });

  describe("Default Error Messages", () => {
    it("should use default authentication message", () => {
      const error = GraphQLErrors.unauthenticated();

      expect(error.message).toBe("Authentication required");
    });

    it("should use default forbidden message", () => {
      const error = GraphQLErrors.forbidden();

      expect(error.message).toBe("Insufficient permissions");
    });

    it("should use default reservation time message", () => {
      const error = GraphQLErrors.invalidReservationTime();

      expect(error.message).toBe("Invalid reservation time");
    });

    it("should use default reservation conflict message", () => {
      const error = GraphQLErrors.reservationConflict();

      expect(error.message).toBe("Reservation time conflict");
    });
  });

  describe("Error Inheritance", () => {
    it("should properly inherit from AuthenticationError", () => {
      const error = GraphQLErrors.unauthenticated("Custom message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApolloError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should properly inherit from ForbiddenError", () => {
      const error = GraphQLErrors.forbidden("Custom message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApolloError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.name).toBe("ForbiddenError");
    });

    it("should properly inherit from UserInputError", () => {
      const error = GraphQLErrors.invalidInput("Custom message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApolloError);
      expect(error).toBeInstanceOf(UserInputError);
      expect(error.name).toBe("UserInputError");
    });

    it("should properly inherit from ApolloError for custom errors", () => {
      const error = GraphQLErrors.businessRule("Custom message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApolloError);
      expect(error.name).toBe("BusinessRuleError");
    });
  });
});
