import { ValidationService } from "../ValidationService";
import {
  CreateReservationData,
  UpdateReservationData,
  ReservationStatus,
} from "@restaurant-reservation/shared";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("ValidationService", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    jest.clearAllMocks();
  });

  describe("validateReservationData", () => {
    const validData: CreateReservationData = {
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "Birthday dinner",
    };

    it("should validate correct reservation data", () => {
      const result = validationService.validateReservationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty guest name", () => {
      const invalidData = { ...validData, guestName: "" };
      const result = validationService.validateReservationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name is required",
        code: "REQUIRED_FIELD",
      });
    });

    it("should reject guest name that is too short", () => {
      const invalidData = { ...validData, guestName: "A" };
      const result = validationService.validateReservationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    });

    it("should reject guest name that is too long", () => {
      const invalidData = { ...validData, guestName: "A".repeat(101) };
      const result = validationService.validateReservationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestName",
        message: "Guest name must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    });

    it("should reject notes that are too long", () => {
      const invalidData = { ...validData, notes: "A".repeat(501) };
      const result = validationService.validateReservationData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "notes",
        message: "Notes must not exceed 500 characters",
        code: "MAX_LENGTH",
      });
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email", () => {
      const result = validationService.validateEmail("john@example.com");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty email", () => {
      const result = validationService.validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestEmail",
        message: "Email is required",
        code: "REQUIRED_FIELD",
      });
    });

    it("should reject invalid email format", () => {
      const result = validationService.validateEmail("invalid-email");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestEmail",
        message: "Invalid email format",
        code: "INVALID_FORMAT",
      });
    });

    it("should reject email that is too long", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validationService.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestEmail",
        message: "Email must not exceed 254 characters",
        code: "MAX_LENGTH",
      });
    });
  });

  describe("validatePhone", () => {
    it("should validate correct phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "1234567890",
        "+44 20 7946 0958",
        "(555) 123-4567",
      ];

      validPhones.forEach((phone) => {
        const result = validationService.validatePhone(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it("should reject empty phone", () => {
      const result = validationService.validatePhone("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "guestPhone",
        message: "Phone number is required",
        code: "REQUIRED_FIELD",
      });
    });

    it("should reject invalid phone formats", () => {
      const invalidPhones = [
        "123",
        "abc123",
        "123-456-789a",
        "+",
        "0123456789", // Starts with 0
      ];

      invalidPhones.forEach((phone) => {
        const result = validationService.validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: "guestPhone",
          message:
            "Invalid phone number format. Use international format (+1234567890) or local format (1234567890)",
          code: "INVALID_FORMAT",
        });
      });
    });
  });

  describe("validateArrivalTime", () => {
    it("should validate future arrival time within business hours", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 1);
      futureTime.setHours(19, 0, 0, 0); // 7 PM tomorrow

      const result = validationService.validateArrivalTime(futureTime);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject past arrival time", () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      const result = validationService.validateArrivalTime(pastTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Arrival time must be in the future",
        code: "INVALID_DATE_RANGE",
      });
    });

    it("should reject arrival time outside business hours", () => {
      const earlyTime = new Date();
      earlyTime.setDate(earlyTime.getDate() + 1);
      earlyTime.setHours(8, 0, 0, 0); // 8 AM tomorrow

      const result = validationService.validateArrivalTime(earlyTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message:
          "Reservations are only available between 10:00 AM and 10:00 PM",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    });

    it("should reject arrival time too far in the future", () => {
      const farFutureTime = new Date();
      farFutureTime.setMonth(farFutureTime.getMonth() + 7); // 7 months from now
      farFutureTime.setHours(19, 0, 0, 0);

      const result = validationService.validateArrivalTime(farFutureTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Reservations can only be made up to 6 months in advance",
        code: "TOO_FAR_FUTURE",
      });
    });

    it("should reject invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = validationService.validateArrivalTime(invalidDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Invalid date format",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validateTableSize", () => {
    it("should validate correct table sizes", () => {
      const validSizes = [1, 2, 4, 6, 8, 10, 12];

      validSizes.forEach((size) => {
        const result = validationService.validateTableSize(size);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should reject table size less than 1", () => {
      const result = validationService.validateTableSize(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size must be at least 1",
        code: "MIN_VALUE",
      });
    });

    it("should reject table size greater than 12", () => {
      const result = validationService.validateTableSize(15);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size cannot exceed 12 people",
        code: "MAX_VALUE",
      });
    });

    it("should reject non-integer table size", () => {
      const result = validationService.validateTableSize(4.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size must be a whole number",
        code: "INVALID_TYPE",
      });
    });

    it("should reject undefined table size", () => {
      const result = validationService.validateTableSize(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size is required",
        code: "REQUIRED_FIELD",
      });
    });
  });

  describe("validateTimeSlot", () => {
    it("should validate available time slot", async () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 1);
      futureTime.setHours(19, 0, 0, 0); // 7 PM tomorrow (Wednesday)

      const result = await validationService.validateTimeSlot(futureTime, 4);
      expect(result).toBe(true);
    });

    it("should reject large parties on weekend evenings", async () => {
      const fridayEvening = new Date();
      // Set to next Friday
      const daysUntilFriday = (5 - fridayEvening.getDay() + 7) % 7;
      fridayEvening.setDate(fridayEvening.getDate() + daysUntilFriday);
      fridayEvening.setHours(19, 0, 0, 0); // 7 PM Friday

      const result = await validationService.validateTimeSlot(
        fridayEvening,
        10
      );
      expect(result).toBe(false);
    });

    it("should reject reservations during break time", async () => {
      const breakTime = new Date();
      breakTime.setDate(breakTime.getDate() + 1);
      breakTime.setHours(15, 30, 0, 0); // 3:30 PM tomorrow

      const result = await validationService.validateTimeSlot(breakTime, 4);
      expect(result).toBe(false);
    });

    it("should handle invalid input gracefully", async () => {
      const invalidTime = new Date("invalid");
      const result = await validationService.validateTimeSlot(invalidTime, 4);
      expect(result).toBe(false);
    });
  });

  describe("validateStatusTransition", () => {
    it("should allow valid status transitions", () => {
      const validTransitions = [
        [ReservationStatus.REQUESTED, ReservationStatus.APPROVED],
        [ReservationStatus.REQUESTED, ReservationStatus.CANCELLED],
        [ReservationStatus.APPROVED, ReservationStatus.COMPLETED],
        [ReservationStatus.APPROVED, ReservationStatus.CANCELLED],
      ];

      validTransitions.forEach(([from, to]) => {
        const result = validationService.validateStatusTransition(from, to);
        expect(result).toBe(true);
      });
    });

    it("should reject invalid status transitions", () => {
      const invalidTransitions = [
        [ReservationStatus.CANCELLED, ReservationStatus.APPROVED],
        [ReservationStatus.COMPLETED, ReservationStatus.REQUESTED],
        [ReservationStatus.COMPLETED, ReservationStatus.APPROVED],
        [ReservationStatus.CANCELLED, ReservationStatus.COMPLETED],
      ];

      invalidTransitions.forEach(([from, to]) => {
        const result = validationService.validateStatusTransition(from, to);
        expect(result).toBe(false);
      });
    });
  });

  describe("validateReservationId", () => {
    it("should validate correct reservation ID format", () => {
      const validIds = [
        "RES_123_ABC",
        "RES_TIMESTAMP_RANDOM",
        "RES_1234567890_ABCDEF",
      ];

      validIds.forEach((id) => {
        const result = validationService.validateReservationId(id);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should reject invalid reservation ID formats", () => {
      const invalidIds = [
        "123",
        "reservation_123",
        "RES-123-ABC",
        "res_123_abc",
      ];

      invalidIds.forEach((id) => {
        const result = validationService.validateReservationId(id);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: "id",
          message: "Invalid reservation ID format",
          code: "INVALID_FORMAT",
        });
      });
    });

    it("should reject empty reservation ID", () => {
      const result = validationService.validateReservationId("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "id",
        message: "Reservation ID is required",
        code: "REQUIRED_FIELD",
      });
    });
  });

  describe("validatePaginationParams", () => {
    it("should validate correct pagination parameters", () => {
      const result = validationService.validatePaginationParams(1, 20);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid page numbers", () => {
      const invalidPages = [0, -1, 1.5];

      invalidPages.forEach((page) => {
        const result = validationService.validatePaginationParams(page, 20);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: "page",
          message: "Page must be a positive integer",
          code: "INVALID_VALUE",
        });
      });
    });

    it("should reject invalid limit values", () => {
      const result = validationService.validatePaginationParams(1, 150);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "limit",
        message: "Limit cannot exceed 100",
        code: "MAX_VALUE",
      });
    });
  });

  describe("validateDateRange", () => {
    it("should validate correct date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const result = validationService.validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject start date after end date", () => {
      const startDate = new Date("2024-01-31");
      const endDate = new Date("2024-01-01");

      const result = validationService.validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "dateRange",
        message: "Start date must be before end date",
        code: "INVALID_DATE_RANGE",
      });
    });

    it("should reject date range that is too large", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2025-01-02"); // More than 365 days

      const result = validationService.validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "dateRange",
        message: "Date range cannot exceed 365 days",
        code: "DATE_RANGE_TOO_LARGE",
      });
    });

    it("should reject invalid dates", () => {
      const invalidDate = new Date("invalid");
      const validDate = new Date("2024-01-01");

      const result = validationService.validateDateRange(
        invalidDate,
        validDate
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "startDate",
        message: "Invalid start date format",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validateSearchQuery", () => {
    it("should validate correct search query", () => {
      const result = validationService.validateSearchQuery("John Doe");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty search query", () => {
      const result = validationService.validateSearchQuery("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "query",
        message: "Search query is required",
        code: "REQUIRED_FIELD",
      });
    });

    it("should reject search query that is too short", () => {
      const result = validationService.validateSearchQuery("A");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "query",
        message: "Search query must be at least 2 characters long",
        code: "MIN_LENGTH",
      });
    });

    it("should reject search query that is too long", () => {
      const longQuery = "A".repeat(101);
      const result = validationService.validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "query",
        message: "Search query must not exceed 100 characters",
        code: "MAX_LENGTH",
      });
    });
  });

  describe("sanitizeInput", () => {
    it("should sanitize dangerous characters", () => {
      const input = '<script>alert("xss")</script>';
      const result = validationService.sanitizeInput(input);
      expect(result).toBe("scriptalert(xss)/script");
    });

    it("should remove quotes and backslashes", () => {
      const input = 'Hello "world" and \\backslash';
      const result = validationService.sanitizeInput(input);
      expect(result).toBe("Hello world and backslash");
    });

    it("should limit input length", () => {
      const longInput = "A".repeat(1500);
      const result = validationService.sanitizeInput(longInput);
      expect(result.length).toBe(1000);
    });

    it("should handle empty input", () => {
      const result = validationService.sanitizeInput("");
      expect(result).toBe("");
    });
  });

  describe("formatValidationErrors", () => {
    it("should format single validation error", () => {
      const errors = [
        {
          field: "email",
          message: "Invalid email format",
          code: "INVALID_FORMAT",
        },
      ];

      const result = validationService.formatValidationErrors(errors);
      expect(result).toEqual({
        message: "Invalid email format",
        details: errors,
        code: "VALIDATION_ERROR",
      });
    });

    it("should format multiple validation errors", () => {
      const errors = [
        { field: "email", message: "Invalid email", code: "INVALID_FORMAT" },
        { field: "phone", message: "Invalid phone", code: "INVALID_FORMAT" },
      ];

      const result = validationService.formatValidationErrors(errors);
      expect(result).toEqual({
        message: "Validation failed with 2 errors",
        details: errors,
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("validateUpdateReservationData", () => {
    it("should validate correct update data", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 1);
      futureTime.setHours(19, 0, 0, 0);

      const updateData: UpdateReservationData = {
        arrivalTime: futureTime,
        tableSize: 6,
        notes: "Updated notes",
        updatedAt: new Date(),
        updatedBy: "user-123",
      };

      const result =
        validationService.validateUpdateReservationData(updateData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate update data with only some fields", () => {
      const updateData: UpdateReservationData = {
        notes: "Just updating notes",
        updatedAt: new Date(),
        updatedBy: "user-123",
      };

      const result =
        validationService.validateUpdateReservationData(updateData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid arrival time in update", () => {
      const pastTime = new Date();
      pastTime.setHours(pastTime.getHours() - 1);

      const updateData: UpdateReservationData = {
        arrivalTime: pastTime,
        updatedAt: new Date(),
        updatedBy: "user-123",
      };

      const result =
        validationService.validateUpdateReservationData(updateData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Arrival time must be in the future",
        code: "INVALID_DATE_RANGE",
      });
    });
  });

  describe("validateMultipleFields", () => {
    it("should validate multiple fields successfully", () => {
      const validations = [
        {
          field: "email",
          validation: validationService.validateEmail("test@example.com"),
        },
        {
          field: "phone",
          validation: validationService.validatePhone("+1234567890"),
        },
      ];

      const result = validationService.validateMultipleFields(validations);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine errors from multiple field validations", () => {
      const validations = [
        {
          field: "email",
          validation: validationService.validateEmail("invalid-email"),
        },
        {
          field: "phone",
          validation: validationService.validatePhone("123"),
        },
      ];

      const result = validationService.validateMultipleFields(validations);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].field).toBe("guestEmail");
      expect(result.errors[1].field).toBe("guestPhone");
    });
  });

  describe("validateBusinessHours", () => {
    it("should validate time within business hours", () => {
      const businessTime = new Date();
      businessTime.setHours(15, 0, 0, 0); // 3 PM
      businessTime.setDate(businessTime.getDate() + 1); // Tomorrow (not Monday)

      const result = validationService.validateBusinessHours(businessTime);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject time outside business hours", () => {
      const earlyTime = new Date();
      earlyTime.setHours(8, 0, 0, 0); // 8 AM
      earlyTime.setDate(earlyTime.getDate() + 1);

      const result = validationService.validateBusinessHours(earlyTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "date",
        message: "Time must be within business hours (10:00 AM - 10:00 PM)",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    });

    it("should reject Monday (closed day)", () => {
      const monday = new Date();
      // Set to next Monday
      const daysUntilMonday = (1 - monday.getDay() + 7) % 7;
      monday.setDate(monday.getDate() + daysUntilMonday);
      monday.setHours(15, 0, 0, 0); // 3 PM

      const result = validationService.validateBusinessHours(monday);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "date",
        message: "Restaurant is closed on Mondays",
        code: "CLOSED_DAY",
      });
    });

    it("should reject invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = validationService.validateBusinessHours(invalidDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "date",
        message: "Invalid date provided",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validateFutureDate", () => {
    it("should validate future date", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const result = validationService.validateFutureDate(futureDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject past date", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = validationService.validateFutureDate(pastDate, "testDate");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "testDate",
        message: "Date must be in the future",
        code: "INVALID_DATE_RANGE",
      });
    });

    it("should reject invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = validationService.validateFutureDate(invalidDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "date",
        message: "Invalid date provided",
        code: "INVALID_FORMAT",
      });
    });
  });

  describe("validateReservationCapacity", () => {
    it("should validate normal reservation capacity", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 1);
      futureTime.setHours(19, 0, 0, 0);

      const result = validationService.validateReservationCapacity(
        4,
        futureTime
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject large parties without advance notice", () => {
      const soonTime = new Date();
      soonTime.setHours(soonTime.getHours() + 12); // 12 hours from now (less than 24)
      // Ensure it's within business hours
      if (soonTime.getHours() < 10) {
        soonTime.setHours(15); // 3 PM
      } else if (soonTime.getHours() >= 22) {
        soonTime.setHours(19); // 7 PM
      }

      const result = validationService.validateReservationCapacity(9, soonTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message:
          "Large parties (9+ people) require at least 24 hours advance notice",
        code: "ADVANCE_NOTICE_REQUIRED",
      });
    });

    it("should allow large parties with advance notice", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 2); // 2 days from now
      futureTime.setHours(19, 0, 0, 0);

      const result = validationService.validateReservationCapacity(
        9,
        futureTime
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject very large parties requiring special approval", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 2);
      futureTime.setHours(19, 0, 0, 0);

      const result = validationService.validateReservationCapacity(
        12,
        futureTime
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message:
          "Parties larger than 10 people require special approval. Please call the restaurant.",
        code: "SPECIAL_APPROVAL_REQUIRED",
      });
    });

    it("should propagate basic validation errors", () => {
      const invalidTime = new Date("invalid");
      const result = validationService.validateReservationCapacity(
        4,
        invalidTime
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
