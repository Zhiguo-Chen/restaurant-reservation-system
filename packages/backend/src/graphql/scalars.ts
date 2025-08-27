import { GraphQLScalarType, GraphQLError } from "graphql";
import { Kind } from "graphql/language";

/**
 * Custom DateTime scalar for GraphQL
 * Handles Date objects and ISO date strings
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "Date custom scalar type",

  serialize(value: unknown): string {
    // Convert outgoing Date to ISO string
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      // Validate that it's a valid date string
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid date string: ${value}`);
      }
      return date.toISOString();
    }

    throw new GraphQLError(
      `Value must be a Date object or ISO date string: ${value}`
    );
  },

  parseValue(value: unknown): Date {
    // Convert incoming value to Date
    if (typeof value === "string") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid date string: ${value}`);
      }
      return date;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "number") {
      return new Date(value);
    }

    throw new GraphQLError(`Value must be a valid date: ${value}`);
  },

  parseLiteral(ast): Date {
    // Convert AST literal to Date
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Invalid date string: ${ast.value}`);
      }
      return date;
    }

    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }

    throw new GraphQLError(
      `Can only parse strings and integers to dates but got a: ${ast.kind}`
    );
  },
});

export const scalarResolvers = {
  DateTime: DateTimeScalar,
};
