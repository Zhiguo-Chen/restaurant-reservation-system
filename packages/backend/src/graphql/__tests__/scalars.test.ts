import { DateTimeScalar } from "../scalars";
import { GraphQLError } from "graphql";
import { Kind } from "graphql/language";

describe("DateTimeScalar", () => {
  describe("serialize", () => {
    it("should serialize Date object to ISO string", () => {
      const date = new Date("2024-01-01T12:00:00.000Z");
      const result = DateTimeScalar.serialize(date);
      expect(result).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should serialize valid date string to ISO string", () => {
      const dateString = "2024-01-01T12:00:00.000Z";
      const result = DateTimeScalar.serialize(dateString);
      expect(result).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should throw error for invalid date string", () => {
      expect(() => DateTimeScalar.serialize("invalid-date")).toThrow(
        GraphQLError
      );
    });

    it("should throw error for non-date value", () => {
      expect(() => DateTimeScalar.serialize(123)).toThrow(GraphQLError);
    });
  });

  describe("parseValue", () => {
    it("should parse valid date string to Date object", () => {
      const result = DateTimeScalar.parseValue("2024-01-01T12:00:00.000Z");
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should parse Date object to Date object", () => {
      const date = new Date("2024-01-01T12:00:00.000Z");
      const result = DateTimeScalar.parseValue(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should parse number timestamp to Date object", () => {
      const timestamp = 1704110400000; // 2024-01-01T12:00:00.000Z
      const result = DateTimeScalar.parseValue(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should throw error for invalid date string", () => {
      expect(() => DateTimeScalar.parseValue("invalid-date")).toThrow(
        GraphQLError
      );
    });

    it("should throw error for invalid value type", () => {
      expect(() => DateTimeScalar.parseValue({})).toThrow(GraphQLError);
    });
  });

  describe("parseLiteral", () => {
    it("should parse string literal to Date object", () => {
      const ast = {
        kind: Kind.STRING,
        value: "2024-01-01T12:00:00.000Z",
      };
      const result = DateTimeScalar.parseLiteral(ast);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should parse int literal to Date object", () => {
      const ast = {
        kind: Kind.INT,
        value: "1704110400000", // 2024-01-01T12:00:00.000Z
      };
      const result = DateTimeScalar.parseLiteral(ast);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should throw error for invalid date string literal", () => {
      const ast = {
        kind: Kind.STRING,
        value: "invalid-date",
      };
      expect(() => DateTimeScalar.parseLiteral(ast)).toThrow(GraphQLError);
    });

    it("should throw error for unsupported literal kind", () => {
      const ast = {
        kind: Kind.BOOLEAN,
        value: true,
      } as any;
      expect(() => DateTimeScalar.parseLiteral(ast)).toThrow(GraphQLError);
    });
  });
});
