import { BusinessValidation } from "../BusinessValidation";
import { ReservationStatus } from "../../types";

describe("BusinessValidation", () => {
  describe("validateTimeSlot", () => {
    it("should validate valid time slot", () => {
      // Tuesday at 7 PM, 2 hours from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      futureDate.setHours(19, 0, 0, 0); // 7 PM

      // Ensure it's not Monday
      if (futureDate.getDay() === 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }

      const result = BusinessValidation.validateTimeSlot(futureDate, 4);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject reservations less than 1 hour in advance", () => {
      const nearFuture = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const result = BusinessValidation.validateTimeSlot(nearFuture, 4);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Reservations must be made at least 1 hour in advance",
        code: "MIN_ADVANCE_TIME",
      });
    });

    it("should reject reservations more than 30 days in advance", () => {
      const farFuture = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31 days from now

      const result = BusinessValidation.validateTimeSlot(farFuture, 4);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Reservations cannot be made more than 30 days in advance",
        code: "MAX_ADVANCE_TIME",
      });
    });

    it("should reject reservations outside business hours", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM (before 11 AM)

      // Ensure it's not Monday
      if (tomorrow.getDay() === 1) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }

      const result = BusinessValidation.validateTimeSlot(tomorrow, 4);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message:
          "Reservations are only available between 11:00 AM and 10:00 PM",
        code: "OUTSIDE_BUSINESS_HOURS",
      });
    });

    it("should reject reservations on Mondays", () => {
      const nextMonday = new Date();
      const daysUntilMonday = (1 - nextMonday.getDay() + 7) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(19, 0, 0, 0); // 7 PM

      const result = BusinessValidation.validateTimeSlot(nextMonday, 4);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message: "Restaurant is closed on Mondays",
        code: "RESTAURANT_CLOSED",
      });
    });
  });

  describe("validateTableSize", () => {
    it("should validate valid table size", () => {
      const result = BusinessValidation.validateTableSize(4);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject table size less than 1", () => {
      const result = BusinessValidation.validateTableSize(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size must be at least 1 person",
        code: "MIN_TABLE_SIZE",
      });
    });

    it("should reject table size greater than 20", () => {
      const result = BusinessValidation.validateTableSize(25);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "tableSize",
        message: "Table size cannot exceed 20 people",
        code: "MAX_TABLE_SIZE",
      });
    });
  });

  describe("validateStatusTransition", () => {
    it("should allow REQUESTED to APPROVED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.REQUESTED,
        ReservationStatus.APPROVED
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow REQUESTED to CANCELLED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.REQUESTED,
        ReservationStatus.CANCELLED
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow APPROVED to COMPLETED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.APPROVED,
        ReservationStatus.COMPLETED
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow APPROVED to CANCELLED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.APPROVED,
        ReservationStatus.CANCELLED
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject REQUESTED to COMPLETED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.REQUESTED,
        ReservationStatus.COMPLETED
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Cannot change status from REQUESTED to COMPLETED",
        code: "INVALID_STATUS_TRANSITION",
      });
    });

    it("should reject transitions from CANCELLED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.CANCELLED,
        ReservationStatus.APPROVED
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Cannot change status from CANCELLED to APPROVED",
        code: "INVALID_STATUS_TRANSITION",
      });
    });

    it("should reject transitions from COMPLETED", () => {
      const result = BusinessValidation.validateStatusTransition(
        ReservationStatus.COMPLETED,
        ReservationStatus.CANCELLED
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Cannot change status from COMPLETED to CANCELLED",
        code: "INVALID_STATUS_TRANSITION",
      });
    });
  });

  describe("validateReservationModification", () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    it("should allow employee to modify REQUESTED reservation", () => {
      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.REQUESTED,
        futureTime,
        true
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow employee to modify APPROVED reservation", () => {
      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.APPROVED,
        futureTime,
        true
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject employee modification of COMPLETED reservation", () => {
      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.COMPLETED,
        futureTime,
        true
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Completed reservations cannot be modified",
        code: "RESERVATION_COMPLETED",
      });
    });

    it("should allow guest to modify REQUESTED reservation", () => {
      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.REQUESTED,
        futureTime,
        false
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject guest modification of CANCELLED reservation", () => {
      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.CANCELLED,
        futureTime,
        false
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Cancelled reservations cannot be modified",
        code: "RESERVATION_CANCELLED",
      });
    });

    it("should reject modification within 2 hours of arrival", () => {
      const soonTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const result = BusinessValidation.validateReservationModification(
        ReservationStatus.REQUESTED,
        soonTime,
        false
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message:
          "Reservations cannot be modified within 2 hours of arrival time",
        code: "TOO_CLOSE_TO_ARRIVAL",
      });
    });
  });

  describe("validateReservationCancellation", () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    it("should allow cancellation of REQUESTED reservation", () => {
      const result = BusinessValidation.validateReservationCancellation(
        ReservationStatus.REQUESTED,
        futureTime
      );
      expect(result.isValid).toBe(true);
    });

    it("should allow cancellation of APPROVED reservation", () => {
      const result = BusinessValidation.validateReservationCancellation(
        ReservationStatus.APPROVED,
        futureTime
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject cancellation of already CANCELLED reservation", () => {
      const result = BusinessValidation.validateReservationCancellation(
        ReservationStatus.CANCELLED,
        futureTime
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Reservation is already cancelled",
        code: "ALREADY_CANCELLED",
      });
    });

    it("should reject cancellation of COMPLETED reservation", () => {
      const result = BusinessValidation.validateReservationCancellation(
        ReservationStatus.COMPLETED,
        futureTime
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "status",
        message: "Completed reservations cannot be cancelled",
        code: "RESERVATION_COMPLETED",
      });
    });

    it("should reject cancellation within 30 minutes of arrival", () => {
      const soonTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const result = BusinessValidation.validateReservationCancellation(
        ReservationStatus.REQUESTED,
        soonTime
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message:
          "Reservations cannot be cancelled within 30 minutes of arrival time",
        code: "TOO_CLOSE_TO_ARRIVAL",
      });
    });
  });

  describe("checkLargePartyWarning", () => {
    it("should not require approval for small parties", () => {
      const result = BusinessValidation.checkLargePartyWarning(4);
      expect(result.requiresApproval).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it("should require approval for large parties", () => {
      const result = BusinessValidation.checkLargePartyWarning(10);
      expect(result.requiresApproval).toBe(true);
      expect(result.message).toBe(
        "Large parties (8+ people) may require special arrangements and longer preparation time"
      );
    });

    it("should require approval for exactly 8 people", () => {
      const result = BusinessValidation.checkLargePartyWarning(8);
      expect(result.requiresApproval).toBe(true);
    });
  });

  describe("validateReservationTiming", () => {
    it("should validate timing without conflicts", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(19, 0, 0, 0);

      // Ensure it's not Monday
      if (futureDate.getDay() === 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }

      const result = BusinessValidation.validateReservationTiming(
        futureDate,
        4,
        []
      );
      expect(result.isValid).toBe(true);
    });

    it("should detect potential conflicts with large reservations", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(19, 0, 0, 0);

      // Ensure it's not Monday
      if (futureDate.getDay() === 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }

      const conflictingReservation = new Date(
        futureDate.getTime() + 30 * 60 * 1000
      ); // 30 minutes later

      const result = BusinessValidation.validateReservationTiming(
        futureDate,
        10,
        [{ arrivalTime: conflictingReservation, tableSize: 8 }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "arrivalTime",
        message:
          "This time slot may have limited availability due to other large reservations",
        code: "POTENTIAL_CONFLICT",
      });
    });
  });
});
