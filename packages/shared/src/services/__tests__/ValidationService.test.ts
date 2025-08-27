import { ValidationService } from "../ValidationService";
import { ReservationStatus } from "../../types";

describe("ValidationService", () => {
  describe("validateReservationData", () => {
    const validReservationData = {
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Ensure the arrival time is not on Monday
      const arrivalTime = validReservationData.arrivalTime;
      if (arrivalTime.getDay() === 1) {
        // Monday
        arrivalTime.setDate(arrivalTime.getDate() + 1);
      }
      // Ensure it's during business hours
      arrivalTime.setHours(19, 0, 0, 0); // 7 PM
    });

    it("should validate complete reservation data successfully", () => {
      const result =
        ValidationService.validateReservationData(validReservationData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should combine model and business validation errors", () => {
      const invalidData = {
        ...validReservationData,
        guestName: "", // Model validation error
        arrivalTime: new Date(Date.now() + 30 * 60 * 1000), // Business validation error (too soon)
      };

      const result = ValidationService.validateReservationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);

      // Should have both model and business validation errors
      expect(result.errors.some((e) => e.field === "guestName")).toBe(true);
      expect(result.errors.some((e) => e.field === "arrivalTime")).toBe(true);
    });
  });

  describe("validateTimeSlot", () => {
    it("should validate available time slot", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(19, 0, 0, 0);

      // Ensure it's not Monday
      if (futureDate.getDay() === 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }

      const result = await ValidationService.validateTimeSlot(
        futureDate,
        4,
        []
      );
      expect(result.isValid).toBe(true);
    });

    it("should detect conflicts with existing reservations", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(19, 0, 0, 0);

      // Ensure it's not Monday
      if (futureDate.getDay() === 1) {
        futureDate.setDate(futureDate.getDate() + 1);
      }

      const conflictingReservation = new Date(
        futureDate.getTime() + 30 * 60 * 1000
      );

      const result = await ValidationService.validateTimeSlot(futureDate, 10, [
        { arrivalTime: conflictingReservation, tableSize: 8 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "POTENTIAL_CONFLICT")).toBe(
        true
      );
    });
  });

  describe("validateStatusTransition", () => {
    it("should allow valid status transitions", () => {
      const result = ValidationService.validateStatusTransition(
        ReservationStatus.REQUESTED,
        ReservationStatus.APPROVED
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid status transitions", () => {
      const result = ValidationService.validateStatusTransition(
        ReservationStatus.COMPLETED,
        ReservationStatus.REQUESTED
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateReservationModification", () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    it("should allow employee modifications", () => {
      const result = ValidationService.validateReservationModification(
        ReservationStatus.APPROVED,
        futureTime,
        true
      );
      expect(result.isValid).toBe(true);
    });

    it("should restrict guest modifications", () => {
      const result = ValidationService.validateReservationModification(
        ReservationStatus.CANCELLED,
        futureTime,
        false
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateReservationCancellation", () => {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    it("should allow cancellation of active reservations", () => {
      const result = ValidationService.validateReservationCancellation(
        ReservationStatus.APPROVED,
        futureTime
      );
      expect(result.isValid).toBe(true);
    });

    it("should reject cancellation of completed reservations", () => {
      const result = ValidationService.validateReservationCancellation(
        ReservationStatus.COMPLETED,
        futureTime
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe("checkLargePartyWarning", () => {
    it("should not warn for small parties", () => {
      const result = ValidationService.checkLargePartyWarning(4);
      expect(result.requiresApproval).toBe(false);
    });

    it("should warn for large parties", () => {
      const result = ValidationService.checkLargePartyWarning(10);
      expect(result.requiresApproval).toBe(true);
      expect(result.message).toContain("Large parties");
    });
  });

  describe("validateReservationUpdate", () => {
    const currentReservation = {
      status: ReservationStatus.REQUESTED,
      arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it("should validate successful update", () => {
      const futureTime = new Date();
      futureTime.setDate(futureTime.getDate() + 2);
      futureTime.setHours(19, 0, 0, 0);

      // Ensure it's not Monday
      if (futureTime.getDay() === 1) {
        futureTime.setDate(futureTime.getDate() + 1);
      }

      const updateData = {
        arrivalTime: futureTime,
        tableSize: 6,
      };

      const result = ValidationService.validateReservationUpdate(
        currentReservation,
        updateData,
        false
      );

      expect(result.isValid).toBe(true);
    });

    it("should reject update with invalid data", () => {
      const updateData = {
        tableSize: 25, // Exceeds maximum
      };

      const result = ValidationService.validateReservationUpdate(
        currentReservation,
        updateData,
        false
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "MAX_TABLE_SIZE")).toBe(true);
    });

    it("should reject update of cancelled reservation", () => {
      const cancelledReservation = {
        ...currentReservation,
        status: ReservationStatus.CANCELLED,
      };

      const updateData = {
        tableSize: 4,
      };

      const result = ValidationService.validateReservationUpdate(
        cancelledReservation,
        updateData,
        false
      );

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "RESERVATION_CANCELLED")
      ).toBe(true);
    });
  });
});
