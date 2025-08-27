import {
  validateEmail,
  validatePhoneNumber,
  validateFutureDate,
  validateStringLength,
  validateNumberRange,
  combineValidationResults,
} from "../validation";

describe("validation utilities", () => {
  describe("validateEmail", () => {
    it("should validate correct email format", () => {
      const result = validateEmail("test@example.com");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty email", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "email",
        message: "Email is required",
        code: "REQUIRED",
      });
    });

    it("should reject invalid email format", () => {
      const result = validateEmail("invalid-email");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "email",
        message: "Invalid email format",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validatePhoneNumber", () => {
    it("should validate correct phone number formats", () => {
      const validPhones = [
        "+1234567890",
        "(123) 456-7890",
        "123-456-7890",
        "1234567890",
      ];

      validPhones.forEach((phone) => {
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it("should reject empty phone number", () => {
      const result = validatePhoneNumber("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "phone",
        message: "Phone number is required",
        code: "REQUIRED",
      });
    });

    it("should reject invalid phone number format", () => {
      const result = validatePhoneNumber("abc");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "phone",
        message: "Invalid phone number format",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validateFutureDate", () => {
    it("should validate future date", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = validateFutureDate(futureDate, "arrivalTime");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject past date", () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const result = validateFutureDate(pastDate, "arrivalTime");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "arrivalTime must be in the future",
        code: "INVALID_DATE",
      });
    });

    it("should reject null date", () => {
      const result = validateFutureDate(null as any, "arrivalTime");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "arrivalTime is required",
        code: "REQUIRED",
      });
    });
  });

  describe("validateStringLength", () => {
    it("should validate string within length limits", () => {
      const result = validateStringLength("test", "name", 2, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject string below minimum length", () => {
      const result = validateStringLength("a", "name", 2, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "name",
        message: "name must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    });

    it("should reject string above maximum length", () => {
      const result = validateStringLength("a".repeat(11), "name", 2, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "name",
        message: "name must not exceed 10 characters",
        code: "MAX_LENGTH",
      });
    });

    it("should handle optional strings", () => {
      const result = validateStringLength("", "notes", 0, 100, false);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateNumberRange", () => {
    it("should validate number within range", () => {
      const result = validateNumberRange(5, "tableSize", 1, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject number below minimum", () => {
      const result = validateNumberRange(0, "tableSize", 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "tableSize must be at least 1",
        code: "MIN_VALUE",
      });
    });

    it("should reject number above maximum", () => {
      const result = validateNumberRange(15, "tableSize", 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "tableSize must not exceed 10",
        code: "MAX_VALUE",
      });
    });

    it("should reject null/undefined values", () => {
      const result = validateNumberRange(null as any, "tableSize", 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "tableSize is required",
        code: "REQUIRED",
      });
    });
  });

  describe("combineValidationResults", () => {
    it("should combine multiple valid results", () => {
      const result1 = { isValid: true, errors: [] };
      const result2 = { isValid: true, errors: [] };

      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it("should combine results with errors", () => {
      const result1 = {
        isValid: false,
        errors: [{ field: "field1", message: "Error 1", code: "ERROR1" }],
      };
      const result2 = {
        isValid: false,
        errors: [{ field: "field2", message: "Error 2", code: "ERROR2" }],
      };

      const combined = combineValidationResults(result1, result2);
      expect(combined.isValid).toBe(false);
      expect(combined.errors).toHaveLength(2);
      expect(combined.errors).toContainEqual(result1.errors[0]);
      expect(combined.errors).toContainEqual(result2.errors[0]);
    });
  });
});
